"use client";

import { useRef, useState } from "react";
import { Label } from "@/components/ui/Label";
import { ACCEPTED_TYPES, MAX_BILLS } from "@/lib/demo/validate-upload";
import { PrivacyNotice } from "./PrivacyNotice";

type Props = {
  files: File[];
  onChange: (files: File[]) => void;
  onSubmit: () => void;
  busy: boolean;
};

const kb = (n: number) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(n / 1024)} KB`);

export function UploadPanel({ files, onChange, onSubmit, busy }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const add = (list: FileList | null) => {
    if (!list) return;
    const next = [...files];
    for (const f of Array.from(list)) {
      if (!next.some((x) => x.name === f.name && x.size === f.size)) next.push(f);
    }
    onChange(next.slice(0, MAX_BILLS));
  };

  return (
    <section className="flex flex-col border border-ink p-5 sm:p-7">
      <Label accent>Option B · live AI</Label>
      <h2 className="mt-3 text-3xl font-bold leading-tight">Upload up to {MAX_BILLS} bills</h2>
      <p className="mt-2 text-sm leading-relaxed text-ink/70">
        PDF, JPG, PNG or WebP, 5 MB each. Gemini reads them live. Upload two bills from the same vendor to see
        cross-bill flags.
      </p>

      <div
        role="button"
        tabIndex={0}
        onClick={() => input.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          add(e.dataTransfer.files);
        }}
        className={`mt-6 flex min-h-[120px] cursor-pointer flex-col items-center justify-center border border-dashed p-6 text-center transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${
          dragging ? "border-accent bg-accent/5" : "border-ink/40 hover:border-accent"
        }`}
      >
        <p className="font-display text-lg font-semibold">Drop bills here</p>
        <p className="text-xs text-ink/50">or click to choose · {files.length}/{MAX_BILLS} added</p>
        <input
          ref={input}
          type="file"
          multiple
          accept={ACCEPTED_TYPES.join(",")}
          className="hidden"
          onChange={(e) => {
            add(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {files.length > 0 && (
        <ul className="mt-4 divide-y divide-ink/10 border-y border-ink/10">
          {files.map((f, i) => (
            <li key={`${f.name}-${f.size}`} className="flex items-center justify-between gap-3 py-2 text-sm">
              <span className="min-w-0 truncate">{f.name}</span>
              <span className="flex shrink-0 items-center gap-3 text-xs text-ink/50">
                {kb(f.size)}
                <button
                  type="button"
                  onClick={() => onChange(files.filter((_, j) => j !== i))}
                  className="uppercase tracking-label hover:text-accent"
                  aria-label={`Remove ${f.name}`}
                >
                  Remove
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6">
        <PrivacyNotice />
      </div>

      <button
        type="button"
        onClick={onSubmit}
        disabled={busy || files.length === 0}
        className="mt-6 inline-flex w-full items-center justify-center border border-accent bg-accent px-6 py-3 text-sm font-semibold uppercase tracking-label text-paper transition-colors hover:border-ink hover:bg-ink disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
      >
        Read my bills with AI →
      </button>
    </section>
  );
}
