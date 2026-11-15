import { describe, expect, it } from "vitest";
import { parseExtraction } from "../ai/invoice-schema";
import { validateBill } from "./validate-bill";

const f = (value: unknown, confidence = 0.95) => ({ value, confidence });

function bill(overrides: Record<string, unknown> = {}) {
  return parseExtraction({
    vendorName: f("Kaveri Building Supplies"),
    vendorGstin: f("29AAGCS4821K1Z0"),
    invoiceNumber: f("INV/24-25/0871"),
    invoiceDate: f("2026-11-04"),
    subtotal: f(52300),
    cgst: f(4707),
    sgst: f(4707),
    total: f(61714),
    lineItems: [
      { description: "Cement", quantity: 120, unitPrice: 420, amount: 50400, confidence: 0.9 },
      { description: "Wire", quantity: 20, unitPrice: 95, amount: 1900, confidence: 0.9 },
    ],
    ...overrides,
  });
}

const okIds = (checks: { id: string; ok: boolean | null }[]) =>
  Object.fromEntries(checks.map((c) => [c.id, c.ok]));

describe("validateBill", () => {
  it("passes a clean bill with no flags", () => {
    const r = validateBill("b1", "bill.pdf", bill());
    expect(r.flags).toEqual([]);
    expect(okIds(r.checks)).toEqual({ gstin: true, "line-math": true, subtotal: true, total: true, "tax-split": true });
  });

  it("flags an invalid GSTIN checksum", () => {
    const r = validateBill("b1", "bill.pdf", bill({ vendorGstin: f("29AAGCS4821K1Z5") }));
    expect(r.flags.map((x) => x.type)).toEqual(["INVALID_GSTIN"]);
    expect(r.flags[0].reason).toMatch(/Checksum failed/);
  });

  it("flags a total that doesn't add up, with the overcharge", () => {
    const r = validateBill("b1", "bill.pdf", bill({ total: f(62714) }));
    const flag = r.flags.find((x) => x.id.startsWith("TOTALS_MISMATCH:total"));
    expect(flag?.severity).toBe("high");
    expect(flag?.amountAtRisk).toBe(1000);
  });

  it("allows ₹1 rounding", () => {
    expect(validateBill("b1", "bill.pdf", bill({ total: f(61715) })).flags).toEqual([]);
  });

  it("flags lines that don't sum to the subtotal", () => {
    const r = validateBill("b1", "bill.pdf", bill({ subtotal: f(53300), total: f(62714) }));
    expect(r.flags.map((x) => x.type)).toContain("TOTALS_MISMATCH");
    expect(okIds(r.checks).subtotal).toBe(false);
  });

  it("flags qty × rate mismatches", () => {
    const r = validateBill(
      "b1",
      "bill.pdf",
      bill({
        lineItems: [
          { description: "Cement", quantity: 120, unitPrice: 420, amount: 51400, confidence: 0.9 },
          { description: "Wire", quantity: 20, unitPrice: 95, amount: 900, confidence: 0.9 },
        ],
      }),
    );
    expect(r.flags.find((x) => x.type === "LINE_MATH")?.title).toMatch(/2 lines/);
  });

  it("marks checks as not possible, and flags missing essentials", () => {
    const r = validateBill("b1", "bill.pdf", parseExtraction({ vendorName: f("X") }));
    expect(r.checks.every((c) => c.ok === null)).toBe(true);
    const missing = r.flags.find((x) => x.type === "MISSING_FIELDS");
    expect(missing?.title).toBe("Missing invoice number, invoice date, total, vendor GSTIN");
  });

  it("notices unequal CGST and SGST", () => {
    const r = validateBill("b1", "bill.pdf", bill({ cgst: f(4000), sgst: f(5414) }));
    expect(okIds(r.checks)["tax-split"]).toBe(false);
  });
});
