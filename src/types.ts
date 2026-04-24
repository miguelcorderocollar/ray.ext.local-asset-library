export type AssetSource = "json" | "local" | "demo";

export type ColorValue =
  | {
      kind: "hex";
      hex: string;
    }
  | {
      kind: "rgba";
      r: number;
      g: number;
      b: number;
      a: number;
    };

export type ColorAsset = {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  source: AssetSource;
  value: ColorValue;
  token?: string;
  isEditable?: boolean;
};

export type ColorMetadata = {
  categoryPath: string;
  cssValue: string;
  hexValue?: string;
  rgbValue: string;
  alpha: number;
  opacityPercent: number;
  isTransparent: boolean;
  hue: number;
  saturation: number;
  lightness: number;
  luminance: number;
  family: string;
  tone: "light" | "dark";
  contrastText: "black" | "white";
  tags: string[];
};

export type CustomColorInput = {
  name: string;
  category: string;
  subcategory?: string;
  value: string;
  token?: string;
};

export type ColorsJsonFile = {
  colors: CustomColorInput[];
};

export type IconAsset = {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  source: Exclude<AssetSource, "json">;
  defaultCopyValue: string | { file: string };
  copyLabel: string;
  keywords: string[];
  filePath?: string;
  svgMarkup?: string;
  preview?: string;
};

export type FontFaceAsset = {
  id: string;
  familyName: string;
  styleName: string;
  fullName: string;
  postscriptName?: string;
  category: string;
  subcategory?: string;
  source: Exclude<AssetSource, "json">;
  fileName: string;
  filePath: string;
  faceIndex: number;
  format: string;
  foundry?: string;
  weight?: number;
  width?: number;
  isVariable: boolean;
  isColor: boolean;
  isCollection: boolean;
  keywords: string[];
};

export type FontFamilyAsset = {
  id: string;
  familyName: string;
  category: string;
  subcategory?: string;
  source: Exclude<AssetSource, "json">;
  faces: FontFaceAsset[];
  faceCount: number;
  styleCount: number;
  formats: string[];
  foundries: string[];
  filePaths: string[];
  primaryFilePath: string;
  isVariable: boolean;
  isColor: boolean;
  isCollection: boolean;
  keywords: string[];
};
