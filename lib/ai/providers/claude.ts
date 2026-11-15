import type { Extractor } from "../types";

/**
 * Placeholder for a Claude (Anthropic API) extractor. Selected with AI_PROVIDER=claude.
 * Not implemented yet: it fails clearly instead of silently falling back.
 */
export function claudeExtractor(model: string | undefined): Extractor {
  const label = model || "claude";
  return {
    id: `claude:${label}`,
    label,
    kind: "ai",
    async run() {
      throw new Error("Claude provider is not implemented yet. Set AI_PROVIDER=gemini in .env.local.");
    },
  };
}
