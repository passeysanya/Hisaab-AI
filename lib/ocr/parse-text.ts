import { validateGstin } from "../gstin";
import { normalizeDate, parseAmount } from "../ai/normalize";

// Heuristic field extraction from raw OCR text. Used only when every AI model is
// out of quota, so confidences are deliberately capped low to force a human review.

export const OCR_MAX_CONFIDENCE = 0.6;

type Field = { value: string | number | null; confidence: number; note: string | null };

const NOT_FOUND: Field = { value: null, confidence: 0, note: "Not found by offline OCR" };
const GSTIN_RE = /\b\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]\b/;
const DATE_RE = /(\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}|\d{1,2}[\s-][A-Za-z]{3,9}[\s,-]+\d{2,4}|\d{4}-\d{2}-\d{2})/;
const AMOUNT_RE = /(?:₹|rs\.?|inr)?\s*(\d{1,3}(?:,\d{2,3})+(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/gi;

function found(value: string | number, confidence: number, note: string): Field {
  return { value, confidence: Math.min(confidence, OCR_MAX_CONFIDENCE), note };
}

/** The last money-looking number on a line, ignoring percentages like "9%". */
function lastAmount(line: string): number | null {
  const withoutRates = line.replace(/\d+(?:\.\d+)?\s*%/g, " ");
  const matches = [...withoutRates.matchAll(AMOUNT_RE)];
  for (let i = matches.length - 1; i >= 0; i--) {
    const n = parseAmount(matches[i][1]);
    if (n !== null) return n;
  }
  return null;
}

function amountOnLine(lines: string[], label: RegExp, exclude?: RegExp): Field {
  const candidates = lines
    .filter((l) => label.test(l) && !(exclude && exclude.test(l)))
    .map(lastAmount)
    .filter((n): n is number => n !== null);
  if (candidates.length === 0) return NOT_FOUND;
  return found(Math.max(...candidates), 0.5, "Read by offline OCR from a labelled line");
}

function dateAfter(text: string, label: RegExp): string | null {
  const m = new RegExp(label.source + String.raw`[^\n\d]{0,20}` + DATE_RE.source, "i").exec(text);
  return m ? normalizeDate(m[1]) : null;
}

export function parseOcrText(raw: string) {
  const text = raw.replace(/\r/g, "");
  const upper = text.toUpperCase();
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  const gstinMatch = GSTIN_RE.exec(upper);
  const gstin = gstinMatch
    ? validateGstin(gstinMatch[0]).valid
      ? found(gstinMatch[0], 0.6, "First GSTIN on the page; checksum valid")
      : found(gstinMatch[0], 0.3, "First GSTIN on the page; checksum failed, likely an OCR misread")
    : NOT_FOUND;

  const invNo = /(?:invoice|inv|bill)\s*(?:no|number|#)\.?\s*[:\-]?\s*([A-Z0-9][A-Z0-9/\-]{2,})/i.exec(text);
  const po = /\bP\.?\s?O\b\.?\s*(?:no|number|#|ref)?\.?\s*[:\-]?\s*([A-Z0-9][A-Z0-9/\-]{2,})/i.exec(text);

  const dueDate = dateAfter(text, /due(?:\s*date)?/);
  const invoiceDate = dateAfter(text, /(?<!due\s*)(?:invoice\s*)?date(?:d)?/);

  const vendorLine = lines.find(
    (l) => /[A-Za-z]{3,}/.test(l) && !/tax\s*invoice|^invoice$|gstin|bill\s*of\s*supply/i.test(l),
  );

  return {
    vendorName: vendorLine ? found(vendorLine, 0.4, "Assumed to be the first line of the bill") : NOT_FOUND,
    vendorGstin: gstin,
    invoiceNumber: invNo ? found(invNo[1], 0.5, "Read by offline OCR next to an 'Invoice No' label") : NOT_FOUND,
    invoiceDate: invoiceDate ? found(invoiceDate, 0.5, "Read by offline OCR next to a 'Date' label") : NOT_FOUND,
    dueDate: dueDate ? found(dueDate, 0.5, "Read by offline OCR next to a 'Due' label") : NOT_FOUND,
    poNumber: po ? found(po[1], 0.4, "Read by offline OCR next to a 'PO' label") : NOT_FOUND,
    subtotal: amountOnLine(lines, /sub\s*-?\s*total|taxable\s*(value|amount)/i),
    cgst: amountOnLine(lines, /\bCGST\b/i),
    sgst: amountOnLine(lines, /\b(SGST|UTGST)\b/i),
    igst: amountOnLine(lines, /\bIGST\b/i),
    total: amountOnLine(lines, /grand\s*total|total\s*(amount|payable)|net\s*payable|^total\b/i, /sub\s*-?\s*total/i),
    lineItems: [],
  };
}
