/* eslint-disable @next/next/no-img-element -- small static SVG previews */
import { Label } from "@/components/ui/Label";
import { SAMPLE_BILLS } from "@/lib/demo/sample-bills";

export function SamplePicker({ onUse, disabled }: { onUse: () => void; disabled: boolean }) {
  return (
    <section className="flex flex-col border border-ink p-5 sm:p-7">
      <Label>Option A · no upload</Label>
      <h2 className="mt-3 text-3xl font-bold leading-tight">Use 3 sample bills</h2>
      <p className="mt-2 text-sm leading-relaxed text-ink/70">
        Fictional, watermarked bills with pre-computed AI results. Two PDFs and a WhatsApp photo. There&apos;s a
        price rise and a duplicate hiding in them.
      </p>

      <ul className="mt-6 grid grid-cols-3 gap-3">
        {SAMPLE_BILLS.map((b) => (
          <li key={b.id}>
            <a href={`/demo/samples/${b.id}.svg`} target="_blank" rel="noreferrer" className="group block">
              <img
                src={`/demo/samples/${b.id}.svg`}
                alt={`Sample bill ${b.extraction.invoiceNumber.value}`}
                width={600}
                height={820}
                className="aspect-[600/820] w-full border border-ink/20 object-cover transition-colors group-hover:border-accent"
              />
              <span className="mt-1 block text-[10px] uppercase tracking-label text-ink/50">{b.channel}</span>
            </a>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-6">
        <button
          type="button"
          onClick={onUse}
          disabled={disabled}
          className="inline-flex w-full items-center justify-center border border-ink bg-ink px-6 py-3 text-sm font-semibold uppercase tracking-label text-paper transition-colors hover:border-accent hover:bg-accent disabled:opacity-40 sm:w-auto"
        >
          See the results →
        </button>
        <p className="mt-2 text-xs text-ink/50">Instant. Uses no AI quota.</p>
      </div>
    </section>
  );
}
