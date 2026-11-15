import type { Check } from "@/lib/demo/types";

export function ChecksList({ checks }: { checks: Check[] }) {
  return (
    <ul className="space-y-2 text-sm">
      {checks.map((c) => (
        <li key={c.id} className="flex gap-3">
          <span
            className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center text-xs font-bold ${
              c.ok === true ? "bg-ink text-paper" : c.ok === false ? "bg-accent text-paper" : "border border-ink/30 text-ink/40"
            }`}
            aria-label={c.ok === true ? "passed" : c.ok === false ? "failed" : "not checked"}
          >
            {c.ok === true ? "✓" : c.ok === false ? "!" : "–"}
          </span>
          <span>
            <span className="font-semibold">{c.label}</span>
            <span className={`block text-xs ${c.ok === false ? "text-accent" : "text-ink/60"}`}>{c.detail}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
