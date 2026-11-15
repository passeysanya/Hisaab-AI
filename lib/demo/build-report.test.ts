import { describe, expect, it } from "vitest";
import { buildReport } from "./build-report";
import { sampleBillInputs } from "./sample-bills";
import type { BillInput } from "./types";

describe("buildReport on the sample bills", () => {
  const report = buildReport("sample", sampleBillInputs(), [], new Date("2026-11-15T00:00:00Z"));

  it("reads all three bills", () => {
    expect(report.summary).toMatchObject({ billCount: 3, readCount: 3, failedCount: 0 });
  });

  it("raises exactly the two cross-bill flags the samples are built for", () => {
    expect(report.flags.map((f) => f.type).sort()).toEqual(["DUPLICATE", "PRICE_INCREASE"]);
  });

  it("puts high-severity flags first", () => {
    expect(report.flags[0].type).toBe("DUPLICATE");
  });

  it("excludes the duplicate copy from payable and counts money at risk", () => {
    expect(report.summary.totalBilled).toBe(49442 + 120242 + 49442);
    expect(report.summary.payable).toBe(49442 + 120242);
    expect(report.summary.amountAtRisk).toBe(49442 + 2400);
  });

  it("passes every arithmetic and GSTIN check on the samples", () => {
    for (const b of report.bills) {
      expect(b.checks.filter((c) => c.ok === false), b.fileName).toEqual([]);
    }
  });

  it("counts which model read each bill", () => {
    expect(report.summary.extractedBy).toEqual({ "gemini-3.5-flash-lite": 2, "gemini-3.1-flash-lite": 1 });
  });
});

describe("buildReport with failures", () => {
  it("keeps failed bills in the report without checks", () => {
    const failed: BillInput = {
      id: "x",
      fileName: "scan.pdf",
      source: "upload",
      sha256: "abc",
      previewUrl: null,
      outcome: { ok: false, error: "Every extractor is out of quota", attempts: [] },
    };
    const r = buildReport("live", [failed], ["note"]);
    expect(r.summary).toMatchObject({ billCount: 1, readCount: 0, failedCount: 1, payable: 0, avgConfidence: null });
    expect(r.bills[0].checks).toEqual([]);
    expect(r.notes).toEqual(["note"]);
  });
});
