import {
  ColorAsset,
  ColorValue,
  FontFaceAsset,
  FontFamilyAsset,
  IconAsset,
} from "../types";

const LOGO = {
  midnight: "#071A2D",
  deepBlue: "#0E3053",
  cobalt: "#2666E8",
  magenta: "#E3134B",
  orange: "#FF9800",
  amber: "#FFBF3C",
  mist: "#EFF4FB",
  cloud: "#D8E3F1",
  slate: "#7C8FA6",
  ink: "#122033",
} as const;

type DemoColorSpec = {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  value: ColorValue;
  token?: string;
};

type DemoIconSpec = {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  background?: string;
  motif:
    | "logo"
    | "offset"
    | "window"
    | "stack"
    | "stairs"
    | "bridge"
    | "beacon"
    | "ribbon"
    | "portal"
    | "columns"
    | "frame"
    | "split"
    | "ladder"
    | "panel"
    | "pulse"
    | "blocks";
  keywords: string[];
};

type DemoFaceInput = {
  id: string;
  familyName: string;
  styleName: string;
  fullName: string;
  postscriptName?: string;
  category: string;
  subcategory?: string;
  fileName: string;
  format: string;
  foundry?: string;
  weight?: number;
  width?: number;
  isVariable?: boolean;
  isColor?: boolean;
  isCollection?: boolean;
  keywords?: string[];
};

