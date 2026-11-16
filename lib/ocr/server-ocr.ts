import type { Extractor } from "../ai/types";
import { BrowserOcrHandoff } from "./handoff";
import { parseOcrText } from "./parse-text";

// Last step on the server, used when every Gemini model is out of quota (or no key is set).
// PDFs: read the embedded text layer with pdf-parse (pure JS, no disk cache, fine on Vercel).
// Images: hand off to Tesseract.js in the visitor's browser (see ./handoff.ts).

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

export function serverOcrExtractor(): Extractor {
  return {
    id: "offline-ocr",
    label: "Offline OCR (PDF text layer)",
    kind: "ocr",
    async run({ data, mimeType }) {
      if (mimeType !== "application/pdf") throw new BrowserOcrHandoff();
      return parseOcrText(await pdfText(data));
    },
  };
}
