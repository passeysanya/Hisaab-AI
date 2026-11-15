import { describe, expect, it } from "vitest";
import { isQuotaError } from "./is-quota-error";

describe("isQuotaError", () => {
  it("detects HTTP 429 by status or code", () => {
    expect(isQuotaError({ status: 429, message: "Too Many Requests" })).toBe(true);
    expect(isQuotaError({ code: 429 })).toBe(true);
  });

  it("detects RESOURCE_EXHAUSTED and quota messages", () => {
    expect(isQuotaError(new Error('{"error":{"status":"RESOURCE_EXHAUSTED"}}'))).toBe(true);
    expect(isQuotaError(new Error("You exceeded your current quota"))).toBe(true);
  });

  it("does not treat other failures as quota errors", () => {
    expect(isQuotaError({ status: 400, message: "Invalid argument" })).toBe(false);
    expect(isQuotaError({ status: 404, message: "model not found" })).toBe(false);
    expect(isQuotaError(new Error("fetch failed"))).toBe(false);
    expect(isQuotaError(null)).toBe(false);
    expect(isQuotaError("429")).toBe(false);
  });
});