const demoColorSpecs: DemoColorSpec[] = [
  {
    id: "demo-color-midnight-stage",
    name: "Midnight Stage",
    category: "Brand",
    subcategory: "Canvas",
    value: hex(LOGO.midnight),
    token: "--demo-midnight-stage",
  },
  {
    id: "demo-color-deep-current",
    name: "Deep Current",
    category: "Brand",
    subcategory: "Canvas",
    value: hex(LOGO.deepBlue),
    token: "--demo-deep-current",
  },
  {
    id: "demo-color-signal-magenta",
    name: "Signal Magenta",
    category: "Brand",
    subcategory: "Accent",
    value: hex(LOGO.magenta),
    token: "--demo-signal-magenta",
  },
  {
    id: "demo-color-studio-orange",
    name: "Studio Orange",
    category: "Brand",
    subcategory: "Accent",
    value: hex(LOGO.orange),
    token: "--demo-studio-orange",
  },
  {
    id: "demo-color-electric-cobalt",
    name: "Electric Cobalt",
    category: "Brand",
    subcategory: "Accent",
    value: hex(LOGO.cobalt),
    token: "--demo-electric-cobalt",
  },
  {
    id: "demo-color-warm-amber",
    name: "Warm Amber",
    category: "Brand",
    subcategory: "Support",
    value: hex(LOGO.amber),
    token: "--demo-warm-amber",
  },
  {
    id: "demo-color-mist-panel",
    name: "Mist Panel",
    category: "Surface",
    subcategory: "Light",
    value: hex(LOGO.mist),
    token: "--demo-mist-panel",
  },
  {
    id: "demo-color-cloud-panel",
    name: "Cloud Panel",
    category: "Surface",
    subcategory: "Light",
    value: hex(LOGO.cloud),
    token: "--demo-cloud-panel",
  },
  {
    id: "demo-color-soft-slate",
    name: "Soft Slate",
    category: "Surface",
    subcategory: "Utility",
    value: hex(LOGO.slate),
  },
  {
    id: "demo-color-ink-trace",
    name: "Ink Trace",
    category: "Surface",
    subcategory: "Utility",
    value: hex(LOGO.ink),
  },
  {
    id: "demo-color-magenta-wash",
    name: "Magenta Wash",
    category: "Surface",
    subcategory: "Tint",
    value: rgba(227, 19, 75, 0.16),
    token: "--demo-magenta-wash",
  },
  {
    id: "demo-color-orange-wash",
    name: "Orange Wash",
    category: "Surface",
    subcategory: "Tint",
    value: rgba(255, 152, 0, 0.18),
    token: "--demo-orange-wash",
  },
  {
    id: "demo-color-cobalt-wash",
    name: "Cobalt Wash",
    category: "Surface",
    subcategory: "Tint",
    value: rgba(38, 102, 232, 0.18),
    token: "--demo-cobalt-wash",
  },
  {
    id: "demo-color-midnight-glass",
    name: "Midnight Glass",
    category: "Effects",
    subcategory: "Overlay",
    value: rgba(7, 26, 45, 0.72),
    token: "--demo-midnight-glass",
  },
  {
    id: "demo-color-stage-shadow",
    name: "Stage Shadow",
    category: "Effects",
    subcategory: "Overlay",
    value: rgba(18, 32, 51, 0.46),
    token: "--demo-stage-shadow",
  },
  {
    id: "demo-color-spotlight",
    name: "Spotlight",
    category: "Effects",
    subcategory: "Overlay",
    value: rgba(255, 255, 255, 0.22),
  },
  {
    id: "demo-color-success-beam",
    name: "Success Beam",
    category: "Semantic",
    subcategory: "Status",
    value: hex("#28B463"),
    token: "--demo-success-beam",
  },
  {
    id: "demo-color-warning-beam",
    name: "Warning Beam",
    category: "Semantic",
    subcategory: "Status",
    value: hex("#F39C12"),
    token: "--demo-warning-beam",
  },
  {
    id: "demo-color-danger-beam",
    name: "Danger Beam",
    category: "Semantic",
    subcategory: "Status",
    value: hex("#D61F2C"),
    token: "--demo-danger-beam",
  },
  {
    id: "demo-color-info-beam",
    name: "Info Beam",
    category: "Semantic",
    subcategory: "Status",
    value: hex("#2666E8"),
    token: "--demo-info-beam",
  },
  {
    id: "demo-color-hero-gradient-start",
    name: "Hero Gradient Start",
    category: "Gradients",
    subcategory: "Hero",
    value: hex("#112B4B"),
  },
  {
    id: "demo-color-hero-gradient-mid",
    name: "Hero Gradient Mid",
    category: "Gradients",
    subcategory: "Hero",
    value: hex("#E3134B"),
  },
  {
    id: "demo-color-hero-gradient-end",
    name: "Hero Gradient End",
    category: "Gradients",
    subcategory: "Hero",
    value: hex("#FF9800"),
  },
  {
    id: "demo-color-editor-grid",
    name: "Editor Grid",
    category: "Utility",
    subcategory: "Layout",
    value: rgba(216, 227, 241, 0.36),
    token: "--demo-editor-grid",
  },
  {
    id: "demo-color-focus-ring",
    name: "Focus Ring",
    category: "Utility",
    subcategory: "Layout",
    value: rgba(38, 102, 232, 0.56),
    token: "--demo-focus-ring",
  },
  {
    id: "demo-color-selection-fill",
    name: "Selection Fill",
    category: "Utility",
    subcategory: "Layout",
    value: rgba(227, 19, 75, 0.24),
    token: "--demo-selection-fill",
  },
];

