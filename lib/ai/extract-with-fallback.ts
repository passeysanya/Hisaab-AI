import { BrowserOcrHandoff } from "../ocr/handoff";
import { parseExtraction } from "./invoice-schema";
import { isQuotaError } from "./is-quota-error";
import type { Attempt, ExtractInput, ExtractionOutcome, Extractor } from "./types";

function message(err: unknown): string {
  if (err instanceof Error) return err.message;
  return typeof err === "string" ? err : "Unknown error";
}

/**
 * Runs extractors in order (primary model -> fallback model -> offline OCR).
 * Images that reach OCR come back with `handoff: "browser-ocr"` for the browser to finish.
 * Moves to the next one ONLY on quota / 429 errors; any other failure is returned
 * as an error so it isn't silently masked by a worse extractor.
 *
 * `exhausted` is shared across a batch so once a model hits its quota, later bills
 * skip straight past it instead of burning another request.
 */
export async function extractWithFallback(
  input: ExtractInput,
  extractors: Extractor[],
  exhausted: Set<string> = new Set(),
): Promise<ExtractionOutcome> {
  const attempts: Attempt[] = [];

  for (const ex of extractors) {
    const base = { extractor: ex.id, label: ex.label, kind: ex.kind };

    if (exhausted.has(ex.id)) {
      attempts.push({ ...base, ok: false, skipped: true, quota: true, error: "Quota hit earlier in this batch", ms: 0 });
      continue;
    }

    const started = Date.now();
    try {
      const raw = await ex.run(input);
      const extraction = parseExtraction(raw);
      attempts.push({ ...base, ok: true, ms: Date.now() - started });
      return { ok: true, extraction, extractedBy: ex.label, kind: ex.kind, attempts };
    } catch (err) {
      if (err instanceof BrowserOcrHandoff) {
        // Not a failure: the browser finishes this bill with Tesseract.js.
        return { ok: false, error: "Waiting for in-browser OCR", attempts, handoff: "browser-ocr" };
      }
      const quota = isQuotaError(err);
      attempts.push({ ...base, ok: false, quota, error: message(err), ms: Date.now() - started });
      if (quota) {
        exhausted.add(ex.id);
        continue;
      }
      return { ok: false, error: `${ex.label}: ${message(err)}`, attempts };
    }
  }

  return {
    ok: false,
    error: extractors.length === 0 ? "No extractors configured" : "Every extractor is out of quota",
    attempts,
  };
}

/** Extracts bills one at a time (gentle on free-tier rate limits), sharing quota state. */
export async function extractBatch(
  inputs: ExtractInput[],
  extractors: Extractor[],
): Promise<ExtractionOutcome[]> {
  const exhausted = new Set<string>();
  const outcomes: ExtractionOutcome[] = [];
  for (const input of inputs) {
    outcomes.push(await extractWithFallback(input, extractors, exhausted));
  }
  return outcomes;
}
