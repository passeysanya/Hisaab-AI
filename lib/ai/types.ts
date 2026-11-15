import type { InvoiceExtraction } from "./invoice-schema";

export type ExtractInput = {
  data: Buffer;
  mimeType: string;
  fileName: string;
};

export type ExtractorKind = "ai" | "ocr";

export type Extractor = {
  /** Stable id, e.g. "gemini:gemini-3.5-flash-lite" or "offline-ocr". */
  id: string;
  /** Shown in the UI, e.g. the model name. */
  label: string;
  kind: ExtractorKind;
  /** Returns raw output (JSON string or object); validated by parseExtraction. */
  run(input: ExtractInput): Promise<unknown>;
};

export type Attempt = {
  extractor: string;
  label: string;
  kind: ExtractorKind;
  ok: boolean;
  /** Skipped because an earlier bill in the same batch already hit this model's quota. */
  skipped?: boolean;
  quota?: boolean;
  error?: string;
  ms: number;
};

export type ExtractionOutcome =
  | {
      ok: true;
      extraction: InvoiceExtraction;
      extractedBy: string;
      kind: ExtractorKind;
      attempts: Attempt[];
    }
  | { ok: false; error: string; attempts: Attempt[] };