const demoIconSpecs: DemoIconSpec[] = [
  {
    id: "demo-icon-logo-core",
    name: "Logo Core",
    category: "Marks",
    subcategory: "Core",
    motif: "logo",
    keywords: ["logo", "core", "brand"],
  },
  {
    id: "demo-icon-offset-pillars",
    name: "Offset Pillars",
    category: "Marks",
    subcategory: "Core",
    motif: "offset",
    keywords: ["offset", "pillars", "brand"],
  },
  {
    id: "demo-icon-split-window",
    name: "Split Window",
    category: "Layouts",
    subcategory: "Panels",
    motif: "window",
    keywords: ["window", "layout", "panels"],
  },
  {
    id: "demo-icon-rhythm-stack",
    name: "Rhythm Stack",
    category: "Layouts",
    subcategory: "Panels",
    motif: "stack",
    keywords: ["stack", "layout", "blocks"],
  },
  {
    id: "demo-icon-stage-stairs",
    name: "Stage Stairs",
    category: "Layouts",
    subcategory: "Motion",
    motif: "stairs",
    keywords: ["stairs", "steps", "motion"],
  },
  {
    id: "demo-icon-color-bridge",
    name: "Color Bridge",
    category: "Layouts",
    subcategory: "Motion",
    motif: "bridge",
    keywords: ["bridge", "bands", "color"],
  },
  {
    id: "demo-icon-beacon-tower",
    name: "Beacon Tower",
    category: "Scenes",
    subcategory: "Signals",
    motif: "beacon",
    keywords: ["beacon", "tower", "signal"],
  },
  {
    id: "demo-icon-ribbon-turn",
    name: "Ribbon Turn",
    category: "Scenes",
    subcategory: "Signals",
    motif: "ribbon",
    keywords: ["ribbon", "turn", "gesture"],
  },
  {
    id: "demo-icon-portal-frame",
    name: "Portal Frame",
    category: "Scenes",
    subcategory: "Spaces",
    motif: "portal",
    keywords: ["portal", "frame", "space"],
  },
  {
    id: "demo-icon-neon-columns",
    name: "Neon Columns",
    category: "Scenes",
    subcategory: "Spaces",
    motif: "columns",
    keywords: ["columns", "neon", "space"],
  },
  {
    id: "demo-icon-outline-frame",
    name: "Outline Frame",
    category: "Components",
    subcategory: "Cards",
    motif: "frame",
    keywords: ["outline", "frame", "card"],
  },
  {
    id: "demo-icon-split-card",
    name: "Split Card",
    category: "Components",
    subcategory: "Cards",
    motif: "split",
    keywords: ["split", "card", "component"],
  },
  {
    id: "demo-icon-ladder-grid",
    name: "Ladder Grid",
    category: "Components",
    subcategory: "UI",
    motif: "ladder",
    keywords: ["ladder", "grid", "ui"],
  },
  {
    id: "demo-icon-side-panel",
    name: "Side Panel",
    category: "Components",
    subcategory: "UI",
    motif: "panel",
    keywords: ["panel", "sidebar", "ui"],
  },
  {
    id: "demo-icon-pulse-band",
    name: "Pulse Band",
    category: "Signals",
    subcategory: "Indicators",
    motif: "pulse",
    keywords: ["pulse", "band", "indicator"],
  },
  {
    id: "demo-icon-block-grid",
    name: "Block Grid",
    category: "Signals",
    subcategory: "Indicators",
    motif: "blocks",
    keywords: ["blocks", "grid", "indicator"],
  },
];

export function demoColors(): ColorAsset[] {
  return demoColorSpecs.map((spec) => ({
    id: spec.id,
    name: spec.name,
    category: spec.category,
    subcategory: spec.subcategory,
    source: "demo",
    value: spec.value,
    token: spec.token,
  }));
}

export function demoIcons(): IconAsset[] {
  return demoIconSpecs.map((spec) => buildDemoIcon(spec));
}

