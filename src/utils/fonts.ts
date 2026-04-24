import { access, readdir, stat } from "node:fs/promises";
import { extname, join, parse, relative } from "node:path";

import { showToast, Toast } from "@raycast/api";
import * as fontkit from "fontkit";
import type { Font, FontCollection } from "fontkit";

import { FontFaceAsset, FontFamilyAsset } from "../types";
import {
  assetCategoryPath,
  getLibraryFolder,
  pathAssetInfo,
} from "./local-assets";

const SUPPORTED_FONT_EXTENSIONS = new Set([
  ".ttf",
  ".otf",
  ".ttc",
  ".dfont",
  ".woff",
  ".woff2",
]);

type LocalFontResult = {
  families: FontFamilyAsset[];
  rootFolder?: string;
  error?: string;
  diagnostics: string[];
};

type ScanMetrics = {
  startedAt: number;
  folders: number;
  files: number;
  supportedFiles: number;
  skippedFiles: number;
  unreadableFolders: string[];
  unreadableFiles: string[];
  parsedFaces: number;
  parsedFamilies: number;
  fallbackFaces: number;
};

export async function loadLocalFonts(): Promise<LocalFontResult> {
  const rootFolder = getLibraryFolder();
  if (!rootFolder) {
    return { families: [], diagnostics: ["No Library Folder configured."] };
  }

  const metrics = createMetrics();
  const diagnostics = [`Scanning library folder: ${rootFolder}`];
  console.log(`[Local Asset Library] ${diagnostics[0]}`);

  try {
    await access(rootFolder);
  } catch {
    const error =
      "The configured library folder does not exist or cannot be read.";
    await showToast({
      style: Toast.Style.Failure,
      title: "Cannot read library folder",
      message: rootFolder,
    });
    diagnostics.push(error);
    console.log(`[Local Asset Library] ${error}`);
    return { families: [], rootFolder, error, diagnostics };
  }

  let faces: FontFaceAsset[] = [];
  try {
    faces = await readFontFiles(rootFolder, rootFolder, metrics);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown font scan failure.";
    diagnostics.push(`Scan failed: ${message}`);
    console.log(`[Local Asset Library] Font scan failed`, error);
    await showToast({
      style: Toast.Style.Failure,
      title: "Font scan failed",
      message,
    });
    return {
      families: [],
      rootFolder,
      error: message,
      diagnostics,
    };
  }

  const families = groupFontFamilies(faces);
  metrics.parsedFaces = faces.length;
  metrics.parsedFamilies = families.length;
  diagnostics.push(...formatMetrics(metrics));

  for (const diagnostic of diagnostics) {
    console.log(`[Local Asset Library] ${diagnostic}`);
  }

  return {
    families,
    rootFolder,
    error:
      metrics.unreadableFolders[0] ?? metrics.unreadableFiles[0] ?? undefined,
    diagnostics,
  };
}

export function fontCategoryPath(
  font: Pick<FontFamilyAsset, "category" | "subcategory">,
): string {
  return assetCategoryPath(font);
}

async function readFontFiles(
  rootFolder: string,
  folderPath: string,
  metrics: ScanMetrics,
): Promise<FontFaceAsset[]> {
  metrics.folders += 1;

  let entries;
  try {
    entries = await readdir(folderPath, { withFileTypes: true });
  } catch (error) {
    const message = `${relative(rootFolder, folderPath) || "."}: ${
      error instanceof Error ? error.message : "Could not read folder"
    }`;
    metrics.unreadableFolders.push(message);
    console.log(`[Local Asset Library] Skipping unreadable folder: ${message}`);
    return [];
  }

  const nestedFonts: FontFaceAsset[] = [];
  for (const entry of entries) {
    if (entry.name.startsWith(".")) {
      continue;
    }

    const entryPath = join(folderPath, entry.name);
    if (entry.isDirectory()) {
      nestedFonts.push(
        ...(await readFontFiles(rootFolder, entryPath, metrics)),
      );
      continue;
    }

    if (!entry.isSymbolicLink()) {
      continue;
    }

    try {
      const entryStats = await stat(entryPath);
      if (entryStats.isDirectory()) {
        nestedFonts.push(
          ...(await readFontFiles(rootFolder, entryPath, metrics)),
        );
      }
    } catch (error) {
      const message = `${relative(rootFolder, entryPath)}: ${
        error instanceof Error
          ? error.message
          : "Could not resolve symbolic link"
      }`;
      metrics.unreadableFolders.push(message);
      console.log(
        `[Local Asset Library] Skipping unreadable symbolic link: ${message}`,
      );
    }
  }

  const fontFaces = await Promise.all(
    entries.map(async (entry) => {
      if (entry.name.startsWith(".")) {
        return [];
      }

      const filePath = join(folderPath, entry.name);
      const fileStats = entry.isSymbolicLink()
        ? await stat(filePath).catch(() => undefined)
        : undefined;
      const isFileEntry = entry.isFile() || fileStats?.isFile();
      if (!isFileEntry) {
        return [];
      }

      metrics.files += 1;
      if (!isSupportedFont(entry.name)) {
        metrics.skippedFiles += 1;
        return [];
      }

      metrics.supportedFiles += 1;
      try {
        return readFontAsset(rootFolder, filePath);
      } catch (error) {
        const message = `${relative(rootFolder, filePath)}: ${
          error instanceof Error
            ? error.message
            : "Could not read font metadata"
        }`;
        metrics.fallbackFaces += 1;
        console.log(
          `[Local Asset Library] Falling back to filename metadata: ${message}`,
        );
        try {
          return [buildFallbackFontFaceAsset(rootFolder, filePath)];
        } catch (fallbackError) {
          const fallbackMessage = `${relative(rootFolder, filePath)}: ${
            fallbackError instanceof Error
              ? fallbackError.message
              : "Could not read font file"
          }`;
          metrics.unreadableFiles.push(fallbackMessage);
          console.log(
            `[Local Asset Library] Skipping unreadable font: ${fallbackMessage}`,
          );
          return [];
        }
      }
    }),
  );

  return [...fontFaces.flat(), ...nestedFonts];
}

