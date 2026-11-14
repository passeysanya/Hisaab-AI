import { confidenceLevel, formatConfidence } from "@/lib/confidence";

type ConfidenceBarProps = {
  score: number;
  /** Set when rendered on a black panel. */
  onDark?: boolean;
};

/** AI confidence for one extracted field. Anything below the review threshold turns orange. */
export function ConfidenceBar({ score, onDark = false }: ConfidenceBarProps) {
  const pct = formatConfidence(score);
  const needsReview = confidenceLevel(score) !== "high";

  const track = onDark ? "bg-paper/15" : "bg-ink/10";
  const fill = needsReview ? "bg-accent" : onDark ? "bg-paper" : "bg-ink";
  const text = needsReview
    ? "font-semibold text-accent"
    : onDark
      ? "text-paper/70"
      : "text-ink/70";

  return (
    <div className="flex items-center gap-2" title={`AI confidence ${pct}`}>
      <div
        className={`h-1.5 w-16 ${track}`}
        role="meter"
        aria-label="AI confidence"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(score * 100)}
      >
        <div className={`h-full ${fill}`} style={{ width: pct }} />
      </div>
      <span className={`w-9 text-right text-xs tabular-nums ${text}`}>{pct}</span>
    </div>
  );
}
