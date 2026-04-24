import { IconAsset } from "../../types";

export const ICON_PINNED_SECTION_TITLE = "Pinned";

export function groupIconsByCategory(
  icons: IconAsset[],
  pinnedSet: Set<string>,
  pinnedSectionTitle = ICON_PINNED_SECTION_TITLE,
): Array<[string, IconAsset[]]> {
  const pinnedIcons: IconAsset[] = [];
  const groups = new Map<string, IconAsset[]>();

  for (const icon of sortIcons(icons, pinnedSet)) {
    if (pinnedSet.has(iconPinKey(icon))) {
      pinnedIcons.push(icon);
      continue;
    }

    const categoryPath = iconCategoryPath(icon);
    groups.set(categoryPath, [...(groups.get(categoryPath) ?? []), icon]);
  }

  const sortedGroups = Array.from(groups.entries()).sort(([a], [b]) =>
    a.localeCompare(b),
  );

  return pinnedIcons.length > 0
    ? [[pinnedSectionTitle, pinnedIcons], ...sortedGroups]
    : sortedGroups;
}

function sortIcons(icons: IconAsset[], pinnedSet: Set<string>): IconAsset[] {
  return [...icons].sort((left, right) => {
    const leftPinned = pinnedSet.has(iconPinKey(left));
    const rightPinned = pinnedSet.has(iconPinKey(right));

    if (leftPinned !== rightPinned) {
      return leftPinned ? -1 : 1;
    }

    return (
      iconCategoryPath(left).localeCompare(iconCategoryPath(right)) ||
      left.name.localeCompare(right.name)
    );
  });
}

function iconCategoryPath(
  icon: Pick<IconAsset, "category" | "subcategory">,
): string {
  return icon.subcategory
    ? `${icon.category} / ${icon.subcategory}`
    : icon.category;
}

function iconPinKey(icon: Pick<IconAsset, "id" | "filePath">): string {
  return icon.filePath ?? icon.id;
}
