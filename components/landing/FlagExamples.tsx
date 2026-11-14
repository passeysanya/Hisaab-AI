import { Badge } from "@/components/ui/Badge";
import { Label } from "@/components/ui/Label";

type FlagExample = {
  type: string;
  headline: string;
  reason: string;
  evidence: { label: string; value: string }[];
  confidence: string;
};

const flags: FlagExample[] = [
  {
    type: "Price increase",
    headline: "Cement billed ₹20 a bag above the PO",
    reason:
      "Line 1 unit price is ₹420. PO-1042 agreed ₹400. That is 5.0% over, above your 2% tolerance.",
    evidence: [
      { label: "PO rate", value: "₹400 / bag" },
      { label: "Billed", value: "₹420 / bag" },
      { label: "Excess", value: "₹2,400 + GST" },
    ],
    confidence: "99%",
  },
  {
    type: "Duplicate",
    headline: "Same bill, sent twice",
    reason:
      "The vendor GSTIN and invoice number match INV/24-25/0812, which came in by email on 3 Nov. This copy came by WhatsApp on 6 Nov.",
    evidence: [
      { label: "First seen", value: "3 Nov · email" },
      { label: "Again", value: "6 Nov · WhatsApp" },
      { label: "Amount", value: "₹48,380" },
    ],
    confidence: "98%",
  },
  {
    type: "Over PO quantity",
    headline: "40 kg more steel than ordered",
    reason:
      "PO-1042 is for 760 kg of TMT 12 mm. The bill charges 800 kg. No later delivery note covers the extra.",
    evidence: [
      { label: "Ordered", value: "760 kg" },
      { label: "Billed", value: "800 kg" },
      { label: "At stake", value: "₹2,480 + GST" },
    ],
    confidence: "93%",
  },
];

export function FlagExamples() {
  return (
    <section id="flags" className="border-t border-ink">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-8 sm:py-24">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <h2 className="max-w-3xl text-4xl font-bold leading-none sm:text-6xl">
            Flags that explain <span className="text-accent">themselves</span>.
          </h2>
          <Label>03 / What gets caught</Label>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {flags.map((f) => (
            <FlagCard key={f.type} flag={f} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FlagCard({ flag }: { flag: FlagExample }) {
  return (
    <article className="flex flex-col border border-ink p-6 transition-colors hover:border-accent">
      <div className="flex items-center justify-between gap-2">
        <Badge tone="accent">{flag.type}</Badge>
        <span className="text-xs tabular-nums text-ink/60">AI confidence {flag.confidence}</span>
      </div>
      <h3 className="mt-5 text-2xl font-bold leading-tight">{flag.headline}</h3>
      <p className="mt-3 text-sm leading-relaxed text-ink/70">
        <span className="font-semibold text-ink">Why flagged: </span>
        {flag.reason}
      </p>
      <dl className="mt-auto grid grid-cols-3 gap-2 border-t border-ink pt-4">
        {flag.evidence.map((e) => (
          <div key={e.label}>
            <dt className="text-[10px] uppercase tracking-label text-ink/50">{e.label}</dt>
            <dd className="mt-1 font-display text-sm font-semibold">{e.value}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
