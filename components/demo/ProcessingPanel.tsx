"use client";

import { useEffect, useState } from "react";
import { Label } from "@/components/ui/Label";

export function ProcessingPanel({ fileNames, chain }: { fileNames: string[]; chain: string[] }) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="border border-ink bg-ink p-6 text-paper sm:p-8" role="status" aria-live="polite">
      <div className="flex items-center gap-3">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60 motion-reduce:hidden" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent" />
        </span>
        <Label className="!text-paper/60">AI is reading · {seconds}s</Label>
      </div>
      <p className="mt-4 font-display text-3xl font-bold">
        Reading {fileNames.length} bill{fileNames.length > 1 ? "s" : ""}…
      </p>
      <ul className="mt-4 space-y-1 text-sm text-paper/70">
        {fileNames.map((n) => (
          <li key={n} className="truncate">
            · {n}
          </li>
        ))}
      </ul>
      <p className="mt-6 text-xs leading-relaxed text-paper/50">
        Bills are read one at a time to respect free-tier limits: {chain.join(" → ")}. This usually takes 3–10
        seconds per bill. Offline OCR is slower.
      </p>
    </div>
  );
}
