import { describe, expect, it } from "vitest";

import { FontFamilyAsset } from "../../types";
import {
  groupFontFamiliesByCategory,
  matchesFontViewFilter,
  weightLabel,
  widthLabel,
} from "./model";

const family: FontFamilyAsset = {
  id: "inter",
  familyName: "Inter",
  category: "Sans",
  subcategory: "UI",
  source: "local",
  faces: [],
  faceCount: 2,
  styleCount: 2,
  formats: ["TTF", "WOFF2"],
  foundries: ["RSMS"],
  filePaths: ["/tmp/Inter-Regular.ttf"],
  primaryFilePath: "/tmp/Inter-Regular.ttf",
  isVariable: true,
  isColor: false,
  isCollection: false,
  keywords: [],
};

describe("fonts model", () => {
  it("filters by font capabilities and formats", () => {
    expect(matchesFontViewFilter(family, "variable")).toBe(true);
    expect(matchesFontViewFilter(family, "woff2")).toBe(true);
    expect(matchesFontViewFilter(family, "color")).toBe(false);
  });

  it("groups families by category path", () => {
    expect(groupFontFamiliesByCategory([family])).toEqual([
      ["Sans / UI", [family]],
    ]);
  });

  it("formats width and weight labels consistently", () => {
    expect(weightLabel(400)).toBe("400 (Regular)");
    expect(widthLabel(7)).toBe("7 (Expanded)");
  });
});