function readFontAsset(rootFolder: string, filePath: string): FontFaceAsset[] {
  const opened = fontkit.openSync(filePath);
  const info = pathAssetInfo(rootFolder, filePath);
  const extension = extname(filePath).toLowerCase();
  const collection = isFontCollection(opened);
  const fonts = collection ? opened.fonts : [opened];

  return fonts.map((font, index) =>
    buildFontFaceAsset(font, {
      category: info.category,
      subcategory: info.subcategory,
      fileName: info.fileName,
      filePath,
      fileStem: info.fileStem,
      format: formatLabel(extension, font, collection),
      index,
      isCollection: collection,
      relativePath: info.relativePath,
    }),
  );
}

function buildFallbackFontFaceAsset(
  rootFolder: string,
  filePath: string,
): FontFaceAsset {
  const info = pathAssetInfo(rootFolder, filePath);
  const extension = extname(filePath).toLowerCase();
  const fileStem = humanizeFontStem(parse(info.fileName).name);

  return {
    id: `${filePath}#fallback`,
    familyName: fileStem,
    styleName: "Regular",
    fullName: fileStem,
    category: info.category,
    subcategory: info.subcategory,
    source: "local",
    fileName: info.fileName,
    filePath,
    faceIndex: 0,
    format: fallbackFormatLabel(extension),
    isVariable: false,
    isColor: false,
    isCollection: extension === ".ttc" || extension === ".dfont",
    keywords: [
      fileStem,
      info.fileName,
      info.relativePath,
      info.category,
      info.subcategory ?? "",
      extension.replace(".", ""),
    ].filter(Boolean),
  };
}

function buildFontFaceAsset(
  font: Font,
  context: {
    category: string;
    subcategory?: string;
    fileName: string;
    filePath: string;
    fileStem: string;
    format: string;
    index: number;
    isCollection: boolean;
    relativePath: string;
  },
): FontFaceAsset {
  const familyName = normalizeFontName(font.familyName) || context.fileStem;
  const styleName = normalizeFontName(font.subfamilyName) || "Regular";
  const fullName =
    normalizeFontName(font.fullName) || `${familyName} ${styleName}`.trim();
  const postscriptName = normalizeFontName(font.postscriptName);
  const foundry = normalizeFontName(font["OS/2"]?.vendorID);
  const weight = font["OS/2"]?.usWeightClass;
  const width = font["OS/2"]?.usWidthClass;
  const isVariable = Object.keys(font.variationAxes ?? {}).length > 0;
  const isColor = Boolean(font.COLR || font.CPAL);

  return {
    id: `${context.filePath}#${postscriptName ?? fullName}#${context.index}`,
    familyName,
    styleName,
    fullName,
    postscriptName,
    category: context.category,
    subcategory: context.subcategory,
    source: "local",
    fileName: context.fileName,
    filePath: context.filePath,
    faceIndex: context.index,
    format: context.format,
    foundry,
    weight,
    width,
    isVariable,
    isColor,
    isCollection: context.isCollection,
    keywords: [
      familyName,
      styleName,
      fullName,
      postscriptName ?? "",
      context.format,
      context.fileName,
      context.relativePath,
      context.category,
      context.subcategory ?? "",
      foundry ?? "",
      weight ? `weight ${weight}` : "",
      width ? `width ${width}` : "",
      isVariable ? "variable font" : "",
      isColor ? "color font" : "",
      context.isCollection ? "collection ttc dfont" : "",
    ].filter(Boolean),
  };
}

function isSupportedFont(fileName: string): boolean {
  return SUPPORTED_FONT_EXTENSIONS.has(extname(fileName).toLowerCase());
}

function isFontCollection(font: Font | FontCollection): font is FontCollection {
  return "fonts" in font;
}

