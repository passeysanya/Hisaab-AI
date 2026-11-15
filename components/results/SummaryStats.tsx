import { formatConfidence } from "@/lib/confidence";
import { formatINR } from "@/lib/format";
import type { Report } from "@/lib/demo/types";

export function SummaryStats({ summary }: { summary: Report["summary"] }) {
  const stats = [
    { label: "Bills read", value: `${summary.readCount}/${summary.billCount}`, sub: summary.failedCount ? `${summary.failedCount} couldn't be read` : "All read" },
    { label: "Payable", value: formatINR(summary.payable), sub: summary.payable !== summary.totalBilled ? `of ${formatINR(summary.totalBilled)} billed, duplicates removed` : "Across all bills" },
    { label: "Flags", value: String(summary.flagCount), sub: summary.amountAtRisk > 0 ? `${formatINR(summary.amountAtRisk)} at risk` : "Nothing at risk", accent: summary.flagCount > 0 },
    { label: "Avg AI confidence", value: summary.avgConfidence !== null ? formatConfidence(summary.avgConfidence) : "n/a", sub: "Across extracted fields" },
  ];

  return (
    <dl className="grid grid-cols-2 border-y border-ink lg:grid-cols-4">
      {stats.map((s, i) => (
        <div key={s.label} className={`py-6 pr-4 ${i % 2 === 1 ? "border-l border-ink pl-4" : ""} ${i >= 2 ? "border-t border-ink lg:border-t-0" : ""} ${i === 2 ? "lg:border-l lg:pl-4" : ""}`}>
          <dt className="text-[11px] font-medium uppercase tracking-label text-ink/60">{s.label}</dt>
          <dd className={`mt-2 font-display text-3xl font-bold sm:text-5xl ${s.accent ? "text-accent" : ""}`}>{s.value}</dd>
          <dd className="mt-1 text-xs text-ink/60">{s.sub}</dd>
        </div>
      ))}
    </dl>
  );
}