export function demoFonts(): FontFamilyAsset[] {
  const families = [
    buildDemoFamily([
      face({
        id: "demo-font-atlas-display-regular",
        familyName: "Atlas Display",
        styleName: "Regular",
        fullName: "Atlas Display Regular",
        postscriptName: "AtlasDisplay-Regular",
        category: "Display",
        subcategory: "Hero",
        fileName: "AtlasDisplay-Regular.woff2",
        format: "WOFF2",
        foundry: "North Coast Type",
        width: 7,
        keywords: ["display", "hero", "wide"],
      }),
      face({
        id: "demo-font-atlas-display-semibold",
        familyName: "Atlas Display",
        styleName: "Semibold",
        fullName: "Atlas Display Semibold",
        postscriptName: "AtlasDisplay-Semibold",
        category: "Display",
        subcategory: "Hero",
        fileName: "AtlasDisplay-Semibold.woff2",
        format: "WOFF2",
        foundry: "North Coast Type",
        weight: 620,
        width: 7,
        keywords: ["display", "hero", "semibold"],
      }),
      face({
        id: "demo-font-atlas-display-black",
        familyName: "Atlas Display",
        styleName: "Black",
        fullName: "Atlas Display Black",
        postscriptName: "AtlasDisplay-Black",
        category: "Display",
        subcategory: "Hero",
        fileName: "AtlasDisplay-Black.woff2",
        format: "WOFF2",
        foundry: "North Coast Type",
        weight: 860,
        width: 8,
        keywords: ["display", "hero", "black"],
      }),
    ]),
    buildDemoFamily([
      face({
        id: "demo-font-studio-sans-regular",
        familyName: "Studio Sans",
        styleName: "Regular",
        fullName: "Studio Sans Regular",
        postscriptName: "StudioSans-Regular",
        category: "Sans",
        subcategory: "Interface",
        fileName: "StudioSans-Regular.ttf",
        format: "TTF",
        foundry: "Demo Grotesk",
        weight: 400,
        keywords: ["sans", "interface", "ui"],
      }),
      face({
        id: "demo-font-studio-sans-medium",
        familyName: "Studio Sans",
        styleName: "Medium",
        fullName: "Studio Sans Medium",
        postscriptName: "StudioSans-Medium",
        category: "Sans",
        subcategory: "Interface",
        fileName: "StudioSans-Medium.ttf",
        format: "TTF",
        foundry: "Demo Grotesk",
        weight: 500,
        keywords: ["sans", "interface", "medium"],
      }),
      face({
        id: "demo-font-studio-sans-variable",
        familyName: "Studio Sans",
        styleName: "Variable",
        fullName: "Studio Sans Variable",
        postscriptName: "StudioSans-Variable",
        category: "Sans",
        subcategory: "Interface",
        fileName: "StudioSans-Variable.ttf",
        format: "TTF",
        foundry: "Demo Grotesk",
        weight: 450,
        isVariable: true,
        keywords: ["sans", "interface", "variable"],
      }),
    ]),
    buildDemoFamily([
      face({
        id: "demo-font-channel-mono-regular",
        familyName: "Channel Mono",
        styleName: "Regular",
        fullName: "Channel Mono Regular",
        postscriptName: "ChannelMono-Regular",
        category: "Mono",
        subcategory: "Code",
        fileName: "ChannelMono-Regular.otf",
        format: "OTF",
        foundry: "Signal Works",
        weight: 430,
        keywords: ["mono", "code", "regular"],
      }),
      face({
        id: "demo-font-channel-mono-medium",
        familyName: "Channel Mono",
        styleName: "Medium",
        fullName: "Channel Mono Medium",
        postscriptName: "ChannelMono-Medium",
        category: "Mono",
        subcategory: "Code",
        fileName: "ChannelMono-Medium.otf",
        format: "OTF",
        foundry: "Signal Works",
        weight: 530,
        keywords: ["mono", "code", "medium"],
      }),
      face({
        id: "demo-font-channel-mono-bold",
        familyName: "Channel Mono",
        styleName: "Bold",
        fullName: "Channel Mono Bold",
        postscriptName: "ChannelMono-Bold",
        category: "Mono",
        subcategory: "Code",
        fileName: "ChannelMono-Bold.otf",
        format: "OTF",
        foundry: "Signal Works",
        weight: 700,
        keywords: ["mono", "code", "bold"],
      }),
    ]),
    buildDemoFamily([
      face({
        id: "demo-font-mosaic-serif-book",
        familyName: "Mosaic Serif",
        styleName: "Book",
        fullName: "Mosaic Serif Book",
        postscriptName: "MosaicSerif-Book",
        category: "Serif",
        subcategory: "Editorial",
        fileName: "MosaicSerif-Book.woff",
        format: "WOFF",
        foundry: "Harbor Type",
        weight: 360,
        keywords: ["serif", "editorial", "book"],
      }),
      face({
        id: "demo-font-mosaic-serif-medium",
        familyName: "Mosaic Serif",
        styleName: "Medium",
        fullName: "Mosaic Serif Medium",
        postscriptName: "MosaicSerif-Medium",
        category: "Serif",
        subcategory: "Editorial",
        fileName: "MosaicSerif-Medium.woff",
        format: "WOFF",
        foundry: "Harbor Type",
        weight: 520,
        keywords: ["serif", "editorial", "medium"],
      }),
      face({
        id: "demo-font-mosaic-serif-italic",
        familyName: "Mosaic Serif",
        styleName: "Italic",
        fullName: "Mosaic Serif Italic",
        postscriptName: "MosaicSerif-Italic",
        category: "Serif",
        subcategory: "Editorial",
        fileName: "MosaicSerif-Italic.woff",
        format: "WOFF",
        foundry: "Harbor Type",
        weight: 360,
        keywords: ["serif", "editorial", "italic"],
      }),
    ]),
  ];

  return families;
}

