import { describe, expect, it } from "vitest";
import { gstinCheckChar, validateGstin } from "./gstin";

describe("validateGstin", () => {
  it("accepts GSTINs with a correct checksum", () => {
    for (const g of ["27AAPFU0939F1ZV", "29AAGCS4821K1Z0", "24AAHFM7712Q1ZT"]) {
      const r = validateGstin(g);
      expect(r.valid, g).toBe(true);
    }
  });

  it("reports the state", () => {
    const r = validateGstin("29AAGCS4821K1Z0");
    expect(r.valid && r.state).toBe("Karnataka");
  });

  it("normalises case and whitespace", () => {
    expect(validateGstin(" 29aagcs4821k1z0 ").valid).toBe(true);
  });

  it("rejects a bad checksum and says what was expected", () => {
    const r = validateGstin("29AAGCS4821K1Z5");
    expect(r.valid).toBe(false);
    expect(!r.valid && r.reason).toMatch(/expected 0/);
  });

  it("rejects wrong length, bad pattern and unknown state code", () => {
    expect(validateGstin("29AAGCS4821K1Z").valid).toBe(false);
    expect(validateGstin("29AAGCS4821K1X0").valid).toBe(false); // 14th char must be Z
    expect(validateGstin("2AAAGCS4821K1Z0").valid).toBe(false);
    const unknown = validateGstin(`55AAGCS4821K1Z${gstinCheckChar("55AAGCS4821K1Z")}`);
    expect(!unknown.valid && unknown.reason).toMatch(/state code/);
  });
});
