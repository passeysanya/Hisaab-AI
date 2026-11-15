"use client";

import { billsToCsv, lineItemsToCsv } from "@/lib/demo/to-csv";
import type { Report } from "@/lib/demo/types";

function download(name: string, csv: string) {
  // BOM so Excel opens ₹ and Indian names correctly.
  const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const btn =
  "inline-flex items-center gap-2 border px-4 py-2.5 text-xs font-semibold uppercase tracking-label transition-colors";

export function CsvDownload({ report }: { report: Report }) {
  const stamp = report.generatedAt.slice(0, 10);
  return (
    <div className="flex flex-wrap gap-3">
      <button type="button" className={`${btn} border-accent bg-accent text-paper hover:border-ink hover:bg-ink`} onClick={() => download(`hisaab-bills-${stamp}.csv`, billsToCsv(report))}>
        Download bills CSV ↓
      </button>
      <button type="button" className={`${btn} border-ink hover:border-accent hover:text-accent`} onClick={() => download(`hisaab-line-items-${stamp}.csv`, lineItemsToCsv(report))}>
        Line items CSV ↓
      </button>
    </div>
  );
}
