import { describe, expect, it, vi } from "vitest";
import { BrowserOcrHandoff } from "../ocr/handoff";
import { extractBatch, extractWithFallback } from "./extract-with-fallback";
import type { ExtractInput, Extractor } from "./types";

const input: ExtractInput = { data: Buffer.from("x"), mimeType: "image/png", fileName: "a.png" };
const valid = { invoiceNumber: { value: "INV-1", confidence: 0.9 } };
const quota = Object.assign(new Error("RESOURCE_EXHAUSTED"), { status: 429 });

function ex(id: string, run: Extractor["run"], kind: Extractor["kind"] = "ai"): Extractor {
  return { id, label: id, kind, run: vi.fn(run) };
}

describe("extractWithFallback", () => {
  it("uses the primary model when it works", async () => {
    const primary = ex("primary", async () => valid);
    const fallback = ex("fallback", async () => valid);
    const r = await extractWithFallback(input, [primary, fallback]);
    expect(r.ok && r.extractedBy).toBe("primary");
    expect(fallback.run).not.toHaveBeenCalled();
  });

  it("moves to the fallback model on a 429", async () => {
    const r = await extractWithFallback(input, [
      ex("primary", async () => { throw quota; }),
      ex("fallback", async () => valid),
    ]);
    expect(r.ok && r.extractedBy).toBe("fallback");
    expect(r.attempts.map((a) => [a.extractor, a.ok, a.quota])).toEqual([
      ["primary", false, true],
      ["fallback", true, undefined],
    ]);
  });

  it("drops to offline OCR when both models are out of quota", async () => {
    const r = await extractWithFallback(input, [
      ex("primary", async () => { throw quota; }),
      ex("fallback", async () => { throw quota; }),
      ex("offline-ocr", async () => valid, "ocr"),
    ]);
    expect(r.ok && r.kind).toBe("ocr");
  });

  it("surfaces non-quota errors instead of falling back", async () => {
    const fallback = ex("fallback", async () => valid);
    const r = await extractWithFallback(input, [
      ex("primary", async () => { throw Object.assign(new Error("bad request"), { status: 400 }); }),
      fallback,
    ]);
    expect(r.ok).toBe(false);
    expect(!r.ok && r.error).toMatch(/primary: bad request/);
    expect(fallback.run).not.toHaveBeenCalled();
  });

  it("treats malformed AI output as an error, not a fallback", async () => {
    const r = await extractWithFallback(input, [ex("primary", async () => "not json")]);
    expect(!r.ok && r.error).toMatch(/not valid JSON/);
  });

  it("hands images to the browser when they reach OCR, keeping the quota trail", async () => {
    const r = await extractWithFallback(input, [
      ex("primary", async () => { throw quota; }),
      ex("offline-ocr", async () => { throw new BrowserOcrHandoff(); }, "ocr"),
    ]);
    expect(r.ok).toBe(false);
    expect(!r.ok && r.handoff).toBe("browser-ocr");
    expect(r.attempts.map((a) => a.extractor)).toEqual(["primary"]);
  });

  it("reports when every extractor is out of quota", async () => {
    const r = await extractWithFallback(input, [ex("primary", async () => { throw quota; })]);
    expect(!r.ok && r.error).toMatch(/out of quota/);
  });
});

describe("extractBatch", () => {
  it("skips a model for later bills once it hit quota", async () => {
    const primary = ex("primary", async () => { throw quota; });
    const fallback = ex("fallback", async () => valid);
    const results = await extractBatch([input, input, input], [primary, fallback]);

    expect(primary.run).toHaveBeenCalledTimes(1);
    expect(fallback.run).toHaveBeenCalledTimes(3);
    expect(results.every((r) => r.ok)).toBe(true);
    expect(results[1].attempts[0]).toMatchObject({ skipped: true });
  });
});
