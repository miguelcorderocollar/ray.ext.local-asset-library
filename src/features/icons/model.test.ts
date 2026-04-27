import { describe, expect, it } from "vitest";

import { IconAsset } from "../../types";
import { groupIconsByCategory } from "./model";

const firstIcon: IconAsset = {
  id: "/tmp/logo.svg",
  name: "Logo",
  category: "Brand",
  subcategory: "Core",
  source: "local",
  defaultCopyValue: { file: "/tmp/logo.svg" },
  copyLabel: "Copy Image File",
  keywords: [],
  filePath: "/tmp/logo.svg",
  svgMarkup: "<svg />",
};

const secondIcon: IconAsset = {
  id: "/tmp/photo.png",
  name: "Photo",
  category: "Imagery",
  source: "local",
  defaultCopyValue: { file: "/tmp/photo.png" },
  copyLabel: "Copy Image File",
  keywords: [],
  filePath: "/tmp/photo.png",
};

describe("icons model", () => {
  it("keeps pinned assets in a dedicated first section", () => {
    const grouped = groupIconsByCategory(
      [secondIcon, firstIcon],
      new Set([firstIcon.filePath ?? firstIcon.id]),
    );

    expect(grouped).toEqual([
      ["Pinned", [firstIcon]],
      ["Imagery", [secondIcon]],
    ]);
  });
});
