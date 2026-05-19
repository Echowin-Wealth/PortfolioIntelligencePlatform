import type { jsPDF } from 'jspdf';

const FONT_FAMILY_INTER = 'Inter';
const FONT_FAMILY_FALLBACK = 'helvetica';

type CacheEntry = { regular: string; bold: string } | null;
let cache: CacheEntry | undefined;

function looksLikeTTF(bytes: Uint8Array): boolean {
  if (bytes.length < 4) return false;
  // Valid sfnt headers: 00 01 00 00 (TrueType), 'OTTO' (OpenType CFF),
  // 'true' (legacy Mac TT), 'ttcf' (TTC collection).
  const b0 = bytes[0], b1 = bytes[1], b2 = bytes[2], b3 = bytes[3];
  if (b0 === 0x00 && b1 === 0x01 && b2 === 0x00 && b3 === 0x00) return true;
  const tag = String.fromCharCode(b0, b1, b2, b3);
  return tag === 'OTTO' || tag === 'true' || tag === 'ttcf';
}

async function fetchAsBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    const bytes = new Uint8Array(buf);
    // Guard against Vite's SPA fallback serving index.html for missing assets.
    if (!looksLikeTTF(bytes)) return null;
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  } catch {
    return null;
  }
}

async function loadInter(): Promise<CacheEntry> {
  if (cache !== undefined) return cache;
  const [regular, bold] = await Promise.all([
    fetchAsBase64('/fonts/Inter-Regular.ttf'),
    fetchAsBase64('/fonts/Inter-Bold.ttf'),
  ]);
  cache = regular && bold ? { regular, bold } : null;
  return cache;
}

export async function registerReportFont(doc: jsPDF): Promise<string> {
  const fonts = await loadInter();
  if (!fonts) return FONT_FAMILY_FALLBACK;
  doc.addFileToVFS('Inter-Regular.ttf', fonts.regular);
  doc.addFileToVFS('Inter-Bold.ttf', fonts.bold);
  doc.addFont('Inter-Regular.ttf', FONT_FAMILY_INTER, 'normal');
  doc.addFont('Inter-Bold.ttf', FONT_FAMILY_INTER, 'bold');
  return FONT_FAMILY_INTER;
}
