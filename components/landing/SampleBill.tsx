import { formatINR, sampleBill as b } from "@/lib/sample-invoice";

/** A stylised vendor bill, the "input" side of the AI demo. */
export function SampleBill() {
  return (
    <figure className="relative border border-ink bg-paper p-5 text-[13px] leading-snug sm:p-7">
      <span className="absolute -top-3 left-4 bg-paper px-2 text-[11px] font-semibold uppercase tracking-label text-ink/60">
        Incoming · WhatsApp photo
      </span>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display text-base font-bold">{b.vendor}</p>
          <p className="text-ink/60">{b.address}</p>
          <p className="mt-1 font-mono">GSTIN {b.gstin}</p>
        </div>
        <div className="text-right">
          <p className="font-display font-bold uppercase">Tax invoice</p>
          <p className="font-mono">{b.invoiceNumber}</p>
          <p className="text-ink/60">{b.invoiceDate}</p>
        </div>
      </div>

      <p className="mt-4 text-ink/60">
        Your PO: <span className="font-mono text-ink">{b.poRef}</span> · Terms:{" "}
        <span className="font-serif italic text-ink">{b.terms}</span>
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[300px] border-collapse">
          <thead>
            <tr className="border-y border-ink/30 text-left text-[11px] uppercase tracking-label text-ink/60">
              <th className="py-2 font-medium">Item</th>
              <th className="py-2 text-right font-medium">Qty</th>
              <th className="py-2 text-right font-medium">Rate</th>
              <th className="py-2 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {b.lines.map((l) => (
              <tr key={l.description} className="border-b border-ink/10">
                <td className="py-2 pr-2">{l.description}</td>
                <td className="py-2 text-right tabular-nums">
                  {l.qty} {l.unit}
                </td>
                <td className="py-2 text-right tabular-nums">{formatINR(l.rate)}</td>
                <td className="py-2 text-right tabular-nums">
                  {formatINR(l.qty * l.rate)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <dl className="ml-auto mt-4 w-full max-w-[220px] space-y-1 tabular-nums">
        <Row label="Subtotal" value={formatINR(b.subtotal)} />
        <Row label="CGST 9%" value={formatINR(b.cgst)} />
        <Row label="SGST 9%" value={formatINR(b.sgst)} />
        <div className="flex justify-between border-t border-ink pt-1 font-bold">
          <dt>Total</dt>
          <dd>{formatINR(b.total)}</dd>
        </div>
      </dl>
    </figure>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-ink/60">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
