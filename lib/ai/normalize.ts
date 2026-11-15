// Turns the messy values models and OCR produce into clean numbers and ISO dates.

/** "₹1,01,900.50" / "Rs. 420" / 420 -> number. Empty or unparseable -> null. */
export function parseAmount(input: unknown): number | null {
  if (input === null || input === undefined) return null;
  if (typeof input === "number") return Number.isFinite(input) ? input : null;
  if (typeof input !== "string") return null;
  const cleaned = input.replace(/(₹|rs\.?|inr)/gi, "").replace(/[,\s]/g, "");
  if (cleaned === "" || !/^-?\d+(\.\d+)?$/.test(cleaned)) return null;
  return Number(cleaned);
}

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

function iso(y: number, m: number, d: number): string | null {
  if (y < 100) y += 2000;
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) {
    return null;
  }
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/**
 * Accepts ISO (2026-11-04), Indian day-first (04/11/2026, 4-11-26, 04.11.2026)
 * and month names (04 Nov 2026, 4-Nov-26). Returns YYYY-MM-DD or null.
 */
export function normalizeDate(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const s = input.trim();

  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s);
  if (m) return iso(+m[1], +m[2], +m[3]);

  m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2}|\d{4})$/.exec(s);
  if (m) return iso(+m[3], +m[2], +m[1]);

  m = /^(\d{1,2})[\s-]+([A-Za-z]{3})[a-z]*[\s,-]+(\d{2}|\d{4})$/.exec(s);
  if (m) {
    const month = MONTHS[m[2].toLowerCase()];
    return month ? iso(+m[3], month, +m[1]) : null;
  }
  return null;
}
