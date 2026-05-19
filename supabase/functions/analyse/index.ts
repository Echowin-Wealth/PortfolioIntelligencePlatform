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

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const isAdmin = req.headers.get('x-admin-token') === 'true';
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  // ── Parse request body ────────────────────────────────────────────────────
  let body: { text?: string; reportMeta?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const text = body.text ?? '';
  if (!text || text.length < 100) {
    return new Response(JSON.stringify({ error: 'No usable PDF text provided' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Rate limiting runs only for requests that will actually call Anthropic,
  // so metadata-only POSTs (short `text`, returns 400 above) don't burn quota.
  if (!isAdmin) {
    const ipHash = await sha256(ip);
    const today = new Date().toISOString().split('T')[0];

    const { data: rateLimitRow } = await supabase
      .from('rate_limits')
      .select('count')
      .eq('ip_hash', ipHash)
      .eq('window_date', today)
      .single();

    const currentCount = (rateLimitRow?.count as number) ?? 0;

    if (currentCount >= DAILY_LIMIT) {
      return new Response(
        JSON.stringify({
          error: 'rate_limit',
          message: `You've reached the limit of ${DAILY_LIMIT} free reports per day. Please try again tomorrow.`,
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    await supabase.from('rate_limits').upsert(
      { ip_hash: ipHash, count: currentCount + 1, window_date: today },
      { onConflict: 'ip_hash,window_date' }
    );
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
        model: 'claude-sonnet-4-20250514',
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
    return new Response(
      JSON.stringify({ error: 'Anthropic API error', details: e.details }),
      { status: e.status ?? 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  getNirixa()?.flush().catch(() => {});

  const raw = anthropicData.content[0]?.text?.trim()
    .replace(/^```(?:json)?\s*/, '')
    .replace(/\s*```\s*$/, '') ?? '';

  let funds: unknown[];
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
    return new Response(
      JSON.stringify({ error: 'Claude returned invalid JSON. Please try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // ── Log to report_history (best-effort) ──────────────────────────────────
  if (body.reportMeta) {
    supabase.from('report_history').insert({
      ...body.reportMeta,
      generated_by: isAdmin ? 'admin' : 'client',
    }).then(() => {}).catch(() => {});
  }

  return new Response(JSON.stringify({ funds }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
