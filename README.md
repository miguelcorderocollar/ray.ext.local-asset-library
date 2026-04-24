# Local Asset Library

Raycast extension for browsing local colors, icons, images, and fonts from one library folder.

## Setup In Raycast

1. Open Raycast Settings and go to the extension preferences for `Local Asset Library`.
2. Set **Library Folder** to the folder that contains your `colors.json` file and any local asset folders.
3. Launch `Browse Colors`, `Browse Icons & Images`, or `Browse Fonts` depending on the asset type you want to inspect.
4. For Colors, open the command preferences if you want to choose whether the command opens in `Grid` or `List` view by default.

## Library Structure

Set the Raycast preference **Library Folder** to a folder with this shape:

```text
Local Asset Library/
├── colors.json
├── Fonts/
│   ├── Sans/
│   │   ├── Inter-Regular.ttf
│   │   └── Inter-Bold.ttf
│   └── Display/
│       └── AcmeVariable.ttf
├── Icons/
│   ├── Functional/
│   │   ├── copy.svg
│   │   └── download.svg
│   └── Social/
│       └── youtube.svg
└── Images/
    ├── Logos/
    │   └── primary-logo.png
    └── Products/
        └── can.webp
```

Folder rules for the asset browser commands:

- Files directly in the root are shown under `Local`.
- The first folder level is the category, for example `Icons`.
- Deeper folder levels become subcategories, for example `Functional` or `Logos / Primary`.
- Supported files: `svg`, `png`, `jpg`, `jpeg`, `gif`, `webp`, `avif`, `bmp`, `tif`, `tiff`, `ico`, `icns`.
- Supported font files: `ttf`, `otf`, `ttc`, `dfont`, `woff`, `woff2`.

## colors.json

The **Browse Colors** command reads and writes `colors.json` in the same library folder.

```json
{
  "colors": [
    {
      "name": "Primary",
      "category": "Brand",
      "subcategory": "Core",
      "value": "#1B6AEE",
      "token": "--color-primary"
    },
    {
      "name": "Overlay Dark 40",
      "category": "Effects",
      "subcategory": "Glass",
      "value": "rgba(0, 15, 30, 0.4)",
      "token": "--color-overlay-dark-40"
    }
  ]
}
```

Required fields per color:

- `name`: non-empty string.
- `category`: non-empty string.
- `value`: HEX, RGB, or RGBA.

Optional fields:

- `subcategory`: string.
- `token`: string.

If validation fails, the Colors command shows the exact JSON path, such as `colors.json.colors[2].value`, or line and column for JSON syntax errors.

## Command Highlights

- Open a dedicated details page for each color to inspect copy-ready values and computed metadata such as color family, tone, opacity, HSL, luminance, and recommended text contrast.
- Choose whether Colors opens in a visual swatch grid or a metadata-rich list with a toggleable detail panel.
- Search by more than just the visible label. The grid now indexes category path, token, CSS value, HEX, RGB/RGBA, opacity, transparency, tone, and color family keywords.
- Pin colors or local images in Raycast. Pinned items move into a virtual `Pinned` section at the top and remain separate from `colors.json`.
- Use the top-right filter to quickly focus on pinned colors, tokenized colors, transparent colors, solid colors, or light and dark tones.
- Browse local icon and image folders in a visual grid, then copy SVG markup, file paths, or image assets directly from Raycast.
- Browse local fonts by family, inspect face metadata, search by PostScript name or foundry, and preview font files with Quick Look.

## Troubleshooting

- If the commands show an empty state, confirm that **Library Folder** points to the intended directory.
- If colors fail to load, validate that `colors.json` exists at the root and follows the schema shown above.
- If icons, images, or fonts are missing, confirm the files use supported formats and live somewhere under the configured library folder.

## Development

- Run `npm run lint` to validate the Raycast extension entrypoints and config.
- Run `npm test` to execute the Vitest suite for the extracted parsing, grouping, and filtering modules under `src/features/`.
