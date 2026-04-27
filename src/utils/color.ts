import { randomUUID } from "node:crypto";

import {
  ColorAsset,
  ColorMetadata,
  ColorValue,
  CustomColorInput,
} from "../types";

const HEX_PATTERN = /^#?([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const RGB_PATTERN =
  /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*(0|1|0?\.\d+))?\s*\)$/i;

export function colorValueToCss(value: ColorValue): string {
  if (value.kind === "hex") {
    return value.hex;
  }

  return `rgba(${value.r}, ${value.g}, ${value.b}, ${trimAlpha(value.a)})`;
}

export function colorValueToHex(value: ColorValue): string | undefined {
  if (value.kind === "hex") {
    return value.hex;
  }

  if (value.a !== 1) {
    return undefined;
  }

  return rgbToHex(value.r, value.g, value.b);
}

export function colorValueToRgb(value: ColorValue): string {
  if (value.kind === "hex") {
    const rgba = hexToRgba(value.hex);
    if (!rgba) {
      return value.hex;
    }

    return rgba.a === 1
      ? `rgb(${rgba.r}, ${rgba.g}, ${rgba.b})`
      : `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${trimAlpha(rgba.a)})`;
  }

  return value.a === 1
    ? `rgb(${value.r}, ${value.g}, ${value.b})`
    : `rgba(${value.r}, ${value.g}, ${value.b}, ${trimAlpha(value.a)})`;
}

export function colorValueToGridColor(value: ColorValue): string {
  if (value.kind === "hex") {
    return value.hex;
  }

  if (value.a < 0.2) {
    return rgbToHex(value.r, value.g, value.b);
  }

  return colorValueToCss(value);
}

export function colorValueToCircleSwatchDataUrl(value: ColorValue): string {
  const isTransparent = isTransparentColorValue(value);
  const fillAttributes = colorValueToCircleFillAttributes(value);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
      ${
        isTransparent
          ? `
      <defs>
        <pattern id="checker" width="48" height="48" patternUnits="userSpaceOnUse">
          <rect width="48" height="48" fill="#F2F2F2" />
          <rect width="24" height="24" fill="#D7D7D7" />
          <rect x="24" y="24" width="24" height="24" fill="#D7D7D7" />
        </pattern>
      </defs>
      <circle cx="256" cy="256" r="176" fill="url(#checker)" />
      `
          : ""
      }
      <circle cx="256" cy="256" r="176" ${fillAttributes} />
      <circle
        cx="256"
        cy="256"
        r="175"
        fill="none"
        stroke="#FFFFFF"
        stroke-opacity="0.8"
        stroke-width="6"
      />
    </svg>
  `.trim();

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function parseColorValue(rawValue: string): ColorValue | undefined {
  const value = rawValue.trim();
  const hexMatch = value.match(HEX_PATTERN);
  if (hexMatch) {
    return { kind: "hex", hex: normalizeHex(hexMatch[1]) };
  }

  const rgbMatch = value.match(RGB_PATTERN);
  if (rgbMatch) {
    const r = Number(rgbMatch[1]);
    const g = Number(rgbMatch[2]);
    const b = Number(rgbMatch[3]);
    const a = rgbMatch[4] === undefined ? 1 : Number(rgbMatch[4]);

    if (
      [r, g, b].every((channel) => channel >= 0 && channel <= 255) &&
      a >= 0 &&
      a <= 1
    ) {
      return { kind: "rgba", r, g, b, a };
    }
  }

  return undefined;
}

export function buildCustomColor(
  input: CustomColorInput,
  existingId?: string,
): ColorAsset {
  const value = parseColorValue(input.value);
  if (!value) {
    throw new Error(
      "Use HEX, RGB, or RGBA, for example #1B6AEE or rgba(0, 15, 30, 0.4).",
    );
  }

  return {
    id: existingId ?? randomUUID(),
    name: input.name.trim(),
    category: input.category.trim(),
    subcategory: input.subcategory?.trim() || undefined,
    source: "json",
    value,
    token: input.token?.trim() || undefined,
    isEditable: true,
  };
}

export function formatColorSubtitle(color: ColorAsset): string {
  const subcategory = color.subcategory ? `${color.subcategory} · ` : "";
  const token = color.token ? `${color.token} · ` : "";
  return `${subcategory}${token}${colorValueToCss(color.value)}`;
}

export function buildColorSearchKeywords(
  color: ColorAsset,
  isPinned = false,
): string[] {
  const metadata = getColorMetadata(color);

  return [
    color.name,
    color.category,
    color.subcategory ?? "",
    colorCategoryPath(color),
    color.token ?? "",
    metadata.cssValue,
    metadata.hexValue ?? "",
    metadata.rgbValue,
    metadata.family,
    metadata.tone,
    metadata.contrastText,
    metadata.isTransparent ? "transparent" : "solid",
    `opacity ${metadata.opacityPercent}%`,
    `alpha ${trimAlpha(metadata.alpha)}`,
    isPinned ? "pinned pin" : "",
    ...metadata.tags,
  ].filter(Boolean);
}

export function getColorMetadata(color: ColorAsset): ColorMetadata {
  const rgba = toRgba(color.value);
  const { hue, saturation, lightness } = rgbToHsl(rgba.r, rgba.g, rgba.b);
  const luminance = relativeLuminance(rgba.r, rgba.g, rgba.b);
  const opacityPercent = Math.round(rgba.a * 100);
  const isTransparent = rgba.a < 1;
  const family = hueToFamily(hue, saturation, lightness);
  const tone = lightness >= 60 ? "light" : "dark";
  const contrastText = luminance > 0.36 ? "black" : "white";
  const cssValue = colorValueToCss(color.value);
  const hexValue = colorValueToHex(color.value);
  const rgbValue = colorValueToRgb(color.value);

  return {
    categoryPath: colorCategoryPath(color),
    cssValue,
    hexValue,
    rgbValue,
    alpha: rgba.a,
    opacityPercent,
    isTransparent,
    hue,
    saturation,
    lightness,
    luminance,
    family,
    tone,
    contrastText,
    tags: [
      family,
      tone,
      contrastText === "white" ? "white-text" : "black-text",
      isTransparent ? "transparent" : "solid",
      color.token ? "tokenized" : "untokenized",
      color.subcategory ? color.subcategory : "",
      color.category,
    ].filter(Boolean),
  };
}

export function colorPinKey(
  color: Pick<
    ColorAsset,
    "name" | "category" | "subcategory" | "token" | "value"
  >,
): string {
  const token = color.token?.trim().toLowerCase() ?? "";
  const subcategory = color.subcategory?.trim().toLowerCase() ?? "";

  return [
    color.category.trim().toLowerCase(),
    subcategory,
    color.name.trim().toLowerCase(),
    token,
    colorValueToCss(color.value).trim().toLowerCase(),
  ].join("|");
}

export function colorCategoryPath(
  color: Pick<ColorAsset, "category" | "subcategory">,
): string {
  return color.subcategory
    ? `${color.category} / ${color.subcategory}`
    : color.category;
}

function normalizeHex(hex: string): string {
  if (hex.length === 3) {
    return `#${hex
      .split("")
      .map((character) => `${character}${character}`)
      .join("")}`.toUpperCase();
  }

  if (hex.length === 8) {
    const rgba = hexToRgba(`#${hex}`);
    if (rgba && rgba.a === 1) {
      return rgbToHex(rgba.r, rgba.g, rgba.b);
    }
  }

  return `#${hex}`.toUpperCase();
}

