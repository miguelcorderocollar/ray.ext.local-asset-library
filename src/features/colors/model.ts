import { ColorAsset, ColorMetadata } from "../../types";
import {
  colorCategoryPath,
  colorPinKey,
  colorValueToHex,
  getColorMetadata,
} from "../../utils/color";

export type ColorViewMode = "grid" | "list";

export type ColorViewFilter =
  | "all"
  | "pinned"
  | "tokenized"
  | "transparent"
  | "solid"
  | "light"
  | "dark";

export const COLOR_PINNED_SECTION_TITLE = "Pinned";

export const COLOR_VIEW_FILTERS: Array<{
  title: string;
  value: ColorViewFilter;
}> = [
  { title: "All Colors", value: "all" },
  { title: "Pinned", value: "pinned" },
  { title: "With Tokens", value: "tokenized" },
  { title: "Transparent", value: "transparent" },
  { title: "Solid", value: "solid" },
  { title: "Light Colors", value: "light" },
  { title: "Dark Colors", value: "dark" },
];

export function matchesColorViewFilter(
  color: ColorAsset,
  selectedView: ColorViewFilter,
  pinnedSet: Set<string>,
): boolean {
  const metadata = getColorMetadata(color);

  switch (selectedView) {
    case "pinned":
      return pinnedSet.has(colorPinKey(color));
    case "tokenized":
      return Boolean(color.token);
    case "transparent":
      return metadata.isTransparent;
    case "solid":
      return !metadata.isTransparent;
    case "light":
      return metadata.tone === "light";
    case "dark":
      return metadata.tone === "dark";
    default:
      return true;
  }
}

export function groupColorsByCategory(
  colors: ColorAsset[],
  pinnedSet: Set<string>,
  pinnedSectionTitle = COLOR_PINNED_SECTION_TITLE,
): Array<[string, ColorAsset[]]> {
  const pinnedColors: ColorAsset[] = [];
  const groups = new Map<string, ColorAsset[]>();

  for (const color of sortColors(colors, pinnedSet)) {
    if (pinnedSet.has(colorPinKey(color))) {
      pinnedColors.push(color);
      continue;
    }

    const categoryPath = colorCategoryPath(color);
    groups.set(categoryPath, [...(groups.get(categoryPath) ?? []), color]);
  }

  const sortedGroups = Array.from(groups.entries()).sort(([a], [b]) =>
    a.localeCompare(b),
  );

  return pinnedColors.length > 0
    ? [[pinnedSectionTitle, pinnedColors], ...sortedGroups]
    : sortedGroups;
}

export function buildColorDetailMarkdown(
  color: ColorAsset,
  metadata: ColorMetadata,
  isPinned: boolean,
): string {
  return [
    `# ${color.name}`,
    "",
    `**${metadata.categoryPath}**`,
    "",
    isPinned ? "> Pinned in Raycast." : "",
    "",
    `![${color.name}](${buildColorSwatchMarkdownUrl(color)})`,
    "",
    "## Copy-Ready Values",
    "",
    `- CSS: \`${metadata.cssValue}\``,
    metadata.hexValue
      ? `- HEX: \`${metadata.hexValue}\``
      : "- HEX: Not available as a fully opaque hex value",
    `- RGB/RGBA: \`${metadata.rgbValue}\``,
    color.token ? `- Token: \`${color.token}\`` : "- Token: None",
    "",
    "## Characteristics",
    "",
    `- Family: **${capitalize(metadata.family)}**`,
    `- Tone: **${capitalize(metadata.tone)}**`,
    `- Opacity: **${metadata.opacityPercent}%**`,
    `- Recommended text color: **${capitalize(metadata.contrastText)}**`,
    `- HSL: **${metadata.hue}° / ${metadata.saturation}% / ${metadata.lightness}%**`,
    `- Relative luminance: **${metadata.luminance.toFixed(3)}**`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildColorSwatchMarkdownUrl(color: ColorAsset): string {
  const hex = colorValueToHex(color.value) ?? rgbaToHex(color.value);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="640" height="240" viewBox="0 0 640 240">
      <rect width="640" height="240" rx="24" fill="${hex}" />
    </svg>
  `.trim();
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function sortColors(
  colors: ColorAsset[],
  pinnedSet: Set<string>,
): ColorAsset[] {
  return [...colors].sort((left, right) => {
    const leftPinned = pinnedSet.has(colorPinKey(left));
    const rightPinned = pinnedSet.has(colorPinKey(right));

    if (leftPinned !== rightPinned) {
      return leftPinned ? -1 : 1;
    }

    return left.name.localeCompare(right.name);
  });
}

function rgbaToHex(colorValue: ColorAsset["value"]): string {
  if (colorValue.kind === "hex") {
    return colorValue.hex;
  }

  const alpha = Math.round(colorValue.a * 255)
    .toString(16)
    .padStart(2, "0");

  return `#${[colorValue.r, colorValue.g, colorValue.b]
    .map((channel) => channel.toString(16).padStart(2, "0"))
    .join("")}${alpha}`;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
