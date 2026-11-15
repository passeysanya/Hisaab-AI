import { describe, expect, it } from "vitest";
import { parseExtraction } from "../ai/invoice-schema";
import { OCR_MAX_CONFIDENCE, parseOcrText } from "./parse-text";

const SAMPLE = `Kaveri Building Supplies
14 Old Madras Rd, Bengaluru
GSTIN: 29AAGCS4821K1Z0
TAX INVOICE
Invoice No: INV/24-25/0871
Invoice Date: 04/11/2026
Due Date: 04-Dec-2026
PO No: PO-1042
Sub Total 1,01,900.00
CGST 9% 9,171.00
SGST 9% 9,171.00
Grand Total Rs. 1,20,242.00`;

describe("parseOcrText", () => {
  const r = parseOcrText(SAMPLE);

  it("finds the key fields on a typical bill", () => {
    expect(r.vendorName.value).toBe("Kaveri Building Supplies");
    expect(r.vendorGstin.value).toBe("29AAGCS4821K1Z0");
    expect(r.invoiceNumber.value).toBe("INV/24-25/0871");
    expect(r.invoiceDate.value).toBe("2026-11-04");
    expect(r.dueDate.value).toBe("2026-12-04");
    expect(r.poNumber.value).toBe("PO-1042");
  });

  it("reads amounts and ignores tax rates", () => {
    expect(r.subtotal.value).toBe(101900);
    expect(r.cgst.value).toBe(9171);
    expect(r.sgst.value).toBe(9171);
    expect(r.total.value).toBe(120242);
    expect(r.igst.value).toBeNull();
  });

  it("caps every confidence so OCR results always get reviewed", () => {
    for (const f of Object.values(r)) {
      if (!Array.isArray(f)) expect(f.confidence).toBeLessThanOrEqual(OCR_MAX_CONFIDENCE);
    }
  });

  it("lowers confidence when the GSTIN checksum fails", () => {
    const bad = parseOcrText(SAMPLE.replace("29AAGCS4821K1Z0", "29AAGCS4821K1Z5"));
    expect(bad.vendorGstin.confidence).toBeLessThan(0.5);
  });

  it("handles real Tesseract output (blank lines, collapsed columns)", () => {
    const real = parseOcrText(
      "Deccan Hardware Mart\n\nGSTIN: 27AAPFU0939F1ZV\n\nTAX INVOICE\n\nInvoice No: DHM/2026/1187\nInvoice Date: 02/11/2026\n\nDue Date: 02/12/2026\n\nPO No: PO-2201\n\nItem Qty Rate Amount\nPVC Pipe 1inch 50 120 6000\nSub Total 7,500.00\n\nCGST 9% 675.00\n\nSGST 9% 675.00\n\nGrand Total Rs. 8,850.00\n",
    );
    expect([real.invoiceNumber.value, real.invoiceDate.value, real.dueDate.value, real.poNumber.value]).toEqual([
      "DHM/2026/1187", "2026-11-02", "2026-12-02", "PO-2201",
    ]);
    expect([real.subtotal.value, real.cgst.value, real.total.value]).toEqual([7500, 675, 8850]);
  });

  it("produces output that passes the extraction schema", () => {
    expect(() => parseExtraction(r)).not.toThrow();
    expect(() => parseExtraction(parseOcrText(""))).not.toThrow();
  });
});
