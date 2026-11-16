import type { Extractor } from "./types";

export type ExtractorEnv = {
  [key: string]: string | undefined;
  AI_PROVIDER?: string;
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
  GEMINI_FALLBACK_MODEL?: string;
  ANTHROPIC_MODEL?: string;
};

export type ChainStep = { kind: "gemini" | "claude"; model: string } | { kind: "ocr" };

export type ExtractorPlan = {
  provider: "gemini" | "claude";
  steps: ChainStep[];
  /** Human-readable notes about missing config, shown in the UI. */
  notes: string[];
};

/** Works out the fallback chain from env vars. Pure, so it's easy to test. */
export function planExtractors(env: ExtractorEnv): ExtractorPlan {
  const provider = (env.AI_PROVIDER || "gemini").trim().toLowerCase() === "claude" ? "claude" : "gemini";
  const steps: ChainStep[] = [];
  const notes: string[] = [];

  if (provider === "claude") {
    steps.push({ kind: "claude", model: env.ANTHROPIC_MODEL?.trim() || "claude" });
  } else {
    const key = env.GEMINI_API_KEY?.trim();
    const primary = env.GEMINI_MODEL?.trim();
    const fallback = env.GEMINI_FALLBACK_MODEL?.trim();

    if (!key) {
      notes.push("GEMINI_API_KEY is not set, so bills were read by offline OCR only.");
    } else {
      if (primary) steps.push({ kind: "gemini", model: primary });
      else notes.push("GEMINI_MODEL is not set; skipping the primary model.");
      if (fallback && fallback !== primary) steps.push({ kind: "gemini", model: fallback });
    }
  }

  steps.push({ kind: "ocr" });
  return { provider, steps, notes };
}

/** Builds real extractors for the server. Imports providers lazily so OCR/SDK stay server-only. */
export async function buildExtractors(env: ExtractorEnv): Promise<{ extractors: Extractor[]; plan: ExtractorPlan }> {
  const plan = planExtractors(env);
  const extractors: Extractor[] = [];

  for (const step of plan.steps) {
    if (step.kind === "gemini") {
      const { geminiExtractor } = await import("./providers/gemini");
      extractors.push(geminiExtractor(env.GEMINI_API_KEY!.trim(), step.model));
    } else if (step.kind === "claude") {
      const { claudeExtractor } = await import("./providers/claude");
      extractors.push(claudeExtractor(step.model));
    } else {
      const { serverOcrExtractor } = await import("../ocr/server-ocr");
      extractors.push(serverOcrExtractor());
    }
  }
  return { extractors, plan };
}
