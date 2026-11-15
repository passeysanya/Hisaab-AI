import type { Report } from "./types";

// Hands the report from /demo to /demo/results. Kept in memory for same-tab navigation
// (including blob: preview URLs) and mirrored to sessionStorage, without previews, so a
// refresh still works. Nothing leaves the browser.

const KEY = "hisaab-demo-report";
let memory: Report | null = null;

export function saveReport(report: Report): void {
  memory = report;
  try {
    const persisted: Report = {
      ...report,
      bills: report.bills.map((b) => (b.previewUrl?.startsWith("blob:") ? { ...b, previewUrl: null } : b)),
    };
    sessionStorage.setItem(KEY, JSON.stringify(persisted));
  } catch {
    // Storage blocked or full: in-memory copy still works for this navigation.
  }
}

export function loadReport(): Report | null {
  if (memory) return memory;
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Report) : null;
  } catch {
    return null;
  }
}

export function clearReport(): void {
  for (const b of memory?.bills ?? []) {
    if (b.previewUrl?.startsWith("blob:")) URL.revokeObjectURL(b.previewUrl);
  }
  memory = null;
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
