// Static, fictional sample used on the landing page to show what the AI extracts.
// GSTIN below passes the real checksum. Replaced by live data in later phases.

export type SampleField = {
  label: string;
  value: string;
  confidence: number;
  note?: string;
};

export const sampleBill = {
  vendor: "Kaveri Building Supplies",
  address: "14 Old Madras Rd, Bengaluru 560016",
  gstin: "29AAGCS4821K1Z0",
  invoiceNumber: "INV/24-25/0871",
  invoiceDate: "04 Nov 2026",
  terms: "30 days",
  poRef: "PO-1042",
  lines: [
    { description: "OPC 53 Grade Cement, 50 kg", qty: 120, unit: "bag", rate: 420 },
    { description: "TMT Bar Fe500, 12 mm", qty: 800, unit: "kg", rate: 62 },
    { description: "Binding Wire, 18 g", qty: 20, unit: "kg", rate: 95 },
  ],
  subtotal: 101900,
  cgst: 9171,
  sgst: 9171,
  total: 120242,
};

export const extractedFields: SampleField[] = [
  { label: "Vendor", value: sampleBill.vendor, confidence: 0.98 },
  {
    label: "GSTIN",
    value: sampleBill.gstin,
    confidence: 0.99,
    note: "Format and checksum valid · Karnataka (29)",
  },
  { label: "Invoice no.", value: sampleBill.invoiceNumber, confidence: 0.97 },
  { label: "Invoice date", value: sampleBill.invoiceDate, confidence: 0.96 },
  {
    label: "Due date",
    value: "04 Dec 2026",
    confidence: 0.72,
    note: "No due date printed. Worked out from the invoice date plus the handwritten “30 days” terms.",
  },
  { label: "PO reference", value: sampleBill.poRef, confidence: 0.91 },
  { label: "Line items", value: "3 lines", confidence: 0.94 },
  { label: "Subtotal", value: "₹1,01,900", confidence: 0.99 },
  { label: "CGST 9% + SGST 9%", value: "₹18,342", confidence: 0.98 },
  {
    label: "Total",
    value: "₹1,20,242",
    confidence: 0.99,
    note: "Line items, subtotal and tax add up to this total",
  },
];

export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}
