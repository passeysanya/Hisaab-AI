/**
 * True when an error means "this model is out of quota / rate limited" (HTTP 429,
 * RESOURCE_EXHAUSTED). Only these errors move extraction to the next model.
 */
export function isQuotaError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { status?: unknown; code?: unknown; message?: unknown };
  if (e.status === 429 || e.code === 429) return true;
  const message = typeof e.message === "string" ? e.message : "";
  return /RESOURCE_EXHAUSTED|\b429\b|quota exceeded|exceeded your current quota/i.test(message);
}
