import { describe, expect, it } from "vitest";

import { ColorAsset } from "../../types";
import { colorPinKey, getColorMetadata } from "../../utils/color";
import {
  buildColorDetailMarkdown,
  buildColorSwatchMarkdownUrl,
  groupColorsByCategory,
  matchesColorViewFilter,
} from "./model";

const solidColor: ColorAsset = {
  id: "primary",
  name: "Primary",
  category: "Brand",
  subcategory: "Core",
  source: "json",
  value: { kind: "hex", hex: "#1B6AEE" },
  token: "--color-primary",
};

const transparentColor: ColorAsset = {
  id: "overlay",
  name: "Overlay",
  category: "Effects",
  subcategory: "Glass",
  source: "json",
  value: { kind: "rgba", r: 0, g: 15, b: 30, a: 0.4 },
};

describe("colors model", () => {
  it("matches view filters using computed metadata", () => {
    const pinnedSet = new Set([colorPinKey(solidColor)]);

    expect(matchesColorViewFilter(solidColor, "pinned", pinnedSet)).toBe(true);
    expect(matchesColorViewFilter(solidColor, "tokenized", pinnedSet)).toBe(
      true,
    );
    expect(
      matchesColorViewFilter(transparentColor, "transparent", pinnedSet),
    ).toBe(true);
    expect(matchesColorViewFilter(transparentColor, "solid", pinnedSet)).toBe(
      false,
    );
  });

  it("groups pinned colors ahead of category sections", () => {
    const pinnedSet = new Set([colorPinKey(solidColor)]);

    expect(
      groupColorsByCategory([transparentColor, solidColor], pinnedSet),
    ).toEqual([
      ["Pinned", [solidColor]],
      ["Effects / Glass", [transparentColor]],
    ]);
  });

  it("builds detail markdown with copy-ready metadata", () => {
    const markdown = buildColorDetailMarkdown(
      solidColor,
      getColorMetadata(solidColor),
      true,
    );

    expect(markdown).toContain("# Primary");
    expect(markdown).toContain("> Pinned in Raycast.");
    expect(markdown).toContain("`#1B6AEE`");
    expect(markdown).toContain("Recommended text color");
  });

  it("embeds rgba swatches as data urls", () => {
    expect(buildColorSwatchMarkdownUrl(transparentColor)).toContain(
      "data:image/svg+xml,",
    );
    expect(buildColorSwatchMarkdownUrl(transparentColor)).toContain(
      "fill%3D%22%23000f1e66%22",
    );
  });
});
