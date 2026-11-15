import { ConfidenceBar } from "@/components/ui/ConfidenceBar";
import { formatINR } from "@/lib/format";
import type { LineItem } from "@/lib/ai/invoice-schema";

const money = (n: number | null) => (n === null ? "–" : formatINR(n));

export function LineItemsTable({ items }: { items: LineItem[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-ink/50">No line items extracted.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-ink text-left text-[11px] uppercase tracking-label text-ink/60">
            <th className="py-2 font-medium">Item</th>
            <th className="py-2 text-right font-medium">Qty</th>
            <th className="py-2 text-right font-medium">Rate</th>
            <th className="py-2 text-right font-medium">Amount</th>
            <th className="py-2 pl-4 font-medium">AI confidence</th>
          </tr>
        </thead>
        <tbody>
          {items.map((l, i) => (
            <tr key={`${l.description}-${i}`} className="border-b border-ink/10">
              <td className="py-2 pr-2">{l.description}</td>
              <td className="py-2 text-right tabular-nums">
                {l.quantity ?? "–"} {l.unit ?? ""}
              </td>
              <td className="py-2 text-right tabular-nums">{money(l.unitPrice)}</td>
              <td className="py-2 text-right tabular-nums">{money(l.amount)}</td>
              <td className="py-2 pl-4">
                <ConfidenceBar score={l.confidence} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
