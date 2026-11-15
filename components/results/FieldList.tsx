import { ConfidenceBar } from "@/components/ui/ConfidenceBar";
import { confidenceLevel } from "@/lib/confidence";
import { formatDate, formatINR } from "@/lib/format";
import type { InvoiceExtraction, ScalarField } from "@/lib/ai/invoice-schema";

const FIELDS: { key: ScalarField; label: string; format?: "money" | "date"; hideIfEmpty?: boolean }[] = [
  { key: "vendorName", label: "Vendor" },
  { key: "vendorGstin", label: "GSTIN" },
  { key: "invoiceNumber", label: "Invoice no." },
  { key: "invoiceDate", label: "Invoice date", format: "date" },
  { key: "dueDate", label: "Due date", format: "date" },
  { key: "poNumber", label: "PO reference", hideIfEmpty: true },
  { key: "subtotal", label: "Subtotal", format: "money" },
  { key: "cgst", label: "CGST", format: "money", hideIfEmpty: true },
  { key: "sgst", label: "SGST", format: "money", hideIfEmpty: true },
  { key: "igst", label: "IGST", format: "money", hideIfEmpty: true },
  { key: "total", label: "Total", format: "money" },
];

function display(value: string | number | null, format?: "money" | "date"): string {
  if (value === null) return "Not found";
  if (format === "money" && typeof value === "number") return formatINR(value);
  if (format === "date" && typeof value === "string") return formatDate(value);
  return String(value);
}

/** Every field the AI extracted, its confidence, and the AI's own note when unsure. */
export function FieldList({ extraction }: { extraction: InvoiceExtraction }) {
  return (
    <ul className="divide-y divide-ink/10 border-y border-ink/10">
      {FIELDS.filter((f) => !(f.hideIfEmpty && extraction[f.key].value === null)).map((f) => {
        const field = extraction[f.key];
        const missing = field.value === null;
        const review = !missing && confidenceLevel(field.confidence) !== "high";
        return (
          <li key={f.key} className="py-2.5">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-label text-ink/50">{f.label}</p>
                <p className={`truncate font-display text-[15px] ${missing ? "text-ink/40" : review ? "text-accent" : ""}`}>
                  {display(field.value, f.format)}
                </p>
              </div>
              {!missing && <ConfidenceBar score={field.confidence} />}
            </div>
            {field.note && (
              <p className={`mt-1 text-xs leading-relaxed ${review ? "text-accent" : "text-ink/50"}`}>
                {review ? "Why review: " : "AI note: "}
                {field.note}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
