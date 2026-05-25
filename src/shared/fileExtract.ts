import { extractText } from './pdfExtract';

const EXCEL_EXTENSIONS = ['.xlsx', '.xls', '.xlsm', '.csv'];

export function isExcelFile(file: File): boolean {
  const name = file.name.toLowerCase();
  if (EXCEL_EXTENSIONS.some((ext) => name.endsWith(ext))) return true;
  return (
    file.type.includes('spreadsheet') ||
    file.type.includes('excel') ||
    file.type === 'text/csv'
  );
}

/**
 * Extract plain text from a supported wealth-statement upload (PDF or Excel).
 * The Excel parser is loaded lazily so SheetJS stays out of the initial bundle
 * and is only fetched when a spreadsheet is actually uploaded.
 */
export async function extractFileText(file: File): Promise<string> {
  if (isExcelFile(file)) {
    const { extractExcelText } = await import('./excelExtract');
    return extractExcelText(file);
  }
  return extractText(file);
}
