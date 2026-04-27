import { describe, expect, it } from "vitest";

import { colorValueToCircleSwatchDataUrl } from "./color";

describe("color utils", () => {
  it("encodes transparent circle swatches with a checkerboard background", () => {
    const swatch = colorValueToCircleSwatchDataUrl({
      kind: "rgba",
      r: 0,
      g: 15,
      b: 30,
      a: 0.4,
    });

    expect(swatch).toContain("pattern");
    expect(swatch).toContain("url(%23checker)");
    expect(swatch).toContain("fill%3D%22%23000F1E%22");
    expect(swatch).toContain("fill-opacity%3D%220.4%22");
    expect(swatch).toContain("stroke%3D%22%23FFFFFF%22");
  });

  it("omits the checkerboard background for opaque circle swatches", () => {
    const swatch = colorValueToCircleSwatchDataUrl({
      kind: "hex",
      hex: "#1B6AEE",
    });

    expect(swatch).not.toContain("pattern");
    expect(swatch).toContain("stroke-width%3D%226%22");
  });
});
