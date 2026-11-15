"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Label } from "@/components/ui/Label";
import { clearReport, loadReport } from "@/lib/demo/report-store";
import type { Report } from "@/lib/demo/types";
import { BillCard } from "./BillCard";
import { CsvDownload } from "./CsvDownload";
import { FlagCard } from "./FlagCard";
import { SummaryStats } from "./SummaryStats";

export function HisaabResults() {
  const router = useRouter();
  // undefined = still loading from storage (avoids a hydration mismatch)
  const [report, setReport] = useState<Report | null | undefined>(undefined);
  useEffect(() => setReport(loadReport()), []);

  if (report === undefined) return <p className="py-24 text-ink/50">Loading your hisaab…</p>;

  if (report === null) {
    return (
      <div className="py-24">
        <h1 className="text-5xl font-bold sm:text-7xl">Nothing here yet.</h1>
        <p className="mt-4 text-ink/70">Results live only in the tab that created them.</p>
        <Link href="/demo" className="mt-8 inline-block border border-accent bg-accent px-6 py-3 text-sm font-semibold uppercase tracking-label text-paper hover:border-ink hover:bg-ink">
          Try the demo →
        </Link>
      </div>
    );
  }

  const names = new Map(report.bills.map((b) => [b.id, b.outcome.ok ? b.outcome.extraction.invoiceNumber.value ?? b.fileName : b.fileName]));
  const startOver = () => {
    clearReport();
    router.push("/demo");
  };

  return (
    <div className="pb-24 pt-10 sm:pt-16">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <Label accent>{report.kind === "sample" ? "Sample bills · pre-computed AI results" : "Your bills · read live by AI"}</Label>
          <h1 className="mt-5 text-6xl font-bold leading-[0.9] sm:text-8xl lg:text-[9rem]">
            Your <span className="text-accent">Hisaab</span>.
          </h1>
        </div>
        <div className="flex flex-col gap-3 md:items-end">
          <CsvDownload report={report} />
          <button type="button" onClick={startOver} className="text-left text-xs uppercase tracking-label text-ink/60 hover:text-accent md:text-right">
            ← Start over
          </button>
        </div>
      </div>

      {report.notes.map((n) => (
        <p key={n} className="mt-6 border-l-2 border-accent pl-3 text-sm text-ink/70">{n}</p>
      ))}

      <div className="mt-10">
        <SummaryStats summary={report.summary} />
      </div>

      <section className="mt-16">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-4xl font-bold sm:text-5xl">{report.flags.length ? "What needs your attention" : "No flags"}</h2>
          <Label>01 / Flags</Label>
        </div>
        {report.flags.length === 0 ? (
          <p className="mt-4 text-ink/70">Every check passed and no duplicates or price rises were found across these bills.</p>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            {report.flags.map((f) => (
              <FlagCard key={f.id} flag={f} billNames={f.billIds.map((id) => names.get(id) ?? id)} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-20">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-4xl font-bold sm:text-5xl">Bill by bill</h2>
          <Label>02 / What the AI read</Label>
        </div>
        <div className="mt-8 space-y-8">
          {report.bills.map((b, i) => (
            <BillCard key={b.id} bill={b} index={i} flagCount={report.flags.filter((f) => f.billIds.includes(b.id)).length} />
          ))}
        </div>
      </section>
    </div>
  );
}
