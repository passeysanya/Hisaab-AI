import { describe, expect, it } from "vitest";
import { confidenceLevel, formatConfidence } from "./confidence";

describe("confidenceLevel", () => {
  it("treats scores at or above 0.85 as high", () => {
    expect(confidenceLevel(0.85)).toBe("high");
    expect(confidenceLevel(0.99)).toBe("high");
  });

  it("asks for review between 0.6 and 0.85", () => {
    expect(confidenceLevel(0.6)).toBe("review");
    expect(confidenceLevel(0.849)).toBe("review");
  });

  it("marks scores below 0.6 and non-numbers as low", () => {
    expect(confidenceLevel(0.59)).toBe("low");
    expect(confidenceLevel(Number.NaN)).toBe("low");
  });
});

describe("formatConfidence", () => {
  it("rounds to a whole percent", () => {
    expect(formatConfidence(0.934)).toBe("93%");
  });

  it("clamps out-of-range values", () => {
    expect(formatConfidence(1.4)).toBe("100%");
    expect(formatConfidence(-0.2)).toBe("0%");
    expect(formatConfidence(Number.NaN)).toBe("0%");
  });
});
