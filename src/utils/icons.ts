import { showToast, Toast } from "@raycast/api";
import { createHash } from "node:crypto";
import { access, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, extname, join, parse, relative } from "node:path";

import { addSvgColorFallback } from "../features/icons/svg";
import { IconAsset } from "../types";
import {
  assetCategoryPath,
  getLibraryFolder,
  humanizeName,
  pathAssetInfo,
} from "./local-assets";

const SUPPORTED_IMAGE_EXTENSIONS = new Set([
  ".svg",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".avif",
  ".bmp",
  ".tif",
  ".tiff",
  ".ico",
  ".icns",
]);

type LocalIconResult = {
  icons: IconAsset[];
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
};

const SVG_CLIPBOARD_CACHE_DIR = join(
  tmpdir(),
  "raycast-local-asset-library",
  "svg-clipboard",
);

export async function loadLocalIcons(): Promise<LocalIconResult> {
  const rootFolder = getLibraryFolder();
  if (!rootFolder) {
    return { icons: [], diagnostics: ["No Library Folder configured."] };
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
    return { icons: [], rootFolder, error, diagnostics };
  }

  let icons: IconAsset[] = [];
  try {
    icons = await readImageFiles(rootFolder, rootFolder, metrics);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown icon scan failure.";
    diagnostics.push(`Scan failed: ${message}`);
    console.log(`[Local Asset Library] Scan failed`, error);
    await showToast({
      style: Toast.Style.Failure,
      title: "Icon scan failed",
      message,
    });
    return {
      icons: [],
      rootFolder,
      error: message,
      diagnostics,
    };
  }

  diagnostics.push(...formatMetrics(metrics, icons.length));
  for (const diagnostic of diagnostics) {
    console.log(`[Local Asset Library] ${diagnostic}`);
  }

  return {
    icons: icons.sort(
      (a, b) =>
        a.category.localeCompare(b.category) ||
        (a.subcategory ?? "").localeCompare(b.subcategory ?? "") ||
        a.name.localeCompare(b.name),
    ),
    rootFolder,
    error:
      metrics.unreadableFolders.length > 0
        ? metrics.unreadableFolders[0]
        : undefined,
    diagnostics,
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

async function readImageFiles(
  rootFolder: string,
  folderPath: string,
  metrics: ScanMetrics,
): Promise<IconAsset[]> {
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

  const nestedIcons: IconAsset[] = [];
  for (const entry of entries.filter((entry) => entry.isDirectory())) {
    if (entry.name.startsWith(".")) {
      continue;
    }

    nestedIcons.push(
      ...(await readImageFiles(
        rootFolder,
        join(folderPath, entry.name),
        metrics,
      )),
    );
  }

  const fileIcons = await Promise.all(
    entries
      .filter((entry) => entry.isFile())
      .map(async (entry) => {
        metrics.files += 1;
        if (!isSupportedImage(entry.name)) {
          metrics.skippedFiles += 1;
          return undefined;
        }

        metrics.supportedFiles += 1;
        try {
          return await readImageAsset(
            rootFolder,
            join(folderPath, entry.name),
          );
        } catch (error) {
          const message = `${relative(rootFolder, join(folderPath, entry.name))}: ${
            error instanceof Error ? error.message : "Could not read file"
          }`;
          metrics.unreadableFiles.push(message);
          console.log(
            `[Local Asset Library] Skipping unreadable file: ${message}`,
          );
          return undefined;
        }
      }),
  );

  return [
    ...fileIcons.filter((icon): icon is IconAsset => Boolean(icon)),
    ...nestedIcons,
  ];
}

async function readImageAsset(
  rootFolder: string,
  filePath: string,
): Promise<IconAsset> {
  const info = pathAssetInfo(rootFolder, filePath);
  const fileName = info.fileName;
  const extension = extname(fileName).toLowerCase();
  const isSvg = extension === ".svg";
  const svgMarkup = isSvg ? await readFile(filePath, "utf8") : undefined;
  const name = humanizeName(parse(fileName).name);
  const defaultCopyValue = await buildDefaultCopyValue(filePath, svgMarkup);

  return {
    id: filePath,
    name,
    category: info.category,
    subcategory: info.subcategory,
    source: "local",
    defaultCopyValue,
    copyLabel: "Copy Image File",
    keywords: [
      name,
      parse(fileName).name,
      info.category,
      info.subcategory ?? "",
      basename(filePath),
      extension.replace(".", ""),
    ],
    filePath,
    svgMarkup,
  };
}

async function buildDefaultCopyValue(
  filePath: string,
  svgMarkup?: string,
): Promise<{ file: string }> {
  if (!svgMarkup) {
    return { file: filePath };
  }

  const normalizedMarkup = addSvgColorFallback(svgMarkup);
  if (normalizedMarkup === svgMarkup) {
    return { file: filePath };
  }

  await mkdir(SVG_CLIPBOARD_CACHE_DIR, { recursive: true });
  const fileHash = createHash("sha1")
    .update(filePath)
    .update("\0")
    .update(normalizedMarkup)
    .digest("hex")
    .slice(0, 12);
  const cachedFilePath = join(
    SVG_CLIPBOARD_CACHE_DIR,
    `${parse(filePath).name}-${fileHash}.svg`,
  );

  await writeFile(cachedFilePath, normalizedMarkup, "utf8");
  return { file: cachedFilePath };
}

function isSupportedImage(fileName: string): boolean {
  return SUPPORTED_IMAGE_EXTENSIONS.has(extname(fileName).toLowerCase());
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
  };
}

function formatMetrics(metrics: ScanMetrics, iconCount: number): string[] {
  const durationMs = Date.now() - metrics.startedAt;
  const diagnostics = [
    `Scan completed in ${durationMs}ms.`,
    `Folders scanned: ${metrics.folders}.`,
    `Files seen: ${metrics.files}.`,
    `Supported image files: ${metrics.supportedFiles}.`,
    `Assets indexed: ${iconCount}.`,
    `Unsupported files skipped: ${metrics.skippedFiles}.`,
  ];

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
