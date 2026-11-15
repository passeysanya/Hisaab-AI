import { Badge } from "@/components/ui/Badge";
import { formatINR } from "@/lib/format";
import type { Flag } from "@/lib/demo/types";

const TYPE_LABEL: Record<Flag["type"], string> = {
  DUPLICATE: "Duplicate",
  POSSIBLE_DUPLICATE: "Possible duplicate",
  PRICE_INCREASE: "Price increase",
  INVALID_GSTIN: "Invalid GSTIN",
  TOTALS_MISMATCH: "Totals mismatch",
  LINE_MATH: "Line maths",
  MISSING_FIELDS: "Missing fields",
};

export function FlagCard({ flag, billNames }: { flag: Flag; billNames: string[] }) {
  return (
    <article className="flex flex-col border border-ink p-6 transition-colors hover:border-accent">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Badge tone={flag.severity === "low" ? "outline" : "accent"}>{TYPE_LABEL[flag.type]}</Badge>
        <span className="text-[11px] uppercase tracking-label text-ink/50">{flag.severity} severity</span>
      </div>
      <h3 className="mt-4 text-xl font-bold leading-tight sm:text-2xl">{flag.title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-ink/70">
        <span className="font-semibold text-ink">Why flagged: </span>
        {flag.reason}
      </p>
      <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-ink pt-4 sm:grid-cols-3">
        {flag.evidence.map((e) => (
          <div key={e.label} className="min-w-0">
            <dt className="text-[10px] uppercase tracking-label text-ink/50">{e.label}</dt>
            <dd className="mt-1 break-words font-display text-sm font-semibold">{e.value}</dd>
          </div>
        ))}
        {flag.amountAtRisk !== undefined && flag.amountAtRisk > 0 && (
          <div>
            <dt className="text-[10px] uppercase tracking-label text-ink/50">At risk</dt>
            <dd className="mt-1 font-display text-sm font-semibold text-accent">{formatINR(flag.amountAtRisk)}</dd>
          </div>
        )}
      </dl>
      <p className="mt-4 text-xs text-ink/50">Bills: {billNames.join(" · ")}</p>
    </article>
  );
}
