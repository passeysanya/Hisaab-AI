import type { Metadata } from "next";
import { AiChain, type ChainStepView } from "@/components/demo/AiChain";
import { DemoWorkbench } from "@/components/demo/DemoWorkbench";
import { Header } from "@/components/landing/Header";
import { Label } from "@/components/ui/Label";
import { planExtractors } from "@/lib/ai/build-extractors";

export const metadata: Metadata = {
  title: "Try Hisaab AI on your bills",
  description: "Upload up to 5 vendor bills or use samples. Gemini extracts GSTIN, line items and tax, then flags duplicates and price rises.",
};

// Reads env at request time so the chain shown matches .env.local.
export const dynamic = "force-dynamic";

export default function DemoPage() {
  // Only model names leave the server, never keys.
  const plan = planExtractors(process.env);
  const steps: ChainStepView[] = plan.steps.map((s, i) =>
    s.kind === "ocr"
      ? { label: "Offline OCR", detail: "Tesseract.js · last resort" }
      : { label: s.model, detail: i === 0 ? `${s.kind} · primary` : `${s.kind} · on 429 / quota` },
  );

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-4 pb-24 pt-10 sm:px-8 sm:pt-16">
        <Label accent>Live demo</Label>
        <h1 className="mt-5 text-5xl font-bold leading-[0.92] sm:text-7xl lg:text-8xl">
          Hand over the bills.
          <br />
          Get your <span className="underline decoration-accent decoration-[0.08em] underline-offset-[0.12em]">hisaab</span>.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink/70">
          AI reads every field with a confidence score, checks the GSTIN checksum and the arithmetic, then compares
          the bills with each other to catch duplicates and price rises.
        </p>

        <div className="mt-10 border-y border-ink py-6">
          <AiChain steps={steps} notes={plan.notes} />
        </div>

        <div className="mt-10">
          <DemoWorkbench chain={steps.map((s) => s.label)} />
        </div>
      </main>
    </>
  );
}
