import { describe, expect, it } from "vitest";
import { parseExtraction } from "../ai/invoice-schema";
import { findDuplicates, findPriceIncreases, vendorKey, type ReadBill } from "./cross-bill";

const f = (value: unknown) => ({ value, confidence: 0.95 });

let order = 0;
function bill(id: string, o: {
  gstin?: string | null;
  vendor?: string;
  inv?: string | null;
  date?: string | null;
  total?: number | null;
  sha?: string | null;
  lines?: { description: string; quantity?: number; unit?: string; unitPrice: number }[];
} = {}): ReadBill {
  return {
    id,
    fileName: `${id}.pdf`,
    sha256: o.sha ?? null,
    order: order++,
    extraction: parseExtraction({
      vendorName: f(o.vendor ?? "Kaveri Building Supplies"),
      vendorGstin: f(o.gstin === undefined ? "29AAGCS4821K1Z0" : o.gstin),
      invoiceNumber: f(o.inv === undefined ? `INV-${id}` : o.inv),
      invoiceDate: f(o.date === undefined ? "2026-11-04" : o.date),
      total: f(o.total === undefined ? 1000 : o.total),
      lineItems: (o.lines ?? []).map((l) => ({ ...l, confidence: 0.9 })),
    }),
  };
}

describe("vendorKey", () => {
  it("prefers GSTIN, falls back to the normalised name", () => {
    expect(vendorKey(bill("a").extraction)).toBe("gstin:29AAGCS4821K1Z0");
    expect(vendorKey(bill("b", { gstin: null, vendor: "Kaveri  Building, Supplies" }).extraction)).toBe(
      "name:kaveri building supplies",
    );
  });
});

describe("findDuplicates", () => {
  it("flags the same file uploaded twice and excludes the copy from payable", () => {
    const flags = findDuplicates([bill("a", { sha: "x" }), bill("b", { sha: "x" })]);
    expect(flags).toHaveLength(1);
    expect(flags[0]).toMatchObject({ type: "DUPLICATE", excludeFromPayable: ["b"], amountAtRisk: 1000 });
  });

  it("flags the same vendor + invoice number across different files", () => {
    const flags = findDuplicates([
      bill("pdf", { inv: "INV/24-25/0812", total: 49442 }),
      bill("photo", { inv: "inv/24-25/0812 ", total: 49442 }),
    ]);
    expect(flags).toHaveLength(1);
    expect(flags[0].title).toBe("Invoice INV/24-25/0812 appears 2 times");
    expect(flags[0].reason).toMatch(/double payment/);
  });

  it("does not double-flag a pair already caught by file hash", () => {
    const flags = findDuplicates([bill("a", { sha: "x", inv: "I1" }), bill("b", { sha: "x", inv: "I1" })]);
    expect(flags.map((x) => x.id.split(":")[1])).toEqual(["file"]);
  });

  it("does not match the same invoice number from different vendors", () => {
    expect(findDuplicates([bill("a", { inv: "1" }), bill("b", { inv: "1", gstin: "27AAPFU0939F1ZV" })])).toEqual([]);
  });

  it("flags same vendor + same total within 7 days as a possible duplicate", () => {
    const flags = findDuplicates([
      bill("a", { date: "2026-11-01", total: 5000 }),
      bill("b", { date: "2026-11-05", total: 5000.5 }),
    ]);
    expect(flags).toHaveLength(1);
    expect(flags[0]).toMatchObject({ type: "POSSIBLE_DUPLICATE", severity: "medium" });
  });

  it("ignores same totals more than 7 days apart", () => {
    expect(
      findDuplicates([bill("a", { date: "2026-10-01", total: 5000 }), bill("b", { date: "2026-11-05", total: 5000 })]),
    ).toEqual([]);
  });
});

describe("findPriceIncreases", () => {
  const cement = (unitPrice: number, quantity = 120) => [{ description: "OPC 53 Cement", unit: "bag", quantity, unitPrice }];

  it("flags a unit price rise above 2% with the extra cost", () => {
    const flags = findPriceIncreases([
      bill("oct", { date: "2026-10-21", lines: cement(400, 100) }),
      bill("nov", { date: "2026-11-04", lines: cement(420) }),
    ]);
    expect(flags).toHaveLength(1);
    expect(flags[0].title).toBe("OPC 53 Cement: +5.0%");
    expect(flags[0].amountAtRisk).toBe(2400);
    expect(flags[0].reason).toMatch(/₹420 \/ bag .* up from ₹400 \/ bag/);
  });

  it("orders by invoice date, not upload order", () => {
    const flags = findPriceIncreases([
      bill("nov", { date: "2026-11-04", lines: cement(420) }),
      bill("oct", { date: "2026-10-21", lines: cement(400) }),
    ]);
    expect(flags[0].billIds).toEqual(["oct", "nov"]);
  });

  it("ignores rises at or below the threshold, and price drops", () => {
    expect(findPriceIncreases([bill("a", { date: "2026-10-01", lines: cement(400) }), bill("b", { date: "2026-11-01", lines: cement(408) })])).toEqual([]);
    expect(findPriceIncreases([bill("a", { date: "2026-10-01", lines: cement(420) }), bill("b", { date: "2026-11-01", lines: cement(400) })])).toEqual([]);
  });

  it("matches item descriptions loosely (case, punctuation)", () => {
    const flags = findPriceIncreases([
      bill("a", { date: "2026-10-01", lines: [{ description: "OPC-53 cement", unitPrice: 400 }] }),
      bill("b", { date: "2026-11-01", lines: [{ description: "opc 53 Cement.", unitPrice: 440 }] }),
    ]);
    expect(flags).toHaveLength(1);
    expect(flags[0].severity).toBe("high"); // 10%
  });

  it("does not compare the same item across different vendors", () => {
    expect(
      findPriceIncreases([
        bill("a", { date: "2026-10-01", lines: cement(400) }),
        bill("b", { date: "2026-11-01", gstin: "27AAPFU0939F1ZV", lines: cement(500) }),
      ]),
    ).toEqual([]);
  });
});
