import path from "node:path";
import type { Extractor } from "../ai/types";
import { parseOcrText } from "./parse-text";

// Last resort when every Gemini model is out of quota. Runs locally:
// PDFs are read from their text layer (pdf-parse); images go through Tesseract.js.
// Tesseract downloads its English model once on first use and caches it in .cache/.

const CACHE_PATH = path.join(process.cwd(), ".cache", "tesseract");

async function pdfText(data: Buffer): Promise<string> {
  const { default: pdf } = await import("pdf-parse/lib/pdf-parse.js");
  const { text } = await pdf(data);
  if (text.replace(/\s/g, "").length < 20) {
    throw new Error(
      "This PDF is a scan with no text layer, which offline OCR can't read. Upload a photo (JPG/PNG) of it instead.",
    );
  }
  return text;
}

async function imageText(data: Buffer): Promise<string> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng", 1, { cachePath: CACHE_PATH });
  try {
    const { data: result } = await worker.recognize(data);
    return result.text;
  } finally {
    await worker.terminate();
  }
}

export function offlineOcrExtractor(): Extractor {
  return {
    id: "offline-ocr",
    label: "Offline OCR (Tesseract.js)",
    kind: "ocr",
    async run({ data, mimeType }) {
      const text = mimeType === "application/pdf" ? await pdfText(data) : await imageText(data);
      return parseOcrText(text);
    },
  };
}
