/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** Library Folder - Folder containing colors.json plus local icon, image, and font folders. Top-level folders become categories; nested folders become subcategories. */
  "assetRootFolder"?: string
}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `colors` command */
  export type Colors = ExtensionPreferences & {
  /** Default View - Choose whether colors open in grid view or list view by default. */
  "colorDefaultView": "grid" | "list",
  /** Grid Size - Controls how many swatches appear per row in the Colors grid view. */
  "colorGridColumns": "8" | "6" | "4"
}
  /** Preferences accessible in the `icons` command */
  export type Icons = ExtensionPreferences & {
  /** Grid Size - Controls how many tiles appear per row in the Icons & Images grid view. */
  "assetGridColumns": "8" | "6" | "4"
}
  /** Preferences accessible in the `fonts` command */
  export type Fonts = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `colors` command */
  export type Colors = {}
  /** Arguments passed to the `icons` command */
  export type Icons = {}
  /** Arguments passed to the `fonts` command */
  export type Fonts = {}
}

