import { Badge } from "@/components/ui/Badge";
import { ConfidenceBar } from "@/components/ui/ConfidenceBar";
import { confidenceLevel } from "@/lib/confidence";
import { extractedFields } from "@/lib/sample-invoice";

/** The "output" side of the AI demo: each field the AI pulled out, with its confidence. */
export function ExtractedFields() {
  const toReview = extractedFields.filter((f) => confidenceLevel(f.confidence) !== "high");

  return (
    <div className="border border-ink bg-ink p-5 text-paper sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-label text-paper/60">
          AI extraction · structured output
        </p>
        <Badge tone="accent">{toReview.length} to review</Badge>
      </div>

      <ul className="mt-4 divide-y divide-paper/15">
        {extractedFields.map((f) => {
          const flagged = confidenceLevel(f.confidence) !== "high";
          return (
            <li key={f.label} className="py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-label text-paper/50">
                    {f.label}
                  </p>
                  <p
                    className={`truncate font-display text-[15px] ${
                      flagged ? "text-accent" : ""
                    }`}
                  >
                    {f.value}
                  </p>
                </div>
                <div className="shrink-0">
                  <ConfidenceBar score={f.confidence} onDark />
                </div>
              </div>
              {f.note && (
                <p
                  className={`mt-1 text-xs leading-relaxed ${
                    flagged ? "text-accent" : "text-paper/50"
                  }`}
                >
                  {flagged ? "Why review: " : ""}
                  {f.note}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
