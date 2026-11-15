/* eslint-disable @next/next/no-img-element -- previews are local blob: URLs or static SVGs */
import { Badge } from "@/components/ui/Badge";
import { Label } from "@/components/ui/Label";
import { formatConfidence } from "@/lib/confidence";
import type { BillResult } from "@/lib/demo/types";
import { AttemptTrail } from "./AttemptTrail";
import { ChecksList } from "./ChecksList";
import { FieldList } from "./FieldList";
import { LineItemsTable } from "./LineItemsTable";

export function BillCard({ bill, index, flagCount }: { bill: BillResult; index: number; flagCount: number }) {
  const o = bill.outcome;
  return (
    <article className="border border-ink" id={`bill-${bill.id}`}>
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-ink p-5 sm:px-7">
        <div className="min-w-0">
          <Label>Bill {String(index + 1).padStart(2, "0")}</Label>
          <h3 className="mt-1 truncate text-xl font-bold sm:text-2xl">
            {o.ok ? o.extraction.invoiceNumber.value ?? bill.fileName : bill.fileName}
          </h3>
          <p className="truncate text-xs text-ink/50">{bill.fileName}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {flagCount > 0 && <Badge tone="accent">{flagCount} flag{flagCount > 1 ? "s" : ""}</Badge>}
          {o.ok && (
            <Badge tone={o.kind === "ocr" ? "accent" : "ink"}>
              {o.kind === "ocr" ? "Offline OCR · AI quota exhausted" : `AI · ${o.extractedBy}`}
            </Badge>
          )}
          {bill.avgConfidence !== null && <Badge>{formatConfidence(bill.avgConfidence)} avg</Badge>}
        </div>
      </header>

      <div className="border-b border-ink/10 px-5 py-3 sm:px-7">
        <AttemptTrail attempts={o.attempts} />
      </div>

      {!o.ok ? (
        <div className="p-5 sm:p-7">
          <p className="font-display text-lg font-semibold text-accent">This bill couldn&apos;t be read.</p>
          <p className="mt-1 text-sm text-ink/70">{o.error}</p>
        </div>
      ) : (
        <div className="grid gap-8 p-5 sm:p-7 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-4">
            {bill.previewUrl && (
              <a href={bill.previewUrl} target="_blank" rel="noreferrer" className="block">
                <img src={bill.previewUrl} alt={`Preview of ${bill.fileName}`} className="max-h-[380px] w-full border border-ink/20 object-contain" />
              </a>
            )}
            <div>
              <Label>Checks</Label>
              <div className="mt-3">
                <ChecksList checks={bill.checks} />
              </div>
            </div>
          </div>
          <div className="lg:col-span-8">
            <Label>What the AI extracted</Label>
            <div className="mt-3">
              <FieldList extraction={o.extraction} />
            </div>
            <div className="mt-8">
              <Label>Line items</Label>
              <div className="mt-3">
                <LineItemsTable items={o.extraction.lineItems} />
              </div>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
