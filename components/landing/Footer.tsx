import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";

export function Footer() {
  return (
    <footer id="early-access" className="border-t border-ink">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-8 sm:py-24">
        <Label accent>04 / Early access</Label>
        <h2 className="mt-6 text-5xl font-bold leading-[0.95] sm:text-7xl lg:text-8xl">
          Stop typing bills
          <br />
          into Tally.
        </h2>
        <div className="mt-10">
          <Button href="mailto:hello@example.com?subject=Hisaab%20AI%20early%20access">
            Join the waitlist →
          </Button>
        </div>
      </div>
      <div className="border-t border-ink">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-2 px-4 py-6 text-xs uppercase tracking-label text-ink/60 sm:flex-row sm:px-8">
          <span>Hisaab AI · Portfolio project</span>
          <span>
            Extraction by <span className="text-accent">Claude</span> · validated with Zod
          </span>
        </div>
      </div>
    </footer>
  );
}
