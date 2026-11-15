import { describe, expect, it } from "vitest";
import { planExtractors } from "./build-extractors";

describe("planExtractors", () => {
  it("chains primary -> fallback -> OCR for Gemini", () => {
    const plan = planExtractors({
      AI_PROVIDER: "gemini",
      GEMINI_API_KEY: "k",
      GEMINI_MODEL: "model-a",
      GEMINI_FALLBACK_MODEL: "model-b",
    });
    expect(plan.steps).toEqual([
      { kind: "gemini", model: "model-a" },
      { kind: "gemini", model: "model-b" },
      { kind: "ocr" },
    ]);
    expect(plan.notes).toEqual([]);
  });

  it("defaults to Gemini when AI_PROVIDER is empty", () => {
    expect(planExtractors({ GEMINI_API_KEY: "k", GEMINI_MODEL: "m" }).provider).toBe("gemini");
  });

  it("goes straight to OCR, with a note, when there is no API key", () => {
    const plan = planExtractors({ GEMINI_MODEL: "model-a" });
    expect(plan.steps).toEqual([{ kind: "ocr" }]);
    expect(plan.notes[0]).toMatch(/GEMINI_API_KEY/);
  });

  it("skips a duplicate or missing fallback model", () => {
    expect(
      planExtractors({ GEMINI_API_KEY: "k", GEMINI_MODEL: "m", GEMINI_FALLBACK_MODEL: "m" }).steps,
    ).toHaveLength(2);
    expect(planExtractors({ GEMINI_API_KEY: "k", GEMINI_MODEL: "m" }).steps).toHaveLength(2);
  });

  it("uses the Claude stub then OCR when AI_PROVIDER=claude", () => {
    const plan = planExtractors({ AI_PROVIDER: "Claude", ANTHROPIC_MODEL: "claude-x" });
    expect(plan.steps).toEqual([{ kind: "claude", model: "claude-x" }, { kind: "ocr" }]);
  });
});
