import { access, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { ColorAsset } from "../types";
import {
  COLORS_FILE_NAME,
  sampleColorsJson,
  serializeColorsJson,
} from "../features/colors/json";
import { demoColors } from "./demo-assets";
import { getLibraryFolder } from "./local-assets";

type ColorsResult = {
  colors: ColorAsset[];
  colorsFilePath?: string;
  rootFolder?: string;
  errors: string[];
};

export async function loadColorsJson(): Promise<ColorsResult> {
  return {
    colors: demoColors(),
    errors: [],
  };
}

export async function saveColorsJson(colors: ColorAsset[]): Promise<string> {
  const rootFolder = getLibraryFolder();
  if (!rootFolder) {
    throw new Error("Set the Library Folder preference before editing colors.");
  }

  await mkdir(rootFolder, { recursive: true });
  const colorsFilePath = getColorsFilePath(rootFolder);
  await writeFile(colorsFilePath, serializeColorsJson(colors), "utf8");
  return colorsFilePath;
}

export async function ensureSampleColorsJson(
  rootFolder: string,
): Promise<void> {
  await mkdir(rootFolder, { recursive: true });
  const colorsFilePath = getColorsFilePath(rootFolder);
  try {
    await access(colorsFilePath);
    return;
  } catch {
    await writeFile(
      colorsFilePath,
      `${JSON.stringify(sampleColorsJson(), null, 2)}\n`,
      "utf8",
    );
  }
}

export function getColorsFilePath(rootFolder: string): string {
  return join(rootFolder, COLORS_FILE_NAME);
}
