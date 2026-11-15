import type { InvoiceExtraction } from "../ai/invoice-schema";
import { formatINR } from "../format";
import { validateGstin } from "../gstin";
import type { Check, Flag } from "./types";

/** Rupee tolerance for rounding differences. */
export const TOLERANCE = 1;

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const near = (a: number, b: number) => Math.abs(a - b) <= TOLERANCE;

/** Single-bill checks: GSTIN checksum, arithmetic, missing fields. */
export function validateBill(
  billId: string,
  label: string,
  x: InvoiceExtraction,
): { checks: Check[]; flags: Flag[] } {
  const checks: Check[] = [];
  const flags: Flag[] = [];

  // 1. GSTIN format + checksum
  const g = x.vendorGstin.value;
  if (!g) {
    checks.push({ id: "gstin", label: "GSTIN valid", ok: null, detail: "No GSTIN found on the bill" });
  } else {
    const r = validateGstin(g);
    if (r.valid) {
      checks.push({ id: "gstin", label: "GSTIN valid", ok: true, detail: `Format and checksum OK · ${r.state}` });
    } else {
      checks.push({ id: "gstin", label: "GSTIN valid", ok: false, detail: r.reason });
      flags.push({
        id: `INVALID_GSTIN:${billId}`,
        type: "INVALID_GSTIN",
        severity: "high",
        title: "GSTIN doesn't check out",
        reason: `${label} shows GSTIN ${r.gstin}. ${r.reason} You can't claim input tax credit against an invalid GSTIN.`,
        billIds: [billId],
        evidence: [
          { label: "GSTIN", value: r.gstin },
          { label: "Check", value: "Failed" },
        ],
      });
    }
  }

  // 2. Each line: qty × rate = amount
  const badLines = x.lineItems.filter(
    (l) => l.quantity !== null && l.unitPrice !== null && l.amount !== null && !near(l.quantity * l.unitPrice, l.amount),
  );
  const checkableLines = x.lineItems.filter((l) => l.quantity !== null && l.unitPrice !== null && l.amount !== null);
  if (checkableLines.length === 0) {
    checks.push({ id: "line-math", label: "Qty × rate = amount", ok: null, detail: "No complete line items to check" });
  } else if (badLines.length === 0) {
    checks.push({ id: "line-math", label: "Qty × rate = amount", ok: true, detail: `All ${checkableLines.length} lines add up` });
  } else {
    const l = badLines[0];
    const detail = `"${l.description}": ${l.quantity} × ${formatINR(l.unitPrice!)} = ${formatINR(l.quantity! * l.unitPrice!)}, but the line says ${formatINR(l.amount!)}`;
    checks.push({ id: "line-math", label: "Qty × rate = amount", ok: false, detail });
    flags.push({
      id: `LINE_MATH:${billId}`,
      type: "LINE_MATH",
      severity: "medium",
      title: `${badLines.length} line${badLines.length > 1 ? "s" : ""} don't multiply out`,
      reason: `${label}: ${detail}.`,
      billIds: [billId],
      evidence: [{ label: "Lines affected", value: String(badLines.length) }],
      amountAtRisk: Math.max(0, l.amount! - l.quantity! * l.unitPrice!),
    });
  }

  // 3. Line items add up to the subtotal
  const lineAmounts = x.lineItems.map((l) => l.amount).filter((n): n is number => n !== null);
  const subtotal = x.subtotal.value;
  if (lineAmounts.length === 0 || subtotal === null) {
    checks.push({ id: "subtotal", label: "Lines = subtotal", ok: null, detail: "Subtotal or line amounts missing" });
  } else if (near(sum(lineAmounts), subtotal)) {
    checks.push({ id: "subtotal", label: "Lines = subtotal", ok: true, detail: `${formatINR(subtotal)} matches the lines` });
  } else {
    const diff = subtotal - sum(lineAmounts);
    const detail = `Lines add up to ${formatINR(sum(lineAmounts))}, but the subtotal says ${formatINR(subtotal)}`;
    checks.push({ id: "subtotal", label: "Lines = subtotal", ok: false, detail });
    flags.push({
      id: `TOTALS_MISMATCH:subtotal:${billId}`,
      type: "TOTALS_MISMATCH",
      severity: "medium",
      title: "Subtotal doesn't match the lines",
      reason: `${label}: ${detail} (difference ${formatINR(Math.abs(diff))}).`,
      billIds: [billId],
      evidence: [
        { label: "Lines", value: formatINR(sum(lineAmounts)) },
        { label: "Subtotal", value: formatINR(subtotal) },
      ],
      amountAtRisk: Math.max(0, diff),
    });
  }

  // 4. Subtotal + GST = total
  const taxes = [x.cgst.value, x.sgst.value, x.igst.value].filter((n): n is number => n !== null);
  const total = x.total.value;
  if (subtotal === null || total === null) {
    checks.push({ id: "total", label: "Subtotal + GST = total", ok: null, detail: "Subtotal or total missing" });
  } else if (near(subtotal + sum(taxes), total)) {
    checks.push({ id: "total", label: "Subtotal + GST = total", ok: true, detail: `${formatINR(subtotal)} + ${formatINR(sum(taxes))} GST = ${formatINR(total)}` });
  } else {
    const expected = subtotal + sum(taxes);
    const detail = `${formatINR(subtotal)} + ${formatINR(sum(taxes))} GST = ${formatINR(expected)}, but the bill total is ${formatINR(total)}`;
    checks.push({ id: "total", label: "Subtotal + GST = total", ok: false, detail });
    flags.push({
      id: `TOTALS_MISMATCH:total:${billId}`,
      type: "TOTALS_MISMATCH",
      severity: "high",
      title: "Total doesn't add up",
      reason: `${label}: ${detail}.`,
      billIds: [billId],
      evidence: [
        { label: "Expected", value: formatINR(expected) },
        { label: "Billed", value: formatINR(total) },
      ],
      amountAtRisk: Math.max(0, total - expected),
    });
  }

  // 5. Intra-state bills split GST equally
  const { value: cgst } = x.cgst;
  const { value: sgst } = x.sgst;
  if (cgst !== null && sgst !== null) {
    checks.push(
      near(cgst, sgst)
        ? { id: "tax-split", label: "CGST = SGST", ok: true, detail: `${formatINR(cgst)} each` }
        : { id: "tax-split", label: "CGST = SGST", ok: false, detail: `CGST ${formatINR(cgst)} vs SGST ${formatINR(sgst)}; these should be equal` },
    );
  }

  // 6. Missing essentials
  const missing = (
    [
      ["invoice number", x.invoiceNumber.value],
      ["invoice date", x.invoiceDate.value],
      ["total", x.total.value],
      ["vendor GSTIN", x.vendorGstin.value],
    ] as const
  )
    .filter(([, v]) => v === null)
    .map(([name]) => name);
  if (missing.length > 0) {
    flags.push({
      id: `MISSING_FIELDS:${billId}`,
      type: "MISSING_FIELDS",
      severity: "low",
      title: `Missing ${missing.join(", ")}`,
      reason: `The AI couldn't find the ${missing.join(", ")} on ${label}. Check the bill or ask the vendor for a proper tax invoice.`,
      billIds: [billId],
      evidence: [{ label: "Missing", value: String(missing.length) }],
    });
  }

  return { checks, flags };
}
