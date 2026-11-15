import { describe, expect, it } from "vitest";
import { MAX_BILL_BYTES, sniffType, validateUploads } from "./validate-upload";

const bytes = (...b: number[]) => new Uint8Array([...b, ...new Array(12).fill(0)]);
const PDF = bytes(0x25, 0x50, 0x44, 0x46);
const JPG = bytes(0xff, 0xd8, 0xff);
const PNG = bytes(0x89, 0x50, 0x4e, 0x47);
const WEBP = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]);

describe("sniffType", () => {
  it("recognises PDF, JPEG, PNG and WebP by magic bytes", () => {
    expect(sniffType(PDF)).toBe("application/pdf");
    expect(sniffType(JPG)).toBe("image/jpeg");
    expect(sniffType(PNG)).toBe("image/png");
    expect(sniffType(WEBP)).toBe("image/webp");
  });

  it("rejects anything else", () => {
    expect(sniffType(new TextEncoder().encode("<svg xmlns="))).toBeNull();
    expect(sniffType(new Uint8Array())).toBeNull();
  });
});

describe("validateUploads", () => {
  const ok = { name: "a.pdf", size: 100, head: PDF };

  it("accepts up to 5 valid bills", () => {
    expect(validateUploads(Array(5).fill(ok))).toEqual([]);
  });

  it("rejects none, or more than 5", () => {
    expect(validateUploads([])).toHaveLength(1);
    expect(validateUploads(Array(6).fill(ok))[0]).toMatch(/Up to 5/);
  });

  it("rejects empty, oversized and wrong-type files by name", () => {
    const errors = validateUploads([
      { ...ok, name: "empty.pdf", size: 0 },
      { ...ok, name: "big.pdf", size: MAX_BILL_BYTES + 1 },
      { name: "fake.pdf", size: 10, head: new TextEncoder().encode("hello world!") },
    ]);
    expect(errors).toEqual(["empty.pdf is empty.", "big.pdf is over 5 MB.", "fake.pdf isn't a PDF, JPG, PNG or WebP."]);
  });
});
