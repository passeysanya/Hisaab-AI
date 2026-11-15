import { describe, expect, it } from "vitest";
import { SAMPLE_BILLS } from "./sample-bills";
import { renderSampleSvg } from "./sample-svg";

describe("renderSampleSvg", () => {
  it("renders every sample with the watermark and its real numbers", () => {
    for (const bill of SAMPLE_BILLS) {
      const svg = renderSampleSvg(bill);
      expect(svg.startsWith("<svg")).toBe(true);
      expect(svg).toContain("SAMPLE · NOT A REAL BILL");
      expect(svg).toContain(bill.extraction.invoiceNumber.value!);
    }
  });

  it("escapes text", () => {
    const bill = { ...SAMPLE_BILLS[0], address: "<script>&" };
    expect(renderSampleSvg(bill)).toContain("&lt;script&gt;&amp;");
  });
});
