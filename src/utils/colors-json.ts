import { showToast, Toast } from "@raycast/api";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { ColorAsset } from "../types";
import {
  COLORS_FILE_NAME,
  parseColorsJson,
  sampleColorsJson,
  serializeColorsJson,
} from "../features/colors/json";
import { getLibraryFolder } from "./local-assets";

type ColorsResult = {
  colors: ColorAsset[];
  colorsFilePath?: string;
  rootFolder?: string;
  errors: string[];
};

export async function loadColorsJson(): Promise<ColorsResult> {
  const rootFolder = getLibraryFolder();
  if (!rootFolder) {
    return { colors: [], errors: [] };
  }

  const colorsFilePath = getColorsFilePath(rootFolder);
  try {
    await access(colorsFilePath);
  } catch {
    return {
      colors: [],
      colorsFilePath,
      rootFolder,
      errors: [`${COLORS_FILE_NAME}: file is missing in the library folder.`],
    };
  }

  try {
    const rawJson = await readFile(colorsFilePath, "utf8");
    const result = parseColorsJson(rawJson);
    if (result.errors.length > 0) {
      void showToast({
        style: Toast.Style.Failure,
        title: "Invalid colors.json",
        message: result.errors[0],
      });
    }

    return { ...result, colorsFilePath, rootFolder };
  } catch (error) {
    return {
      colors: [],
      colorsFilePath,
      rootFolder,
      errors: [
        `${COLORS_FILE_NAME}: ${error instanceof Error ? error.message : "Could not read file."}`,
      ],
    };
  }
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