function colorValueToCircleFillAttributes(value: ColorValue): string {
  if (value.kind === "hex") {
    const rgba = hexToRgba(value.hex);
    if (!rgba || rgba.a === 1) {
      return `fill="${value.hex}"`;
    }

    return `fill="${rgbToHex(rgba.r, rgba.g, rgba.b)}" fill-opacity="${trimAlpha(rgba.a)}"`;
  }

  if (value.a === 1) {
    return `fill="${rgbToHex(value.r, value.g, value.b)}"`;
  }

  return `fill="${rgbToHex(value.r, value.g, value.b)}" fill-opacity="${trimAlpha(value.a)}"`;
}

function isTransparentColorValue(value: ColorValue): boolean {
  if (value.kind === "hex") {
    const rgba = hexToRgba(value.hex);
    return rgba ? rgba.a < 1 : false;
  }

  return value.a < 1;
}

function hexToRgba(
  hex: string,
): { r: number; g: number; b: number; a: number } | undefined {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6 && normalized.length !== 8) {
    return undefined;
  }

  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  const a =
    normalized.length === 8
      ? Number.parseInt(normalized.slice(6, 8), 16) / 255
      : 1;

  return { r, g, b, a };
}

function toRgba(value: ColorValue): {
  r: number;
  g: number;
  b: number;
  a: number;
} {
  if (value.kind === "rgba") {
    return value;
  }

  return hexToRgba(value.hex) ?? { r: 0, g: 0, b: 0, a: 1 };
}

function rgbToHsl(
  r: number,
  g: number,
  b: number,
): { hue: number; saturation: number; lightness: number } {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const lightness = (max + min) / 2;

  if (max === min) {
    return { hue: 0, saturation: 0, lightness: Math.round(lightness * 100) };
  }

  const difference = max - min;
  const saturation =
    lightness > 0.5 ? difference / (2 - max - min) : difference / (max + min);

  let hue = 0;
  switch (max) {
    case red:
      hue = (green - blue) / difference + (green < blue ? 6 : 0);
      break;
    case green:
      hue = (blue - red) / difference + 2;
      break;
    default:
      hue = (red - green) / difference + 4;
      break;
  }

  return {
    hue: Math.round(hue * 60),
    saturation: Math.round(saturation * 100),
    lightness: Math.round(lightness * 100),
  };
}

function relativeLuminance(r: number, g: number, b: number): number {
  const channels = [r, g, b].map((value) => {
    const normalized = value / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });

  return Number(
    (
      0.2126 * channels[0] +
      0.7152 * channels[1] +
      0.0722 * channels[2]
    ).toFixed(3),
  );
}

function hueToFamily(
  hue: number,
  saturation: number,
  lightness: number,
): string {
  if (saturation < 10) {
    if (lightness < 12) {
      return "near-black";
    }

    if (lightness > 92) {
      return "near-white";
    }

    return "neutral";
  }

  if (hue < 15 || hue >= 345) {
    return "red";
  }

  if (hue < 45) {
    return "orange";
  }

  if (hue < 70) {
    return "yellow";
  }

  if (hue < 170) {
    return "green";
  }

  if (hue < 200) {
    return "cyan";
  }

  if (hue < 255) {
    return "blue";
  }

  if (hue < 300) {
    return "purple";
  }

  return "pink";
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((channel) => channel.toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

function trimAlpha(alpha: number): string {
  return Number(alpha.toFixed(3)).toString();
}
