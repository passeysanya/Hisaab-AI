import { describe, expect, it } from "vitest";
import { fitWithin } from "./shrink-image";

describe("fitWithin", () => {
  it("scales the long side down to the limit, keeping the aspect ratio", () => {
    expect(fitWithin(4000, 3000)).toEqual({ width: 2000, height: 1500 });
    expect(fitWithin(3000, 6000, 1000)).toEqual({ width: 500, height: 1000 });
  });

  it("never enlarges small images", () => {
    expect(fitWithin(800, 600)).toEqual({ width: 800, height: 600 });
  });
});
