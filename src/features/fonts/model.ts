import { FontFamilyAsset } from "../../types";

export type FontViewFilter =
  | "all"
  | "variable"
  | "color"
  | "collections"
  | "ttf"
  | "otf"
  | "woff"
  | "woff2"
  | "ttc";

export const FONT_VIEW_FILTERS: Array<{
  title: string;
  value: FontViewFilter;
}> = [
  { title: "All Fonts", value: "all" },
  { title: "Variable Fonts", value: "variable" },
  { title: "Color Fonts", value: "color" },
  { title: "Collections", value: "collections" },
  { title: "TTF", value: "ttf" },
  { title: "OTF", value: "otf" },
  { title: "WOFF", value: "woff" },
  { title: "WOFF2", value: "woff2" },
  { title: "TTC / DFont", value: "ttc" },
];

export function groupFontFamiliesByCategory(
  families: FontFamilyAsset[],
): Array<[string, FontFamilyAsset[]]> {
  const groups = new Map<string, FontFamilyAsset[]>();

  for (const family of families) {
    const categoryPath = fontCategoryPath(family);
    groups.set(categoryPath, [...(groups.get(categoryPath) ?? []), family]);
  }

  return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
}

function fontCategoryPath(
  font: Pick<FontFamilyAsset, "category" | "subcategory">,
): string {
  return font.subcategory
    ? `${font.category} / ${font.subcategory}`
    : font.category;
}

export function matchesFontViewFilter(
  family: FontFamilyAsset,
  selectedView: FontViewFilter,
): boolean {
  switch (selectedView) {
    case "variable":
      return family.isVariable;
    case "color":
      return family.isColor;
    case "collections":
      return family.isCollection;
    case "ttf":
      return family.formats.includes("TTF");
    case "otf":
      return family.formats.includes("OTF");
    case "woff":
      return family.formats.includes("WOFF");
    case "woff2":
      return family.formats.includes("WOFF2");
    case "ttc":
      return family.formats.includes("TTC") || family.formats.includes("DFONT");
    default:
      return true;
  }
}

export function weightLabel(weight: number): string {
  if (weight <= 150) {
    return `${weight} (Thin)`;
  }

  if (weight <= 250) {
    return `${weight} (Light)`;
  }

  if (weight <= 350) {
    return `${weight} (Book)`;
  }

  if (weight <= 450) {
    return `${weight} (Regular)`;
  }

  if (weight <= 550) {
    return `${weight} (Medium)`;
  }

  if (weight <= 650) {
    return `${weight} (Semibold)`;
  }

  if (weight <= 750) {
    return `${weight} (Bold)`;
  }

  if (weight <= 850) {
    return `${weight} (Heavy)`;
  }

  return `${weight} (Black)`;
}

export function widthLabel(width: number): string {
  const labels: Record<number, string> = {
    1: "Ultra-condensed",
    2: "Extra-condensed",
    3: "Condensed",
    4: "Semi-condensed",
    5: "Normal",
    6: "Semi-expanded",
    7: "Expanded",
    8: "Extra-expanded",
    9: "Ultra-expanded",
  };

  return labels[width] ? `${width} (${labels[width]})` : `${width}`;
}
