import type { Report } from "./types";

type Cell = string | number | boolean | null | undefined;

/**
 * Escapes one CSV cell. Text starting with = + - @ (or tab/CR) is prefixed with '
 * so spreadsheet apps don't run it as a formula (CSV injection).
 */
export function csvCell(v: Cell): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "";
  if (typeof v === "boolean") return v ? "yes" : "no";
  let s = v;
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const toCsv = (rows: Cell[][]) => rows.map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n";

/** One row per bill. */
export function billsToCsv(report: Report): string {
  const header = [
    "file", "status", "extracted_by", "vendor", "gstin", "gstin_valid", "invoice_number",
    "invoice_date", "due_date", "po_number", "subtotal", "cgst", "sgst", "igst", "total",
    "avg_confidence", "flags",
  ];
  const rows = report.bills.map((b) => {
    const flags = report.flags.filter((f) => f.billIds.includes(b.id)).map((f) => f.title).join("; ");
    if (!b.outcome.ok) {
      return [b.fileName, "error", "", "", "", "", "", "", "", "", "", "", "", "", "", "", b.outcome.error];
    }
    const x = b.outcome.extraction;
    const gstinCheck = b.checks.find((c) => c.id === "gstin");
    return [
      b.fileName, "read", b.outcome.extractedBy, x.vendorName.value, x.vendorGstin.value,
      gstinCheck?.ok ?? null, x.invoiceNumber.value, x.invoiceDate.value, x.dueDate.value,
      x.poNumber.value, x.subtotal.value, x.cgst.value, x.sgst.value, x.igst.value, x.total.value,
      b.avgConfidence !== null ? Math.round(b.avgConfidence * 100) / 100 : null, flags,
    ];
  });
  return toCsv([header, ...rows]);
}

/** One row per line item, with the bill it came from. */
export function lineItemsToCsv(report: Report): string {
  const header = ["file", "vendor", "invoice_number", "invoice_date", "description", "quantity", "unit", "unit_price", "amount", "tax_rate", "confidence"];
  const rows: Cell[][] = [];
  for (const b of report.bills) {
    if (!b.outcome.ok) continue;
    const x = b.outcome.extraction;
    for (const l of x.lineItems) {
      rows.push([b.fileName, x.vendorName.value, x.invoiceNumber.value, x.invoiceDate.value, l.description, l.quantity, l.unit, l.unitPrice, l.amount, l.taxRate, l.confidence]);
    }
  }
  return toCsv([header, ...rows]);
}
