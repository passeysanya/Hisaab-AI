import { Label } from "@/components/ui/Label";
import { ExtractedFields } from "./ExtractedFields";
import { SampleBill } from "./SampleBill";

export function AiExtractionDemo() {
  return (
    <section id="ai-at-work" className="border-t border-ink">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-8 sm:py-24">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <h2 className="max-w-3xl text-4xl font-bold leading-none sm:text-6xl">
            See exactly what the <span className="text-accent">AI</span> read.
          </h2>
          <Label>02 / AI at work</Label>
        </div>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink/70">
          Every field comes with a confidence score. If the AI had to infer
          something, it says what and why, so you only check the parts that need
          checking.
        </p>

        <div className="mt-12 grid items-start gap-8 lg:grid-cols-2">
          <SampleBill />
          <ExtractedFields />
        </div>
        <p className="mt-4 text-xs text-ink/50">
          Sample bill from a fictional vendor, for illustration.
        </p>
      </div>
    </section>
  );
}
