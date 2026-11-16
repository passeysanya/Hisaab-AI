import { parseExtraction } from "../ai/invoice-schema";
import type { Attempt, ExtractionOutcome } from "../ai/types";
import { parseOcrText } from "./parse-text";

// Image OCR runs in the visitor's browser, not on the server: on Vercel the server
// has no persistent disk to cache Tesseract's language file, and OCR would eat the
// function's time limit. The server signals the hand-off with this error; the
// browser runs Tesseract.js (language file from a CDN) and completes the outcome.

export const BROWSER_OCR_LABEL = "Offline OCR (Tesseract.js, in your browser)";

export class BrowserOcrHandoff extends Error {
  constructor() {
    super("Image handed to in-browser OCR");
    this.name = "BrowserOcrHandoff";
  }
}

/** True for an outcome the server left for the browser to OCR. */
export function needsBrowserOcr(o: ExtractionOutcome): boolean {
  return !o.ok && o.handoff === "browser-ocr";
}

/** Turns OCR text from the browser into a finished outcome, keeping the server's attempt trail. */
export function completeBrowserOcr(
  pending: ExtractionOutcome,
  result: { text: string; ms: number } | { error: string; ms: number },
): ExtractionOutcome {
  const base = { extractor: "browser-ocr", label: BROWSER_OCR_LABEL, kind: "ocr" as const };
  if ("error" in result) {
    const attempt: Attempt = { ...base, ok: false, error: result.error, ms: result.ms };
    return { ok: false, error: `${BROWSER_OCR_LABEL}: ${result.error}`, attempts: [...pending.attempts, attempt] };
  }
  try {
    const extraction = parseExtraction(parseOcrText(result.text));
    return {
      ok: true,
      extraction,
      extractedBy: BROWSER_OCR_LABEL,
      kind: "ocr",
      attempts: [...pending.attempts, { ...base, ok: true, ms: result.ms }],
    };
  } catch (err) {
    return completeBrowserOcr(pending, { error: err instanceof Error ? err.message : "Couldn't parse OCR text", ms: result.ms });
  }
}
