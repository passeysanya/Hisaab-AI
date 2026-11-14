import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import { Divider } from "@/components/ui/Divider";

export function Hero() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 pt-12 sm:px-8 sm:pt-20">
      <Label accent>AI bookkeeping for Indian businesses</Label>

      <h1 className="mt-6 text-[3.25rem] font-bold leading-[0.92] sm:text-8xl lg:text-[9rem]">
        Forward the bill.
        <br />
        <span className="underline decoration-accent decoration-[0.08em] underline-offset-[0.12em]">
          AI
        </span>{" "}
        does the
        <br />
        hisaab.
      </h1>

      <Divider className="mt-12" />

      <div className="grid gap-10 pt-8 md:grid-cols-12">
        <p className="text-lg leading-relaxed text-ink/80 md:col-span-6 md:text-xl">
          Send vendor bills (PDFs, photos, WhatsApp images) to one inbox. Hisaab AI
          reads the GSTIN, line items, tax and due dates, matches each bill to its
          purchase order, and tells you which bills are duplicates or charge more than
          agreed. It also tells you <em className="not-italic text-accent">why</em>.
        </p>

        <div className="flex flex-col gap-6 md:col-span-5 md:col-start-8">
          <div className="flex flex-wrap gap-3">
            <Button href="#early-access">Get early access</Button>
            <Button href="#ai-at-work" variant="outline">
              See the AI read a bill
            </Button>
          </div>
          <AiTicker />
        </div>
      </div>
    </section>
  );
}

/** A one-line "what the AI just did" strip, so the AI is visible above the fold. */
function AiTicker() {
  return (
    <div className="border border-ink p-4 text-sm">
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60 motion-reduce:hidden" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
        </span>
        <Label>AI log · sample</Label>
      </div>
      <p className="mt-2 font-display">
        Read <strong>INV/24-25/0871</strong>: 14 fields, GSTIN checksum valid, matched
        to PO-1042, <span className="font-semibold text-accent">2 flags</span>.
      </p>
    </div>
  );
}
