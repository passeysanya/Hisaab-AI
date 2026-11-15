import { SCALAR_FIELDS, type InvoiceExtraction } from "../ai/invoice-schema";
import { findDuplicates, findPriceIncreases, type ReadBill } from "../flags/cross-bill";
import type { BillInput, BillResult, Flag, Report, Severity } from "./types";
import { validateBill } from "./validate-bill";

const SEVERITY_ORDER: Record<Severity, number> = { high: 0, medium: 1, low: 2 };

/** Mean confidence over the fields the AI actually found. */
export function averageConfidence(x: InvoiceExtraction): number | null {
  const scores = [
    ...SCALAR_FIELDS.map((k) => x[k]).filter((f) => f.value !== null).map((f) => f.confidence),
    ...x.lineItems.map((l) => l.confidence),
  ];
  return scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
}

/** Turns extracted bills into "Your Hisaab": checks, flags and totals. Pure, runs client or server. */
export function buildReport(
  kind: Report["kind"],
  inputs: BillInput[],
  notes: string[] = [],
  now: Date = new Date(),
): Report {
  const flags: Flag[] = [];
  const read: ReadBill[] = [];

  const bills: BillResult[] = inputs.map((b, order) => {
    if (!b.outcome.ok) return { ...b, checks: [], avgConfidence: null };
    const x = b.outcome.extraction;
    const label = x.invoiceNumber.value ? `${x.invoiceNumber.value} (${b.fileName})` : b.fileName;
    const v = validateBill(b.id, label, x);
    flags.push(...v.flags);
    read.push({ id: b.id, fileName: b.fileName, sha256: b.sha256, order, extraction: x });
    return { ...b, checks: v.checks, avgConfidence: averageConfidence(x) };
  });

  flags.push(...findDuplicates(read), ...findPriceIncreases(read));
  flags.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);

  const excluded = new Set(flags.flatMap((f) => f.excludeFromPayable ?? []));
  const totalOf = (b: ReadBill) => b.extraction.total.value ?? 0;
  const confidences = bills.map((b) => b.avgConfidence).filter((c): c is number => c !== null);
  const extractedBy: Record<string, number> = {};
  for (const b of inputs) {
    if (b.outcome.ok) extractedBy[b.outcome.extractedBy] = (extractedBy[b.outcome.extractedBy] ?? 0) + 1;
  }

  return {
    kind,
    generatedAt: now.toISOString(),
    bills,
    flags,
    notes,
    summary: {
      billCount: inputs.length,
      readCount: read.length,
      failedCount: inputs.length - read.length,
      totalBilled: read.reduce((s, b) => s + totalOf(b), 0),
      payable: read.filter((b) => !excluded.has(b.id)).reduce((s, b) => s + totalOf(b), 0),
      amountAtRisk: flags.reduce((s, f) => s + (f.amountAtRisk ?? 0), 0),
      flagCount: flags.length,
      avgConfidence: confidences.length ? confidences.reduce((a, b) => a + b, 0) / confidences.length : null,
      extractedBy,
    },
  };
}
