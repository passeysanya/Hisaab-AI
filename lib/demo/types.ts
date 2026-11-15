import type { ExtractionOutcome } from "../ai/types";

export type BillSource = "upload" | "sample";

/** One bill after extraction, before checks and flags. */
export type BillInput = {
  id: string;
  fileName: string;
  source: BillSource;
  /** SHA-256 of the file, used to spot the exact same file uploaded twice. */
  sha256: string | null;
  /** Image preview URL (sample bills only; uploads are never stored). */
  previewUrl: string | null;
  outcome: ExtractionOutcome;
};

export type Check = {
  id: string;
  label: string;
  /** null = couldn't check (data missing). */
  ok: boolean | null;
  detail: string;
};

export type FlagType =
  | "DUPLICATE"
  | "POSSIBLE_DUPLICATE"
  | "PRICE_INCREASE"
  | "INVALID_GSTIN"
  | "TOTALS_MISMATCH"
  | "LINE_MATH"
  | "MISSING_FIELDS";

export type Severity = "high" | "medium" | "low";

export type Flag = {
  id: string;
  type: FlagType;
  severity: Severity;
  title: string;
  /** Plain-English explanation of why this was flagged. */
  reason: string;
  billIds: string[];
  evidence: { label: string; value: string }[];
  /** Money that could be overpaid if this flag is ignored. */
  amountAtRisk?: number;
  /** Bills that shouldn't be counted as payable (e.g. later duplicate copies). */
  excludeFromPayable?: string[];
};

export type BillResult = BillInput & {
  checks: Check[];
  avgConfidence: number | null;
};

export type Report = {
  kind: "sample" | "live";
  generatedAt: string;
  bills: BillResult[];
  flags: Flag[];
  notes: string[];
  summary: {
    billCount: number;
    readCount: number;
    failedCount: number;
    totalBilled: number;
    payable: number;
    amountAtRisk: number;
    flagCount: number;
    avgConfidence: number | null;
    extractedBy: Record<string, number>;
  };
};
