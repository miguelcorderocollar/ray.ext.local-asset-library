import { FontFamilyAsset } from "../types";
import { demoFonts } from "./demo-assets";
import { assetCategoryPath } from "./local-assets";

type LocalFontResult = {
  families: FontFamilyAsset[];
  rootFolder?: string;
  error?: string;
  diagnostics: string[];
};

export async function loadLocalFonts(): Promise<LocalFontResult> {
  return {
    families: demoFonts(),
    diagnostics: ["Loaded built-in demo fonts."],
  };
}

export function fontCategoryPath(
  font: Pick<FontFamilyAsset, "category" | "subcategory">,
): string {
  return assetCategoryPath(font);
}
