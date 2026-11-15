import { describe, expect, it } from "vitest";
import { normalizeDate, parseAmount } from "./normalize";

describe("parseAmount", () => {
  it("parses rupee strings with Indian grouping", () => {
    expect(parseAmount("₹1,01,900")).toBe(101900);
    expect(parseAmount("Rs. 420.50")).toBe(420.5);
    expect(parseAmount("INR 9,171")).toBe(9171);
  });

  it("passes numbers through and rejects junk", () => {
    expect(parseAmount(420)).toBe(420);
    expect(parseAmount("")).toBeNull();
    expect(parseAmount("abc")).toBeNull();
    expect(parseAmount(null)).toBeNull();
    expect(parseAmount(Number.NaN)).toBeNull();
  });
});

describe("normalizeDate", () => {
  it("keeps ISO dates", () => {
    expect(normalizeDate("2026-11-04")).toBe("2026-11-04");
  });

  it("reads Indian day-first dates", () => {
    expect(normalizeDate("04/11/2026")).toBe("2026-11-04");
    expect(normalizeDate("4-11-26")).toBe("2026-11-04");
    expect(normalizeDate("04.11.2026")).toBe("2026-11-04");
  });

  it("reads month names", () => {
    expect(normalizeDate("04 Nov 2026")).toBe("2026-11-04");
    expect(normalizeDate("4-Nov-26")).toBe("2026-11-04");
    expect(normalizeDate("21 October, 2026")).toBe("2026-10-21");
  });

  it("rejects impossible dates", () => {
    expect(normalizeDate("31/02/2026")).toBeNull();
    expect(normalizeDate("next week")).toBeNull();
    expect(normalizeDate(42)).toBeNull();
  });
});
