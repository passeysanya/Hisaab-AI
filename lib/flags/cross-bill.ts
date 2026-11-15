import type { InvoiceExtraction } from "../ai/invoice-schema";
import { formatDate, formatINR } from "../format";
import type { Flag } from "../demo/types";

// Flags that need more than one bill: duplicates and price increases.

export type ReadBill = {
  id: string;
  fileName: string;
  sha256: string | null;
  /** Upload order; used when invoice dates are missing. */
  order: number;
  extraction: InvoiceExtraction;
};

export const PRICE_INCREASE_THRESHOLD_PCT = 2;
export const NEAR_DUPLICATE_DAYS = 7;

const normText = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const normInvoiceNo = (s: string) => s.toUpperCase().replace(/\s+/g, "");

/** GSTIN if present, else normalised vendor name. */
export function vendorKey(x: InvoiceExtraction): string | null {
  const g = x.vendorGstin.value?.replace(/\s+/g, "").toUpperCase();
  if (g && g.length === 15) return `gstin:${g}`;
  const name = x.vendorName.value;
  return name ? `name:${normText(name)}` : null;
}

const vendorLabel = (x: InvoiceExtraction) => x.vendorName.value ?? x.vendorGstin.value ?? "Unknown vendor";
const invLabel = (b: ReadBill) => b.extraction.invoiceNumber.value ?? b.fileName;

function daysBetween(a: string, b: string): number {
  return Math.abs(Date.parse(a) - Date.parse(b)) / 86_400_000;
}

function groupBy<T>(items: T[], key: (t: T) => string | null): Map<string, T[]> {
  const m = new Map<string, T[]>();
  for (const it of items) {
    const k = key(it);
    if (k === null) continue;
    m.set(k, [...(m.get(k) ?? []), it]);
  }
  return m;
}

/** Earliest copy first: by invoice date is meaningless for duplicates, so use upload order. */
const byOrder = (a: ReadBill, b: ReadBill) => a.order - b.order;

export function findDuplicates(bills: ReadBill[]): Flag[] {
  const flags: Flag[] = [];
  const pairedAsDuplicate = new Set<string>();
  const pairKey = (a: string, b: string) => [a, b].sort().join("|");

  // 1. Identical file uploaded more than once
  for (const group of groupBy(bills, (b) => b.sha256).values()) {
    if (group.length < 2) continue;
    const [first, ...copies] = group.sort(byOrder);
    copies.forEach((c) => pairedAsDuplicate.add(pairKey(first.id, c.id)));
    flags.push({
      id: `DUPLICATE:file:${group.map((b) => b.id).join(",")}`,
      type: "DUPLICATE",
      severity: "high",
      title: "Same file uploaded twice",
      reason: `${copies.map((c) => c.fileName).join(", ")} is byte-for-byte identical to ${first.fileName}.`,
      billIds: group.map((b) => b.id),
      evidence: [
        { label: "Copies", value: String(group.length) },
        { label: "Invoice", value: invLabel(first) },
      ],
      amountAtRisk: copies.reduce((s, c) => s + (c.extraction.total.value ?? 0), 0),
      excludeFromPayable: copies.map((c) => c.id),
    });
  }

  // 2. Same vendor + same invoice number (e.g. emailed PDF and WhatsApp photo of one bill)
  const invoiceGroups = groupBy(bills, (b) => {
    const v = vendorKey(b.extraction);
    const n = b.extraction.invoiceNumber.value;
    return v && n ? `${v}|${normInvoiceNo(n)}` : null;
  });
  for (const group of invoiceGroups.values()) {
    if (group.length < 2) continue;
    const [first, ...rest] = group.sort(byOrder);
    const copies = rest.filter((c) => !pairedAsDuplicate.has(pairKey(first.id, c.id)));
    if (copies.length === 0) continue;
    copies.forEach((c) => pairedAsDuplicate.add(pairKey(first.id, c.id)));
    const x = first.extraction;
    flags.push({
      id: `DUPLICATE:invoice:${group.map((b) => b.id).join(",")}`,
      type: "DUPLICATE",
      severity: "high",
      title: `Invoice ${x.invoiceNumber.value} appears ${copies.length + 1} times`,
      reason: `${vendorLabel(x)}${x.vendorGstin.value ? ` (GSTIN ${x.vendorGstin.value})` : ""} invoice ${x.invoiceNumber.value} is in ${first.fileName} and again in ${copies.map((c) => c.fileName).join(", ")}. Paying it again would be a double payment.`,
      billIds: [first.id, ...copies.map((c) => c.id)],
      evidence: [
        { label: "First copy", value: first.fileName },
        { label: "Again in", value: copies.map((c) => c.fileName).join(", ") },
        { label: "Amount", value: x.total.value !== null ? formatINR(x.total.value) : "n/a" },
      ],
      amountAtRisk: copies.reduce((s, c) => s + (c.extraction.total.value ?? 0), 0),
      excludeFromPayable: copies.map((c) => c.id),
    });
  }

  // 3. Same vendor + same total within N days, different invoice numbers
  for (const group of groupBy(bills, (b) => vendorKey(b.extraction)).values()) {
    const sorted = [...group].sort(byOrder);
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const [a, b] = [sorted[i], sorted[j]];
        if (pairedAsDuplicate.has(pairKey(a.id, b.id))) continue;
        const [ta, tb] = [a.extraction.total.value, b.extraction.total.value];
        const [da, db] = [a.extraction.invoiceDate.value, b.extraction.invoiceDate.value];
        if (ta === null || tb === null || da === null || db === null) continue;
        if (Math.abs(ta - tb) > 1 || daysBetween(da, db) > NEAR_DUPLICATE_DAYS) continue;
        pairedAsDuplicate.add(pairKey(a.id, b.id));
        flags.push({
          id: `POSSIBLE_DUPLICATE:${a.id},${b.id}`,
          type: "POSSIBLE_DUPLICATE",
          severity: "medium",
          title: "Same amount, same vendor, days apart",
          reason: `${vendorLabel(a.extraction)} billed ${formatINR(tb)} on ${formatDate(db)} (${invLabel(b)}) and the same ${formatINR(ta)} on ${formatDate(da)} (${invLabel(a)}). The invoice numbers differ, so it may be re-issued. Confirm both deliveries happened.`,
          billIds: [a.id, b.id],
          evidence: [
            { label: "Amount", value: formatINR(ta) },
            { label: "Gap", value: `${Math.round(daysBetween(da, db))} days` },
          ],
          amountAtRisk: tb,
        });
      }
    }
  }

  return flags;
}

