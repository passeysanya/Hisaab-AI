import { Label } from "@/components/ui/Label";

const steps = [
  {
    n: "01",
    title: "Forward",
    body: "Email the PDF, WhatsApp a photo, or drag it in. One address, one number.",
  },
  {
    n: "02",
    title: "AI reads",
    body: "GSTIN, invoice number, line items, CGST/SGST/IGST, totals and due date, each with a confidence score.",
  },
  {
    n: "03",
    title: "Matched",
    body: "Each line is checked against your purchase order: quantity, unit price, tax rate.",
  },
  {
    n: "04",
    title: "Flagged",
    body: "Duplicates, price increases and over-billing are caught, with the evidence attached.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-t border-ink">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-8 sm:py-24">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <h2 className="text-4xl font-bold leading-none sm:text-6xl">
            Four steps.
            <br />
            Zero typing.
          </h2>
          <Label>01 / How it works</Label>
        </div>

        <ol className="mt-12 grid border-t border-ink sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <li
              key={s.n}
              className={`group border-b border-ink py-8 sm:px-6 lg:border-b-0 ${
                i > 0 ? "lg:border-l" : ""
              } ${i % 2 === 1 ? "sm:border-l lg:border-l" : ""} ${i === 0 ? "sm:pl-0" : ""}`}
            >
              <span className="font-display text-6xl font-bold text-ink/15 transition-colors group-hover:text-accent">
                {s.n}
              </span>
              <h3 className="mt-4 text-2xl font-bold">{s.title}</h3>
              <p className="mt-2 leading-relaxed text-ink/70">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
