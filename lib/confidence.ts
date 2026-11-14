export type ConfidenceLevel = "high" | "review" | "low";

/** Fields at or above this are trusted; below it a human should glance at them. */
export const REVIEW_THRESHOLD = 0.85;
/** Below this, the field is treated as unreliable. */
export const LOW_THRESHOLD = 0.6;

export function confidenceLevel(score: number): ConfidenceLevel {
  if (!Number.isFinite(score)) return "low";
  if (score >= REVIEW_THRESHOLD) return "high";
  if (score >= LOW_THRESHOLD) return "review";
  return "low";
}

/** 0.934 -> "93%". Clamps to 0–100. */
export function formatConfidence(score: number): string {
  const clamped = Math.min(1, Math.max(0, Number.isFinite(score) ? score : 0));
  return `${Math.round(clamped * 100)}%`;
}
