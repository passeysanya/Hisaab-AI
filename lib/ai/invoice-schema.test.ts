import { describe, expect, it } from "vitest";
import { InvalidExtractionError, parseExtraction } from "./invoice-schema";

const good = {
  vendorName: { value: "Kaveri Building Supplies", confidence: 0.98 },
  vendorGstin: { value: "29AAGCS4821K1Z0", confidence: 0.99 },
  invoiceNumber: { value: "INV/24-25/0871", confidence: 0.97 },
  invoiceDate: { value: "04/11/2026", confidence: 0.96 },
  dueDate: { value: null, confidence: 0.2, note: "Not printed" },
  total: { value: "₹1,20,242", confidence: 0.99 },
  lineItems: [
    { description: "Cement", quantity: "120", unitPrice: "420", amount: "50,400", confidence: 0.9 },
  ],
};

describe("parseExtraction", () => {
  it("accepts well-formed output and normalises values", () => {
    const r = parseExtraction(good);
    expect(r.invoiceDate.value).toBe("2026-11-04");
    expect(r.total.value).toBe(120242);
    expect(r.lineItems[0].amount).toBe(50400);
    expect(r.dueDate.note).toBe("Not printed");
  });

  it("fills missing fields with null and zero confidence", () => {
    const r = parseExtraction({ vendorName: { value: "X", confidence: 0.5 } });
    expect(r.cgst).toEqual({ value: null, confidence: 0 });
    expect(r.lineItems).toEqual([]);
  });

  it("parses JSON strings, including fenced code blocks", () => {
    const r = parseExtraction("```json\n" + JSON.stringify(good) + "\n```");
    expect(r.invoiceNumber.value).toBe("INV/24-25/0871");
  });

  it("rejects non-JSON text", () => {
    expect(() => parseExtraction("Sorry, I can't read this")).toThrow(InvalidExtractionError);
  });

  it("rejects confidence outside 0–1", () => {
    expect(() => parseExtraction({ ...good, total: { value: 1, confidence: 1.4 } })).toThrow(
      InvalidExtractionError,
    );
  });

  it("rejects unparseable amounts and dates instead of guessing", () => {
    expect(() => parseExtraction({ ...good, total: { value: "lots", confidence: 0.9 } })).toThrow();
    expect(() =>
      parseExtraction({ ...good, invoiceDate: { value: "sometime", confidence: 0.9 } }),
    ).toThrow();
  });

  it("rejects line items without a description", () => {
    expect(() =>
      parseExtraction({ ...good, lineItems: [{ description: "", confidence: 0.9 }] }),
    ).toThrow();
  });
});
