import * as pdfjsLib from 'pdfjs-dist';

// Use the bundled worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

interface PdfTextItem {
  str: string;
  transform: number[];
}

function isTextItem(item: object): item is PdfTextItem {
  return 'str' in item && 'transform' in item;
}

export async function extractText(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  let txt = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const pg = await pdf.getPage(i);
    const ct = await pg.getTextContent();

    // Preserve spatial layout by sorting items top-to-bottom, left-to-right
    const items = [...ct.items].sort((a, b) => {
      if (isTextItem(a) && isTextItem(b)) {
        const dy = Math.round(b.transform[5]) - Math.round(a.transform[5]);
        return dy !== 0 ? dy : a.transform[4] - b.transform[4];
      }
      return 0;
    });

    let ly: number | null = null;
    for (const it of items) {
      if (!isTextItem(it)) continue;
      const y = Math.round(it.transform[5]);
      if (ly !== null && Math.abs(y - ly) > 4) txt += '\n';
      txt += it.str + ' ';
      ly = y;
    }
    txt += '\n\n';
  }

  return txt;
}
