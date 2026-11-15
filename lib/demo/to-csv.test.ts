import { describe, expect, it } from "vitest";
import { buildReport } from "./build-report";
import { sampleBillInputs } from "./sample-bills";
import { billsToCsv, csvCell, lineItemsToCsv } from "./to-csv";

describe("csvCell", () => {
  it("quotes commas, quotes and newlines", () => {
    expect(csvCell('Kaveri, "Main" Store')).toBe('"Kaveri, ""Main"" Store"');
    expect(csvCell("a\nb")).toBe('"a\nb"');
  });

  it("neutralises formula injection in text but not in numbers", () => {
    expect(csvCell("=HYPERLINK(\"x\")")).toBe("\"'=HYPERLINK(\"\"x\"\")\"");
    expect(csvCell("@SUM(A1)")).toBe("'@SUM(A1)");
    expect(csvCell(-5)).toBe("-5");
  });

  it("renders empties and booleans", () => {
    expect(csvCell(null)).toBe("");
    expect(csvCell(true)).toBe("yes");
    expect(csvCell(Number.NaN)).toBe("");
  });
});

describe("report CSVs", () => {
  const report = buildReport("sample", sampleBillInputs());

  it("has a header plus one row per bill", () => {
    const lines = billsToCsv(report).trimEnd().split("\r\n");
    expect(lines).toHaveLength(4);
    expect(lines[0]).toMatch(/^file,status,extracted_by,vendor,gstin/);
    expect(lines[2]).toContain("INV/24-25/0871");
    expect(lines[2]).toContain("120242");
  });

  it("lists every line item", () => {
    const lines = lineItemsToCsv(report).trimEnd().split("\r\n");
    expect(lines).toHaveLength(1 + 2 + 3 + 2);
    expect(lines[1]).toContain('"OPC 53 Grade Cement, 50 kg"');
  });
});
