import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { NirixaClient } from 'npm:nirixa';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const NIRIXA_API_KEY = Deno.env.get('NIRIXA_API_KEY') ?? '';
const DAILY_LIMIT = 3;

let nirixa: NirixaClient | null = null;
function getNirixa(): NirixaClient | null {
  if (!NIRIXA_API_KEY) return null;
  if (!nirixa) {
    nirixa = new NirixaClient({
      apiKey: NIRIXA_API_KEY,
      captureResponse: true,
    });
  }
  return nirixa;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const isAdmin = req.headers.get('x-admin-token') === 'true';

  // ── Parse request body ────────────────────────────────────────────────────
  let body: { text?: string; reportMeta?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const text = body.text ?? '';
  if (!text || text.length < 100) {
    return jsonResponse({ error: 'No usable PDF text provided' }, 400);
  }

  // ── Authenticate user (skipped for admin-token requests from /admin/generate)
  let userId: string | null = null;
  if (!isAdmin) {
    const authHeader = req.headers.get('Authorization') ?? '';
    const token = authHeader.replace(/^Bearer\s+/i, '');
    if (!token) {
      return jsonResponse({ error: 'unauthorized' }, 401);
    }
    const { data: userResp, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userResp.user) {
      return jsonResponse({ error: 'unauthorized' }, 401);
    }
    userId = userResp.user.id;

    // Per-user daily limit: count rows already created today for this user.
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);
    const { count } = await supabase
      .from('report_history')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startOfDay.toISOString());
    if ((count ?? 0) >= DAILY_LIMIT) {
      return jsonResponse(
        {
          error: 'rate_limit',
          message: `You've reached the limit of ${DAILY_LIMIT} reports per day. Please try again tomorrow.`,
        },
        429
      );
    }
  }

  // ── Call Anthropic ────────────────────────────────────────────────────────
  const extractionPrompt = `You are an expert mutual fund analyst. Extract ALL fund positions from this Echowin Wealth Report PDF text.

Return a JSON array where each item has:
- name: Full fund name (e.g. "Kotak Mid Cap Fund Growth")
- category: Fund category (e.g. "Equity - Mid Cap Fund", "Debt - Low Duration Fund", "Hybrid - Aggressive Hybrid Fund", "FOF - Domestic", "Equity - Large & Mid Cap Fund")
- inv_date: Investment date as shown (e.g. "14-Jun-23", "03-Jan-25")
- days: Number of days held as integer (from "(NNN Days)" in PDF)
- fund_xirr: XIRR as a number (e.g. 15.49, -7.05). This is the LAST percentage in each fund's row.
- investor_name: The client/investor name for this section

Rules:
1. Extract EVERY fund that has a days value and XIRR
2. Skip rows labelled "Total" or "Grand Total"
3. For family reports with multiple members, extract ALL members
4. If same fund appears multiple times (different folios/dates), include each separately
5. Return ONLY valid JSON array — no markdown, no explanation

PDF TEXT:
${text.substring(0, 90000)}`;

  type AnthropicData = {
    content: Array<{ type: string; text: string }>;
    usage?: { input_tokens: number; output_tokens: number };
    model?: string;
  };

  const callAnthropic = async (): Promise<AnthropicData> => {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 8000,
        messages: [{ role: 'user', content: extractionPrompt }],
      }),
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      const e = new Error('anthropic_error') as Error & {
        details?: unknown;
        status?: number;
      };
      e.details = (errBody as Record<string, unknown>)?.error;
      e.status = res.status;
      throw e;
    }
    return await res.json() as AnthropicData;
  };

  let anthropicData: AnthropicData;
  try {
    const nx = getNirixa();
    anthropicData = nx
      ? await nx.track({
          feature: 'analyse/extract-funds',
          prompt: extractionPrompt,
          fn: callAnthropic,
        })
      : await callAnthropic();
  } catch (err) {
    const e = err as { status?: number; details?: unknown };
    return jsonResponse(
      { error: 'Anthropic API error', details: e.details },
      e.status ?? 502
    );
  }

  getNirixa()?.flush().catch(() => {});

  const raw = anthropicData.content[0]?.text?.trim()
    .replace(/^```(?:json)?\s*/, '')
    .replace(/\s*```\s*$/, '') ?? '';

  let funds: Array<Record<string, unknown>>;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      funds = parsed;
    } else {
      const match = raw.match(/\[[\s\S]+\]/);
      if (match) funds = JSON.parse(match[0]);
      else throw new Error('No array found');
    }
  } catch {
    return jsonResponse(
      { error: 'Claude returned invalid JSON. Please try again.' },
      500
    );
  }

  // ── Persist a skeleton row. Client patches alpha metrics via RLS update.
  const investor =
    (funds[0]?.investor_name as string | undefined)?.trim() || 'Client';
  let reportId: string | null = null;
  const { data: inserted, error: insertErr } = await supabase
    .from('report_history')
    .insert({
      user_id: userId,
      investor,
      fund_count: funds.length,
      funds_json: funds,
      generated_by: isAdmin ? 'admin' : 'client',
    })
    .select('id')
    .single();
  if (insertErr) {
    // Surface, but don't block the user from seeing their funds.
    console.error('report_history insert failed', insertErr);
  } else {
    reportId = (inserted as { id: string }).id;
  }

  return jsonResponse({ funds, reportId }, 200);
});