function formatLabel(
  extension: string,
  font: Font,
  isCollection: boolean,
): string {
  if (isCollection) {
    return extension === ".dfont" ? "DFONT" : "TTC";
  }

  switch (extension) {
    case ".otf":
      return "OTF";
    case ".ttf":
      return "TTF";
    case ".woff":
      return "WOFF";
    case ".woff2":
      return "WOFF2";
    default:
      return font.type;
  }
}

function groupFontFamilies(faces: FontFaceAsset[]): FontFamilyAsset[] {
  const grouped = new Map<string, FontFaceAsset[]>();

  for (const face of sortFontFaces(faces)) {
    const key = `${assetCategoryPath(face)}|${face.familyName.toLowerCase()}`;
    grouped.set(key, [...(grouped.get(key) ?? []), face]);
  }

  return Array.from(grouped.values())
    .map((familyFaces) => buildFontFamilyAsset(familyFaces))
    .sort(
      (left, right) =>
        fontCategoryPath(left).localeCompare(fontCategoryPath(right)) ||
        left.familyName.localeCompare(right.familyName),
    );
}

function buildFontFamilyAsset(faces: FontFaceAsset[]): FontFamilyAsset {
  const [firstFace] = faces;
  const formats = uniqueValues(faces.map((face) => face.format));
  const foundries = uniqueValues(
    faces.map((face) => face.foundry).filter(Boolean) as string[],
  );
  const filePaths = uniqueValues(faces.map((face) => face.filePath));
  const styleNames = uniqueValues(faces.map((face) => face.styleName));

  return {
    id: `${assetCategoryPath(firstFace)}|${firstFace.familyName.toLowerCase()}`,
    familyName: firstFace.familyName,
    category: firstFace.category,
    subcategory: firstFace.subcategory,
    source: "local",
    faces,
    faceCount: faces.length,
    styleCount: styleNames.length,
    formats,
    foundries,
    filePaths,
    primaryFilePath: firstFace.filePath,
    isVariable: faces.some((face) => face.isVariable),
    isColor: faces.some((face) => face.isColor),
    isCollection: faces.some((face) => face.isCollection),
    keywords: uniqueValues([
      firstFace.familyName,
      ...formats,
      ...foundries,
      ...faces.flatMap((face) => face.keywords),
    ]),
  };
}

function sortFontFaces(faces: FontFaceAsset[]): FontFaceAsset[] {
  return [...faces].sort((left, right) => {
    const leftWeight = left.weight ?? Number.MAX_SAFE_INTEGER;
    const rightWeight = right.weight ?? Number.MAX_SAFE_INTEGER;

    return (
      left.category.localeCompare(right.category) ||
      (left.subcategory ?? "").localeCompare(right.subcategory ?? "") ||
      left.familyName.localeCompare(right.familyName) ||
      leftWeight - rightWeight ||
      left.styleName.localeCompare(right.styleName) ||
      left.fullName.localeCompare(right.fullName)
    );
  });
}

function createMetrics(): ScanMetrics {
  return {
    startedAt: Date.now(),
    folders: 0,
    files: 0,
    supportedFiles: 0,
    skippedFiles: 0,
    unreadableFolders: [],
    unreadableFiles: [],
    parsedFaces: 0,
    parsedFamilies: 0,
    fallbackFaces: 0,
  };
}

function formatMetrics(metrics: ScanMetrics): string[] {
  const durationMs = Date.now() - metrics.startedAt;
  const diagnostics = [
    `Scan completed in ${durationMs}ms.`,
    `Folders scanned: ${metrics.folders}.`,
    `Files seen: ${metrics.files}.`,
    `Supported font files: ${metrics.supportedFiles}.`,
    `Font faces indexed: ${metrics.parsedFaces}.`,
    `Font families indexed: ${metrics.parsedFamilies}.`,
    `Unsupported files skipped: ${metrics.skippedFiles}.`,
  ];

  if (metrics.fallbackFaces > 0) {
    diagnostics.push(
      `Fonts using filename fallback metadata: ${metrics.fallbackFaces}.`,
    );
  }

  if (metrics.unreadableFolders.length > 0) {
    diagnostics.push(
      `Unreadable folders: ${metrics.unreadableFolders.length}.`,
    );
    diagnostics.push(...metrics.unreadableFolders.slice(0, 5));
  }

  if (metrics.unreadableFiles.length > 0) {
    diagnostics.push(`Unreadable files: ${metrics.unreadableFiles.length}.`);
    diagnostics.push(...metrics.unreadableFiles.slice(0, 5));
  }

  return diagnostics;
}

function normalizeFontName(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function humanizeFontStem(value: string): string {
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function fallbackFormatLabel(extension: string): string {
  switch (extension) {
    case ".ttf":
      return "TTF";
    case ".otf":
      return "OTF";
    case ".ttc":
      return "TTC";
    case ".dfont":
      return "DFONT";
    case ".woff":
      return "WOFF";
    case ".woff2":
      return "WOFF2";
    default:
      return extension.replace(".", "").toUpperCase() || "FONT";
  }
}

function uniqueValues(values: string[]): string[] {
  return Array.from(new Set(values)).sort((left, right) =>
    left.localeCompare(right),
  );
}
