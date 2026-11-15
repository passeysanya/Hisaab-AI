import { Label } from "@/components/ui/Label";

export type ChainStepView = { label: string; detail: string };

/** Shows the extraction fallback chain, so visitors see which AI will read their bill. */
export function AiChain({ steps, notes }: { steps: ChainStepView[]; notes: string[] }) {
  return (
    <div>
      <Label>How your bills get read</Label>
      <ol className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-0">
        {steps.map((s, i) => (
          <li key={s.label} className="flex items-center gap-2 sm:gap-0">
            <div className={`border px-3 py-2 ${i === 0 ? "border-accent" : "border-ink"}`}>
              <p className="font-display text-sm font-semibold">{s.label}</p>
              <p className="text-[11px] uppercase tracking-label text-ink/50">{s.detail}</p>
            </div>
            {i < steps.length - 1 && (
              <span className="px-2 text-xs text-ink/50" aria-hidden>
                <span className="sm:hidden">↓</span>
                <span className="hidden sm:inline">→</span>
              </span>
            )}
          </li>
        ))}
      </ol>
      {notes.map((n) => (
        <p key={n} className="mt-2 text-xs text-accent">
          {n}
        </p>
      ))}
    </div>
  );
}
