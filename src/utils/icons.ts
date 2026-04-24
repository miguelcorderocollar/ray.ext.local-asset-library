import { IconAsset } from "../types";
import { demoIcons } from "./demo-assets";
import { assetCategoryPath } from "./local-assets";

type LocalIconResult = {
  icons: IconAsset[];
  rootFolder?: string;
  error?: string;
  diagnostics: string[];
};

export async function loadLocalIcons(): Promise<LocalIconResult> {
  return {
    icons: demoIcons(),
    diagnostics: ["Loaded built-in demo icons."],
  };
}

export function categoryOptions(icons: IconAsset[]): string[] {
  return Array.from(
    new Set(icons.flatMap((icon) => [icon.category, iconCategoryPath(icon)])),
  ).sort((a, b) => a.localeCompare(b));
}

export function iconCategoryPath(
  icon: Pick<IconAsset, "category" | "subcategory">,
): string {
  return assetCategoryPath(icon);
}

export function iconPinKey(icon: Pick<IconAsset, "id" | "filePath">): string {
  return icon.filePath ?? icon.id;
}
