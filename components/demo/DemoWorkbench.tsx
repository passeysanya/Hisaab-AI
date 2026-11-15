"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { buildReport } from "@/lib/demo/build-report";
import { saveReport } from "@/lib/demo/report-store";
import { sampleBillInputs } from "@/lib/demo/sample-bills";
import type { Report } from "@/lib/demo/types";
import { validateUploads } from "@/lib/demo/validate-upload";
import { ProcessingPanel } from "./ProcessingPanel";
import { SamplePicker } from "./SamplePicker";
import { UploadPanel } from "./UploadPanel";

async function clientErrors(files: File[]): Promise<string[]> {
  const checks = await Promise.all(
    files.map(async (f) => ({ name: f.name, size: f.size, head: new Uint8Array(await f.slice(0, 16).arrayBuffer()) })),
  );
  return validateUploads(checks);
}

export function DemoWorkbench({ chain }: { chain: string[] }) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const finish = (report: Report) => {
    saveReport(report);
    router.push("/demo/results");
  };

  const runSamples = () => finish(buildReport("sample", sampleBillInputs()));

  const submit = async () => {
    setError(null);
    const problems = await clientErrors(files);
    if (problems.length) return setError(problems.join(" "));

    setBusy(true);
    try {
      const body = new FormData();
      files.forEach((f) => body.append("bills", f));
      const res = await fetch("/api/demo/extract", { method: "POST", body });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) {
        setError(data?.error ?? `Something went wrong (HTTP ${res.status}). Try the sample bills.`);
        setBusy(false);
        return;
      }
      const report = data as Report;
      // Attach local previews for images (this tab only; never uploaded anywhere else).
      report.bills = report.bills.map((b, i) =>
        files[i]?.type.startsWith("image/") ? { ...b, previewUrl: URL.createObjectURL(files[i]) } : b,
      );
      finish(report);
    } catch {
      setError("Couldn't reach the server. Check your connection, or try the sample bills.");
      setBusy(false);
    }
  };

  if (busy) return <ProcessingPanel fileNames={files.map((f) => f.name)} chain={chain} />;

  return (
    <div>
      {error && (
        <p role="alert" className="mb-6 border border-accent bg-accent/5 p-4 text-sm text-ink">
          <strong className="text-accent">Couldn&apos;t read the bills.</strong> {error}
        </p>
      )}
      <div className="grid items-stretch gap-6 lg:grid-cols-2">
        <SamplePicker onUse={runSamples} disabled={busy} />
        <UploadPanel files={files} onChange={setFiles} onSubmit={submit} busy={busy} />
      </div>
    </div>
  );
}
