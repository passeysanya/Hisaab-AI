import type { Attempt } from "@/lib/ai/types";

/** "gemini-a ✕ quota → gemini-b ✓". Shows exactly which model read the bill and why. */
export function AttemptTrail({ attempts }: { attempts: Attempt[] }) {
  if (attempts.length === 0) return null;
  return (
    <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs" aria-label="Extraction attempts">
      {attempts.map((a, i) => (
        <li key={`${a.extractor}-${i}`} className="flex items-center gap-2">
          <span
            className={a.ok ? "font-semibold text-ink" : "text-ink/50 line-through decoration-accent"}
            title={a.error}
          >
            {a.label}
          </span>
          <span className={a.ok ? "text-ink" : "text-accent"}>
            {a.ok ? `✓ ${(a.ms / 1000).toFixed(1)}s` : a.skipped ? "skipped · quota" : a.quota ? "✕ quota (429)" : "✕ error"}
          </span>
          {i < attempts.length - 1 && <span className="text-ink/30" aria-hidden>→</span>}
        </li>
      ))}
    </ol>
  );
}
