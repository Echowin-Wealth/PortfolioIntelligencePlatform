import * as XLSX from 'xlsx';

/**
 * Read an .xlsx/.xls workbook entirely in the browser and flatten every
 * non-empty sheet to CSV text. The output mirrors what `pdfExtract` produces:
 * plain tabular text that the edge function hands to Claude for extraction.
 */
export async function extractExcelText(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });

  let txt = '';
  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];
    if (!sheet) continue;
    const csv = XLSX.utils.sheet_to_csv(sheet, { blankrows: false }).trim();
    if (csv) {
      txt += `Sheet: ${sheetName}\n${csv}\n\n`;
    }
  }

  return txt;
}