type PricePoint = { bill: ReadBill; unitPrice: number; quantity: number | null; unit: string | null; description: string };

export function findPriceIncreases(bills: ReadBill[], thresholdPct = PRICE_INCREASE_THRESHOLD_PCT): Flag[] {
  const points = new Map<string, PricePoint[]>();
  for (const bill of bills) {
    const v = vendorKey(bill.extraction);
    if (!v) continue;
    for (const l of bill.extraction.lineItems) {
      if (l.unitPrice === null || l.unitPrice <= 0) continue;
      const key = `${v}|${normText(l.description)}`;
      points.set(key, [...(points.get(key) ?? []), { bill, unitPrice: l.unitPrice, quantity: l.quantity, unit: l.unit, description: l.description }]);
    }
  }

  const flags: Flag[] = [];
  for (const series of points.values()) {
    if (series.length < 2) continue;
    // Chronological by invoice date; bills without a date go last, in upload order.
    series.sort((a, b) => {
      const [da, db] = [a.bill.extraction.invoiceDate.value, b.bill.extraction.invoiceDate.value];
      if (da && db && da !== db) return da < db ? -1 : 1;
      if (da && !db) return -1;
      if (!da && db) return 1;
      return a.bill.order - b.bill.order;
    });

    for (let i = 1; i < series.length; i++) {
      const [prev, cur] = [series[i - 1], series[i]];
      const pct = ((cur.unitPrice - prev.unitPrice) / prev.unitPrice) * 100;
      if (pct <= thresholdPct) continue;
      const per = cur.unit ? ` / ${cur.unit}` : "";
      const extra = cur.quantity !== null ? cur.quantity * (cur.unitPrice - prev.unitPrice) : undefined;
      const when = (p: PricePoint) =>
        p.bill.extraction.invoiceDate.value ? ` (${formatDate(p.bill.extraction.invoiceDate.value)})` : "";
      flags.push({
        id: `PRICE_INCREASE:${prev.bill.id},${cur.bill.id}:${normText(cur.description)}`,
        type: "PRICE_INCREASE",
        severity: pct >= 10 ? "high" : "medium",
        title: `${cur.description}: +${pct.toFixed(1)}%`,
        reason: `${vendorLabel(cur.bill.extraction)} charged ${formatINR(cur.unitPrice)}${per} on ${invLabel(cur.bill)}${when(cur)}, up from ${formatINR(prev.unitPrice)}${per} on ${invLabel(prev.bill)}${when(prev)}. That's ${pct.toFixed(1)}% more, above the ${thresholdPct}% tolerance.`,
        billIds: [prev.bill.id, cur.bill.id],
        evidence: [
          { label: "Before", value: `${formatINR(prev.unitPrice)}${per}` },
          { label: "Now", value: `${formatINR(cur.unitPrice)}${per}` },
          { label: "Extra", value: extra !== undefined ? `${formatINR(extra)} + GST` : "n/a" },
        ],
        amountAtRisk: extra,
      });
    }
  }
  return flags;
}