function buildDemoIcon(spec: DemoIconSpec): IconAsset {
  const svgMarkup = buildIconSvg(spec).trim();

  return {
    id: spec.id,
    name: spec.name,
    category: spec.category,
    subcategory: spec.subcategory,
    source: "demo",
    defaultCopyValue: svgMarkup,
    copyLabel: "Copy SVG Markup",
    keywords: [
      spec.name,
      spec.category,
      spec.subcategory,
      spec.motif,
      "demo",
      ...spec.keywords,
    ].filter(Boolean),
    svgMarkup,
    preview: svgToDataUrl(svgMarkup),
  };
}

function buildIconSvg(spec: DemoIconSpec): string {
  const background = spec.background ?? LOGO.midnight;
  const motif = motifMarkup(spec.motif);

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${background}" />
          <stop offset="100%" stop-color="${LOGO.deepBlue}" />
        </linearGradient>
        <linearGradient id="glow" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${LOGO.orange}" />
          <stop offset="100%" stop-color="${LOGO.cobalt}" />
        </linearGradient>
      </defs>
      <rect width="96" height="96" rx="24" fill="url(#bg)" />
      <rect x="10" y="10" width="76" height="76" rx="18" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.06)" />
      ${motif}
    </svg>
  `;
}

function motifMarkup(motif: DemoIconSpec["motif"]): string {
  switch (motif) {
    case "logo":
      return `
        <rect x="24" y="18" width="24" height="60" fill="${LOGO.magenta}" />
        <rect x="48" y="18" width="30" height="40" fill="${LOGO.orange}" />
        <rect x="48" y="58" width="30" height="20" fill="${LOGO.cobalt}" />
      `;
    case "offset":
      return `
        <rect x="20" y="20" width="18" height="52" rx="3" fill="${LOGO.magenta}" />
        <rect x="40" y="28" width="18" height="44" rx="3" fill="${LOGO.orange}" />
        <rect x="60" y="40" width="16" height="32" rx="3" fill="${LOGO.cobalt}" />
      `;
    case "window":
      return `
        <rect x="18" y="20" width="60" height="48" rx="8" fill="${LOGO.mist}" />
        <rect x="18" y="20" width="22" height="48" rx="8" fill="${LOGO.magenta}" />
        <rect x="44" y="28" width="28" height="16" rx="4" fill="${LOGO.orange}" />
        <rect x="44" y="48" width="28" height="14" rx="4" fill="${LOGO.cobalt}" />
      `;
    case "stack":
      return `
        <rect x="22" y="56" width="52" height="12" rx="4" fill="${LOGO.cobalt}" />
        <rect x="28" y="40" width="40" height="12" rx="4" fill="${LOGO.orange}" />
        <rect x="34" y="24" width="28" height="12" rx="4" fill="${LOGO.magenta}" />
      `;
    case "stairs":
      return `
        <path d="M20 66h16V50h16V34h24v32H20Z" fill="${LOGO.orange}" />
        <rect x="20" y="58" width="16" height="8" fill="${LOGO.magenta}" />
        <rect x="52" y="34" width="24" height="14" fill="${LOGO.cobalt}" />
      `;
    case "bridge":
      return `
        <rect x="18" y="52" width="60" height="10" rx="5" fill="${LOGO.cobalt}" />
        <rect x="26" y="30" width="12" height="22" rx="3" fill="${LOGO.magenta}" />
        <rect x="58" y="24" width="12" height="28" rx="3" fill="${LOGO.orange}" />
        <path d="M38 42h20" stroke="${LOGO.amber}" stroke-width="6" stroke-linecap="round" />
      `;
    case "beacon":
      return `
        <rect x="38" y="22" width="20" height="44" rx="6" fill="${LOGO.mist}" />
        <rect x="42" y="26" width="12" height="24" rx="4" fill="${LOGO.magenta}" />
        <rect x="42" y="50" width="12" height="12" rx="4" fill="${LOGO.orange}" />
        <path d="M24 26c6-8 12-12 24-12M72 26C66 18 60 14 48 14" stroke="${LOGO.cobalt}" stroke-width="4" stroke-linecap="round" fill="none" />
      `;
    case "ribbon":
      return `
        <path d="M22 62c8-24 18-36 30-36 8 0 14 4 22 12l-10 10c-5-5-9-7-13-7-7 0-13 8-19 25Z" fill="${LOGO.orange}" />
        <path d="M22 62h24l12-12H34Z" fill="${LOGO.magenta}" />
        <path d="M46 50h26v12H34Z" fill="${LOGO.cobalt}" />
      `;
    case "portal":
      return `
        <rect x="22" y="18" width="18" height="60" rx="4" fill="${LOGO.magenta}" />
        <rect x="40" y="18" width="36" height="18" rx="4" fill="${LOGO.orange}" />
        <rect x="40" y="36" width="24" height="42" rx="4" fill="${LOGO.cobalt}" />
      `;
    case "columns":
      return `
        <rect x="20" y="20" width="14" height="56" rx="4" fill="${LOGO.magenta}" />
        <rect x="41" y="20" width="14" height="56" rx="4" fill="${LOGO.orange}" />
        <rect x="62" y="20" width="14" height="56" rx="4" fill="${LOGO.cobalt}" />
      `;
    case "frame":
      return `
        <rect x="20" y="20" width="56" height="56" rx="10" fill="none" stroke="${LOGO.mist}" stroke-width="6" />
        <rect x="28" y="28" width="18" height="18" rx="4" fill="${LOGO.magenta}" />
        <rect x="50" y="28" width="18" height="18" rx="4" fill="${LOGO.orange}" />
        <rect x="50" y="50" width="18" height="18" rx="4" fill="${LOGO.cobalt}" />
      `;
    case "split":
      return `
        <rect x="18" y="18" width="28" height="60" rx="8" fill="${LOGO.magenta}" />
        <rect x="50" y="18" width="28" height="34" rx="8" fill="${LOGO.orange}" />
        <rect x="50" y="56" width="28" height="22" rx="8" fill="${LOGO.cobalt}" />
      `;
    case "ladder":
      return `
        <rect x="24" y="18" width="10" height="60" rx="4" fill="${LOGO.magenta}" />
        <rect x="62" y="18" width="10" height="60" rx="4" fill="${LOGO.cobalt}" />
        <rect x="34" y="28" width="28" height="8" rx="4" fill="${LOGO.orange}" />
        <rect x="34" y="44" width="28" height="8" rx="4" fill="${LOGO.orange}" />
        <rect x="34" y="60" width="28" height="8" rx="4" fill="${LOGO.orange}" />
      `;
    case "panel":
      return `
        <rect x="18" y="18" width="60" height="56" rx="10" fill="${LOGO.mist}" />
        <rect x="18" y="18" width="18" height="56" rx="10" fill="${LOGO.magenta}" />
        <rect x="42" y="28" width="28" height="8" rx="4" fill="${LOGO.orange}" />
        <rect x="42" y="42" width="20" height="8" rx="4" fill="${LOGO.cobalt}" />
        <rect x="42" y="56" width="24" height="8" rx="4" fill="${LOGO.deepBlue}" />
      `;
    case "pulse":
      return `
        <path d="M18 54h14l8-16 10 24 8-12h20" stroke="${LOGO.orange}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none" />
        <rect x="18" y="22" width="12" height="18" rx="4" fill="${LOGO.magenta}" />
        <rect x="66" y="22" width="12" height="18" rx="4" fill="${LOGO.cobalt}" />
      `;
    case "blocks":
      return `
        <rect x="22" y="22" width="14" height="14" rx="3" fill="${LOGO.magenta}" />
        <rect x="40" y="22" width="14" height="14" rx="3" fill="${LOGO.orange}" />
        <rect x="58" y="22" width="14" height="14" rx="3" fill="${LOGO.cobalt}" />
        <rect x="22" y="40" width="14" height="14" rx="3" fill="${LOGO.orange}" />
        <rect x="40" y="40" width="14" height="14" rx="3" fill="${LOGO.cobalt}" />
        <rect x="58" y="40" width="14" height="14" rx="3" fill="${LOGO.magenta}" />
        <rect x="22" y="58" width="14" height="14" rx="3" fill="${LOGO.cobalt}" />
        <rect x="40" y="58" width="14" height="14" rx="3" fill="${LOGO.magenta}" />
        <rect x="58" y="58" width="14" height="14" rx="3" fill="${LOGO.orange}" />
      `;
    default:
      return "";
  }
}

function face(input: DemoFaceInput): FontFaceAsset {
  return {
    ...input,
    source: "demo",
    filePath: "",
    faceIndex: 0,
    isVariable: input.isVariable ?? false,
    isColor: input.isColor ?? false,
    isCollection: input.isCollection ?? false,
    keywords: [
      input.familyName,
      input.styleName,
      input.postscriptName ?? "",
      input.category,
      input.subcategory ?? "",
      "demo",
      ...(input.keywords ?? []),
    ].filter(Boolean),
  };
}

function buildDemoFamily(faces: FontFaceAsset[]): FontFamilyAsset {
  const firstFace = faces[0];
  const formats = Array.from(new Set(faces.map((face) => face.format)));
  const foundries = Array.from(
    new Set(faces.map((face) => face.foundry).filter(Boolean)),
  ) as string[];

  return {
    id: `demo-family-${firstFace.familyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")}`,
    familyName: firstFace.familyName,
    category: firstFace.category,
    subcategory: firstFace.subcategory,
    source: "demo",
    faces,
    faceCount: faces.length,
    styleCount: new Set(faces.map((face) => face.styleName)).size,
    formats,
    foundries,
    filePaths: [],
    primaryFilePath: "",
    isVariable: faces.some((face) => face.isVariable),
    isColor: faces.some((face) => face.isColor),
    isCollection: faces.some((face) => face.isCollection),
    keywords: Array.from(
      new Set(
        [
          firstFace.familyName,
          firstFace.category,
          firstFace.subcategory ?? "",
          "demo",
          ...faces.flatMap((face) => face.keywords),
        ].filter(Boolean),
      ),
    ),
  };
}

function hex(value: string): ColorValue {
  return { kind: "hex", hex: value };
}

function rgba(r: number, g: number, b: number, a: number): ColorValue {
  return { kind: "rgba", r, g, b, a };
}

function svgToDataUrl(svgMarkup: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svgMarkup)}`;
}
