import { describe, expect, it } from "vitest";
import type { ExtractionOutcome } from "../ai/types";
import { BROWSER_OCR_LABEL, completeBrowserOcr, needsBrowserOcr } from "./handoff";

const pending: ExtractionOutcome = {
  ok: false,
  error: "Waiting for in-browser OCR",
  handoff: "browser-ocr",
  attempts: [{ extractor: "gemini:a", label: "a", kind: "ai", ok: false, quota: true, ms: 5 }],
};

describe("browser OCR hand-off", () => {
  it("only marks hand-off outcomes as needing browser OCR", () => {
    expect(needsBrowserOcr(pending)).toBe(true);
    expect(needsBrowserOcr({ ok: false, error: "x", attempts: [] })).toBe(false);
  });

  it("turns OCR text into a capped-confidence extraction and appends the attempt", () => {
    const r = completeBrowserOcr(pending, { text: "Kaveri Building Supplies\nInvoice No: INV-9\nGrand Total Rs. 1,180.00", ms: 900 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.extractedBy).toBe(BROWSER_OCR_LABEL);
    expect(r.kind).toBe("ocr");
    expect(r.extraction.invoiceNumber.value).toBe("INV-9");
    expect(r.extraction.total.value).toBe(1180);
    expect(r.attempts.map((a) => [a.extractor, a.ok])).toEqual([["gemini:a", false], ["browser-ocr", true]]);
  });

  it("records a browser OCR failure as an error", () => {
    const r = completeBrowserOcr(pending, { error: "CDN unreachable", ms: 10 });
    expect(r.ok).toBe(false);
    expect(!r.ok && r.error).toMatch(/CDN unreachable/);
    expect(r.attempts).toHaveLength(2);
  });
});
