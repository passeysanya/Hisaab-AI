import { z } from "zod";
import { normalizeDate, parseAmount } from "./normalize";

// Every extractor (Gemini, fallback model, offline OCR) must produce output that
// passes this schema. Values are tolerant of formatting (strings like "₹1,01,900"),
// but structure and confidence ranges are strict.

const confidence = z.number().min(0).max(1);

const text = z.preprocess(
  (v) => (typeof v === "string" ? (v.trim() === "" ? null : v.trim()) : v),
  z.string().nullable(),
);
const amount = z.preprocess(
  (v) => (v === null || v === undefined || v === "" ? null : parseAmount(v) ?? Number.NaN),
  z.number().finite().nullable(),
);
const isoDate = z.preprocess(
  (v) => (v === null || v === undefined || v === "" ? null : normalizeDate(v) ?? "invalid"),
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected a date").nullable(),
);

/** A missing field becomes {value: null, confidence: 0}; a missing value becomes null. */
function field<T extends z.ZodTypeAny>(value: T) {
  return z.preprocess(
    (v) => (v === undefined || v === null ? { value: null, confidence: 0 } : v),
    z.object({
      value: z.preprocess((x) => (x === undefined ? null : x), value),
      confidence: confidence,
      note: z.string().nullish(),
    }),
  );
}

export const lineItemSchema = z.object({
  description: z.string().min(1),
  quantity: amount.default(null),
  unit: text.default(null),
  unitPrice: amount.default(null),
  amount: amount.default(null),
  taxRate: amount.default(null),
  confidence,
});

export const invoiceExtractionSchema = z.object({
  vendorName: field(text),
  vendorGstin: field(text),
  invoiceNumber: field(text),
  invoiceDate: field(isoDate),
  dueDate: field(isoDate),
  poNumber: field(text),
  subtotal: field(amount),
  cgst: field(amount),
  sgst: field(amount),
  igst: field(amount),
  total: field(amount),
  lineItems: z.array(lineItemSchema).default([]),
});

export type InvoiceExtraction = z.infer<typeof invoiceExtractionSchema>;
export type LineItem = z.infer<typeof lineItemSchema>;
export type ExtractedField = InvoiceExtraction["vendorName"];

export const SCALAR_FIELDS = [
  "vendorName",
  "vendorGstin",
  "invoiceNumber",
  "invoiceDate",
  "dueDate",
  "poNumber",
  "subtotal",
  "cgst",
  "sgst",
  "igst",
  "total",
] as const;
export type ScalarField = (typeof SCALAR_FIELDS)[number];

export class InvalidExtractionError extends Error {
  constructor(public readonly issues: string[]) {
    super(`AI output failed validation: ${issues.slice(0, 3).join("; ")}`);
    this.name = "InvalidExtractionError";
  }
}

/** Parse raw model output (object or JSON string). Throws InvalidExtractionError. */
export function parseExtraction(raw: unknown): InvoiceExtraction {
  let data = raw;
  if (typeof raw === "string") {
    const json = raw.trim().replace(/^```(?:json)?\s*|\s*```$/g, "");
    try {
      data = JSON.parse(json);
    } catch {
      throw new InvalidExtractionError(["Response was not valid JSON"]);
    }
  }
  const result = invoiceExtractionSchema.safeParse(data);
  if (!result.success) {
    throw new InvalidExtractionError(
      result.error.issues.map((i) => `${i.path.join(".") || "root"}: ${i.message}`),
    );
  }
  return result.data;
}
