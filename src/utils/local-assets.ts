import { getPreferenceValues } from "@raycast/api";
import { basename, parse, relative } from "node:path";

export function getLibraryFolder(): string | undefined {
  return getPreferenceValues<ExtensionPreferences>().assetRootFolder;
}

export function assetCategoryPath(
  asset: Pick<
    { category: string; subcategory?: string },
    "category" | "subcategory"
  >,
): string {
  return asset.subcategory
    ? `${asset.category} / ${asset.subcategory}`
    : asset.category;
}

export function pathAssetInfo(
  rootFolder: string,
  filePath: string,
): {
  relativePath: string;
  fileName: string;
  fileStem: string;
  category: string;
  subcategory?: string;
} {
  const relativePath = relative(rootFolder, filePath);
  const segments = relativePath.split("/").filter(Boolean);
  const fileName = segments.at(-1) ?? basename(filePath);

  return {
    relativePath,
    fileName,
    fileStem: parse(fileName).name,
    category: segments.length > 1 ? humanizeName(segments[0]) : "Local",
    subcategory:
      segments.length > 2
        ? segments.slice(1, -1).map(humanizeName).join(" / ")
        : undefined,
  };
}

export function humanizeName(value: string): string {
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}
