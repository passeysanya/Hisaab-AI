import { Label } from "@/components/ui/Label";

export function PrivacyNotice() {
  return (
    <aside className="border-l-2 border-accent pl-4 text-sm leading-relaxed text-ink/70" aria-label="Privacy notice">
      <Label accent>Privacy</Label>
      <ul className="mt-2 list-disc space-y-1 pl-4">
        <li>
          Your bills are read in memory and <strong className="text-ink">never saved</strong> by Hisaab AI: no
          database, no disk, no account.
        </li>
        <li>
          To read them, each bill is sent to <strong className="text-ink">Google&apos;s Gemini API (free tier)</strong>.
          Google may use free-tier content to improve its products, so{" "}
          <strong className="text-ink">don&apos;t upload bills with sensitive data</strong>. Use the sample bills
          instead.
        </li>
        <li>If Gemini is out of quota, bills are read on this server by offline OCR and go nowhere else.</li>
        <li>Results stay in this browser tab only and disappear when you close it.</li>
      </ul>
    </aside>
  );
}
