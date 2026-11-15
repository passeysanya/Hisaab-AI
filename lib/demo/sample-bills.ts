import { parseExtraction, type InvoiceExtraction } from "../ai/invoice-schema";
import type { Attempt } from "../ai/types";
import type { BillInput } from "./types";

// Three fictional, watermarked sample bills with PRE-COMPUTED AI results, so the demo
// works with no upload and no API quota. They are built to trigger real cross-bill flags:
//   1 → 2: cement price rises ₹400 → ₹420 (+5%)
//   3 is a WhatsApp photo of bill 1 (same invoice number) → duplicate
// Bill 3 also shows the fallback chain: the primary model hit its quota.

export const SAMPLE_PRIMARY_MODEL = "gemini-3.5-flash-lite";
export const SAMPLE_FALLBACK_MODEL = "gemini-3.1-flash-lite";

export type SampleBill = {
  id: string;
  fileName: string;
  channel: string;
  /** Photo-style rendering (tilted, shaded) to mimic a WhatsApp image. */
  photo: boolean;
  address: string;
  terms: string;
  extractedBy: string;
  attempts: Attempt[];
  extraction: InvoiceExtraction;
};

const f = (value: unknown, confidence: number, note?: string) => ({ value, confidence, note: note ?? null });

const ok = (label: string, ms: number): Attempt => ({ extractor: `gemini:${label}`, label, kind: "ai", ok: true, ms });

const kaveri0812 = (photo: boolean) =>
  parseExtraction({
    vendorName: f("Kaveri Building Supplies", photo ? 0.93 : 0.98),
    vendorGstin: f("29AAGCS4821K1Z0", photo ? 0.88 : 0.99, photo ? "Glare over the last two characters; checksum confirms the reading" : undefined),
    invoiceNumber: f("INV/24-25/0812", photo ? 0.9 : 0.98),
    invoiceDate: f("2026-10-21", photo ? 0.91 : 0.97),
    dueDate: f("2026-11-20", photo ? 0.86 : 0.95),
    poNumber: f("PO-1031", photo ? 0.79 : 0.93, photo ? "PO number is partly folded in the photo; read as PO-1031" : undefined),
    subtotal: f(41900, 0.97),
    cgst: f(3771, 0.96),
    sgst: f(3771, 0.96),
    igst: f(null, 0.95),
    total: f(49442, photo ? 0.95 : 0.99),
    lineItems: [
      { description: "OPC 53 Grade Cement, 50 kg", quantity: 100, unit: "bag", unitPrice: 400, amount: 40000, taxRate: 18, confidence: photo ? 0.9 : 0.96 },
      { description: "Binding Wire, 18 g", quantity: 20, unit: "kg", unitPrice: 95, amount: 1900, taxRate: 18, confidence: photo ? 0.84 : 0.95 },
    ],
  });

export const SAMPLE_BILLS: SampleBill[] = [
  {
    id: "sample-kaveri-0812",
    fileName: "kaveri-INV-0812.pdf",
    channel: "Email · PDF",
    photo: false,
    address: "14 Old Madras Rd, Bengaluru 560016",
    terms: "30 days",
    extractedBy: SAMPLE_PRIMARY_MODEL,
    attempts: [ok(SAMPLE_PRIMARY_MODEL, 2140)],
    extraction: kaveri0812(false),
  },
  {
    id: "sample-kaveri-0871",
    fileName: "kaveri-INV-0871.pdf",
    channel: "Email · PDF",
    photo: false,
    address: "14 Old Madras Rd, Bengaluru 560016",
    terms: "30 days (handwritten)",
    extractedBy: SAMPLE_PRIMARY_MODEL,
    attempts: [ok(SAMPLE_PRIMARY_MODEL, 2630)],
    extraction: parseExtraction({
      vendorName: f("Kaveri Building Supplies", 0.98),
      vendorGstin: f("29AAGCS4821K1Z0", 0.99),
      invoiceNumber: f("INV/24-25/0871", 0.97),
      invoiceDate: f("2026-11-04", 0.96),
      dueDate: f("2026-12-04", 0.72, "No due date printed. Worked out from the invoice date plus the handwritten “30 days” terms."),
      poNumber: f("PO-1042", 0.91),
      subtotal: f(101900, 0.99),
      cgst: f(9171, 0.98),
      sgst: f(9171, 0.98),
      igst: f(null, 0.97),
      total: f(120242, 0.99),
      lineItems: [
        { description: "OPC 53 Grade Cement, 50 kg", quantity: 120, unit: "bag", unitPrice: 420, amount: 50400, taxRate: 18, confidence: 0.95 },
        { description: "TMT Bar Fe500, 12 mm", quantity: 800, unit: "kg", unitPrice: 62, amount: 49600, taxRate: 18, confidence: 0.94 },
        { description: "Binding Wire, 18 g", quantity: 20, unit: "kg", unitPrice: 95, amount: 1900, taxRate: 18, confidence: 0.93 },
      ],
    }),
  },
  {
    id: "sample-kaveri-0812-photo",
    fileName: "WhatsApp Image 2026-11-06.jpg",
    channel: "WhatsApp · photo",
    photo: true,
    address: "14 Old Madras Rd, Bengaluru 560016",
    terms: "30 days",
    extractedBy: SAMPLE_FALLBACK_MODEL,
    attempts: [
      {
        extractor: `gemini:${SAMPLE_PRIMARY_MODEL}`,
        label: SAMPLE_PRIMARY_MODEL,
        kind: "ai",
        ok: false,
        quota: true,
        error: "429 RESOURCE_EXHAUSTED: free-tier requests per minute exceeded",
        ms: 310,
      },
      ok(SAMPLE_FALLBACK_MODEL, 2890),
    ],
    extraction: kaveri0812(true),
  },
];

export function sampleBillInputs(): BillInput[] {
  return SAMPLE_BILLS.map((s) => ({
    id: s.id,
    fileName: s.fileName,
    source: "sample",
    sha256: null,
    previewUrl: `/demo/samples/${s.id}.svg`,
    outcome: { ok: true, extraction: s.extraction, extractedBy: s.extractedBy, kind: "ai", attempts: s.attempts },
  }));
}
