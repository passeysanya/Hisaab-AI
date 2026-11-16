// Runs Tesseract.js in the visitor's browser. Every asset comes from the jsDelivr CDN,
// pinned to the installed version, so nothing is cached on the server. The browser
// keeps the language file in IndexedDB after the first download (about 10 MB).

export const TESSERACT_VERSION = "7.0.0";
export const TESSERACT_CDN = {
  workerPath: `https://cdn.jsdelivr.net/npm/tesseract.js@${TESSERACT_VERSION}/dist/worker.min.js`,
  corePath: `https://cdn.jsdelivr.net/npm/tesseract.js-core@${TESSERACT_VERSION}`,
  langPath: "https://cdn.jsdelivr.net/npm/@tesseract.js-data/eng/4.0.0_best_int",
} as const;

export type BrowserOcrResult = { text: string; ms: number } | { error: string; ms: number };

/** OCRs images one after another with a single worker. Browser only. */
export async function recognizeInBrowser(images: Blob[]): Promise<BrowserOcrResult[]> {
  if (images.length === 0) return [];
  const started = Date.now();
  let worker: Awaited<ReturnType<typeof import("tesseract.js")["createWorker"]>>;
  try {
    const { createWorker } = await import("tesseract.js");
    worker = await createWorker("eng", 1, TESSERACT_CDN);
  } catch (err) {
    const error = `Couldn't load OCR from the CDN (${err instanceof Error ? err.message : "network error"}).`;
    return images.map(() => ({ error, ms: Date.now() - started }));
  }

  const results: BrowserOcrResult[] = [];
  try {
    for (const image of images) {
      const t = Date.now();
      try {
        const { data } = await worker.recognize(image);
        results.push({ text: data.text, ms: Date.now() - t });
      } catch (err) {
        results.push({ error: err instanceof Error ? err.message : "OCR failed", ms: Date.now() - t });
      }
    }
  } finally {
    await worker.terminate();
  }
  return results;
}
