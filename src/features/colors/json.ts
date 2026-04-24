import { ColorAsset, ColorsJsonFile, CustomColorInput } from "../../types";
import { buildCustomColor, colorValueToCss } from "../../utils/color";

export const COLORS_FILE_NAME = "colors.json";

export type ParsedColorsJsonResult = {
  colors: ColorAsset[];
  errors: string[];
};

export function parseColorsJson(rawJson: string): ParsedColorsJsonResult {
  const errors: string[] = [];
  let parsed: unknown;

  try {
    parsed = JSON.parse(rawJson) as unknown;
  } catch (error) {
    const location = parseJsonErrorLocation(rawJson, error);
    return {
      colors: [],
      errors: [
        `${COLORS_FILE_NAME}${location}: invalid JSON - ${error instanceof Error ? error.message : "parse failed"}.`,
      ],
    };
  }

  if (!isRecord(parsed)) {
    return {
      colors: [],
      errors: [
        `${COLORS_FILE_NAME}: expected an object with a "colors" array.`,
      ],
    };
  }

  if (!Array.isArray(parsed.colors)) {
    return {
      colors: [],
      errors: [`${COLORS_FILE_NAME}.colors: expected an array.`],
    };
  }

  const colors: ColorAsset[] = [];
  const duplicateCounts = new Map<string, number>();

  parsed.colors.forEach((entry, index) => {
    const path = `${COLORS_FILE_NAME}.colors[${index}]`;
    const colorInput = validateColorEntry(entry, path, errors);
    if (!colorInput) {
      return;
    }

    try {
      const identityKey = colorIdentityKey(colorInput);
      const duplicateIndex = duplicateCounts.get(identityKey) ?? 0;
      duplicateCounts.set(identityKey, duplicateIndex + 1);
      colors.push(
        buildCustomColor(colorInput, stableColorId(colorInput, duplicateIndex)),
      );
    } catch (error) {
      errors.push(
        `${path}.value: ${error instanceof Error ? error.message : "Invalid color value."}`,
      );
    }
  });

  return { colors, errors };
}

export function serializeColorsJson(colors: ColorAsset[]): string {
  const file: ColorsJsonFile = {
    colors: colors.map((color) => ({
      name: color.name,
      category: color.category,
      subcategory: color.subcategory,
      value: colorValueToCss(color.value),
      token: color.token,
    })),
  };

  return `${JSON.stringify(file, null, 2)}\n`;
}

export function sampleColorsJson(): ColorsJsonFile {
  return {
    colors: [
      {
        name: "Primary",
        category: "Brand",
        subcategory: "Core",
        value: "#1B6AEE",
        token: "--color-primary",
      },
      {
        name: "Primary Dark",
        category: "Brand",
        subcategory: "Core",
        value: "#00162B",
        token: "--color-primary-dark",
      },
      {
        name: "Negative",
        category: "Semantic",
        subcategory: "Status",
        value: "#DB0A40",
        token: "--color-negative",
      },
      {
        name: "Overlay Dark 40",
        category: "Effects",
        subcategory: "Glass",
        value: "rgba(0, 15, 30, 0.4)",
        token: "--color-overlay-dark-40",
      },
    ],
  };
}

function validateColorEntry(
  entry: unknown,
  path: string,
  errors: string[],
): CustomColorInput | undefined {
  if (!isRecord(entry)) {
    errors.push(`${path}: expected an object.`);
    return undefined;
  }

  const name = readRequiredString(entry, "name", `${path}.name`, errors);
  const category = readRequiredString(
    entry,
    "category",
    `${path}.category`,
    errors,
  );
  const value = readRequiredString(entry, "value", `${path}.value`, errors);
  const subcategory = readOptionalString(
    entry,
    "subcategory",
    `${path}.subcategory`,
    errors,
  );
  const token = readOptionalString(entry, "token", `${path}.token`, errors);

  if (!name || !category || !value) {
    return undefined;
  }

  return { name, category, subcategory, value, token };
}

function readRequiredString(
  record: Record<string, unknown>,
  key: string,
  path: string,
  errors: string[],
): string | undefined {
  const value = record[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    errors.push(`${path}: expected a non-empty string.`);
    return undefined;
  }

  return value;
}

function readOptionalString(
  record: Record<string, unknown>,
  key: string,
  path: string,
  errors: string[],
): string | undefined {
  const value = record[key];
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value !== "string") {
    errors.push(`${path}: expected a string when provided.`);
    return undefined;
  }

  return value;
}

function stableColorId(input: CustomColorInput, index: number): string {
  const baseId = [
    "json",
    input.category,
    input.subcategory ?? "",
    input.name,
    input.token ?? "",
    input.value,
  ]
    .join("-")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return index === 0 ? baseId : `${baseId}-${index + 1}`;
}

function colorIdentityKey(input: CustomColorInput): string {
  return [
    input.category.trim().toLowerCase(),
    input.subcategory?.trim().toLowerCase() ?? "",
    input.name.trim().toLowerCase(),
    input.token?.trim().toLowerCase() ?? "",
    input.value.trim().toLowerCase(),
  ].join("|");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseJsonErrorLocation(rawJson: string, error: unknown): string {
  if (!(error instanceof SyntaxError)) {
    return "";
  }

  const positionMatch = error.message.match(/position (\d+)/);
  if (!positionMatch) {
    return "";
  }

  const position = Number(positionMatch[1]);
  const beforeError = rawJson.slice(0, position);
  const lines = beforeError.split("\n");
  const line = lines.length;
  const column = (lines.at(-1)?.length ?? 0) + 1;

  return `:${line}:${column}`;
}
