import {
  Action,
  ActionPanel,
  getPreferenceValues,
  Grid,
  Icon,
  Keyboard,
  openCommandPreferences,
  showToast,
  Toast,
} from "@raycast/api";
import { useCallback, useEffect, useMemo, useState } from "react";

import { groupIconsByCategory } from "./features/icons/model";
import { IconAsset } from "./types";
import {
  categoryOptions,
  iconPinKey,
  iconCategoryPath,
  loadLocalIcons,
} from "./utils/icons";
import { loadPinnedKeys, persistPinnedKeys } from "./utils/pins";

const ALL_CATEGORIES = "all";
const PINNED_STORAGE_KEY = "pinned-icons";

type AssetCommandPreferences = {
  assetGridColumns?: string;
};

export default function IconsCommand() {
  const [icons, setIcons] = useState<IconAsset[]>([]);
  const [rootFolder, setRootFolder] = useState<string>();
  const [error, setError] = useState<string>();
  const [diagnostics, setDiagnostics] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORIES);
  const [pinnedKeys, setPinnedKeys] = useState<string[]>([]);
  const [columns, setColumns] = useState(getAssetGridColumns());
  const [isLoading, setIsLoading] = useState(true);

  const reloadIcons = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await loadLocalIcons();
      setIcons(result.icons);
      setRootFolder(result.rootFolder);
      setError(result.error);
      setDiagnostics(result.diagnostics);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown icon scan error.";
      console.log("[Local Asset Library] Unhandled icon scan error", error);
      setIcons([]);
      setError(message);
      setDiagnostics([message]);
      await showToast({
        style: Toast.Style.Failure,
        title: "Icon scan failed",
        message,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void reloadIcons();
  }, [reloadIcons]);

  useEffect(() => {
    let isMounted = true;

    async function loadPins() {
      const stored = await loadPinnedKeys(PINNED_STORAGE_KEY);
      if (!isMounted) {
        return;
      }

      setPinnedKeys(stored);
    }

    void loadPins();

    return () => {
      isMounted = false;
    };
  }, []);

  const pinnedSet = useMemo(() => new Set(pinnedKeys), [pinnedKeys]);
  const categories = useMemo(() => categoryOptions(icons), [icons]);
  const filteredIcons = useMemo(
    () =>
      selectedCategory === ALL_CATEGORIES
        ? icons
        : icons.filter(
            (icon) =>
              icon.category === selectedCategory ||
              iconCategoryPath(icon) === selectedCategory,
          ),
    [icons, selectedCategory],
  );
  const groupedIcons = useMemo(
    () => groupIconsByCategory(filteredIcons, pinnedSet),
    [filteredIcons, pinnedSet],
  );
  const hasConfiguredFolder = Boolean(rootFolder);

  async function togglePin(icon: IconAsset) {
    const pinKey = iconPinKey(icon);
    const isPinned = pinnedSet.has(pinKey);
    const nextKeys = isPinned
      ? pinnedKeys.filter((key) => key !== pinKey)
      : Array.from(new Set([...pinnedKeys, pinKey]));

    setPinnedKeys(nextKeys);
    await persistPinnedKeys(PINNED_STORAGE_KEY, nextKeys);
    await showToast({
      style: Toast.Style.Success,
      title: isPinned ? "Removed pin" : "Pinned image",
      message: icon.name,
    });
  }

  return (
    <Grid
      columns={columns}
      fit={Grid.Fit.Fill}
      filtering={{ keepSectionOrder: true }}
      isLoading={isLoading}
      searchBarPlaceholder="Search icons and images by name, category, subcategory, or file name"
      searchBarAccessory={
        <Grid.Dropdown
          tooltip="Filter by category or subcategory"
          value={selectedCategory}
          onChange={setSelectedCategory}
        >
          <Grid.Dropdown.Item title="All Categories" value={ALL_CATEGORIES} />
          {categories.map((category) => (
            <Grid.Dropdown.Item
              key={category}
              title={category}
              value={category}
            />
          ))}
        </Grid.Dropdown>
      }
    >
      <Grid.EmptyView
        icon={hasConfiguredFolder ? Icon.MagnifyingGlass : Icon.Folder}
        title={
          hasConfiguredFolder
            ? "No icons or images found"
            : "Select an asset parent folder"
        }
        description={
          error ??
          (hasConfiguredFolder
            ? "Add SVG, PNG, JPG, GIF, WebP, AVIF, BMP, ICO, ICNS, or TIFF files anywhere in the folder tree."
            : "Set the Library Folder preference. The same root contains colors.json plus icon, image, and font folders. Top-level folders become categories; nested folders become subcategories.")
        }
        actions={
          <ActionPanel>
            <Action
              title="Make Tiles Larger"
              icon={Icon.Plus}
              shortcut={{ modifiers: ["cmd", "shift"], key: "=" }}
              onAction={() => setColumns((current) => Math.max(1, current - 1))}
            />
            <Action
              title="Make Tiles Smaller"
              icon={Icon.Minus}
              shortcut={{ modifiers: ["cmd", "shift"], key: "-" }}
              onAction={() => setColumns((current) => Math.min(8, current + 1))}
            />
            <Action
              title="Open Command Preferences"
              icon={Icon.Gear}
              onAction={openCommandPreferences}
            />
            <Action
              title="Refresh Icons"
              icon={Icon.ArrowClockwise}
              shortcut={Keyboard.Shortcut.Common.Refresh}
              onAction={() => void reloadIcons()}
            />
            {diagnostics.length > 0 ? (
              <Action.CopyToClipboard
                title="Copy Scan Diagnostics"
                content={diagnostics.join("\n")}
                shortcut={{ modifiers: ["cmd", "shift"], key: "d" }}
              />
            ) : null}
          </ActionPanel>
        }
      />
      {groupedIcons.map(([categoryPath, categoryIcons]) => (
        <Grid.Section key={categoryPath} title={categoryPath} columns={columns}>
          {categoryIcons.map((icon) =>
            (() => {
              const isPinned = pinnedSet.has(iconPinKey(icon));

              return (
                <Grid.Item
                  key={icon.id}
                  title={icon.name}
                  subtitle={iconCategoryPath(icon)}
                  content={{ source: icon.preview ?? icon.filePath ?? "" }}
                  keywords={
                    isPinned
                      ? [...icon.keywords, "pinned", "pin"]
                      : icon.keywords
                  }
                  quickLook={quickLookForAsset(icon)}
                  actions={
                    <ActionPanel>
                      <ActionPanel.Section>
                        <Action.CopyToClipboard
                          title={icon.copyLabel}
                          content={icon.defaultCopyValue}
                          shortcut={Keyboard.Shortcut.Common.Copy}
                        />
                        <Action.Paste
                          title={
                            icon.svgMarkup
                              ? "Paste SVG Markup"
                              : "Paste Image File"
                          }
                          content={icon.defaultCopyValue}
                          shortcut={{ modifiers: ["cmd"], key: "v" }}
                        />
                        {icon.filePath ? <Action.ToggleQuickLook /> : null}
                      </ActionPanel.Section>
                      <ActionPanel.Section title="Copy As">
                        <Action.CopyToClipboard
                          title="Copy Asset Name"
                          content={icon.name}
                          shortcut={Keyboard.Shortcut.Common.CopyName}
                        />
                        {icon.svgMarkup ? (
                          <Action.CopyToClipboard
                            title="Copy SVG Markup"
                            content={icon.svgMarkup}
                            shortcut={{ modifiers: ["cmd", "shift"], key: "s" }}
                          />
                        ) : null}
                        {icon.filePath ? (
                          <Action.CopyToClipboard
                            title="Copy File Path"
                            content={icon.filePath}
                            shortcut={Keyboard.Shortcut.Common.CopyPath}
                          />
                        ) : null}
                      </ActionPanel.Section>
                      <ActionPanel.Section title="Organize">
                        <Action
                          title={isPinned ? "Unpin Image" : "Pin Image"}
                          icon={isPinned ? Icon.PinDisabled : Icon.Pin}
                          shortcut={{ modifiers: ["cmd", "shift"], key: "p" }}
                          onAction={() => void togglePin(icon)}
                        />
                      </ActionPanel.Section>
                      <ActionPanel.Section title="Manage">
                        {icon.filePath ? (
                          <Action.ShowInFinder
                            path={icon.filePath}
                            shortcut={Keyboard.Shortcut.Common.Open}
                          />
                        ) : null}
                        {icon.filePath ? (
                          <Action.OpenWith path={icon.filePath} />
                        ) : null}
                        <Action
                          title="Refresh Icons"
                          icon={Icon.ArrowClockwise}
                          shortcut={Keyboard.Shortcut.Common.Refresh}
                          onAction={() => {
                            void reloadIcons().then(() =>
                              showToast({
                                style: Toast.Style.Success,
                                title: "Icons refreshed",
                              }),
                            );
                          }}
                        />
                        <Action
                          title="Open Command Preferences"
                          icon={Icon.Gear}
                          onAction={openCommandPreferences}
                        />
                        <Action
                          title="Make Tiles Larger"
                          icon={Icon.Plus}
                          shortcut={{ modifiers: ["cmd", "shift"], key: "=" }}
                          onAction={() =>
                            setColumns((current) => Math.max(1, current - 1))
                          }
                        />
                        <Action
                          title="Make Tiles Smaller"
                          icon={Icon.Minus}
                          shortcut={{ modifiers: ["cmd", "shift"], key: "-" }}
                          onAction={() =>
                            setColumns((current) => Math.min(8, current + 1))
                          }
                        />
                        {diagnostics.length > 0 ? (
                          <Action.CopyToClipboard
                            title="Copy Scan Diagnostics"
                            content={diagnostics.join("\n")}
                            shortcut={{ modifiers: ["cmd", "shift"], key: "d" }}
                          />
                        ) : null}
                      </ActionPanel.Section>
                    </ActionPanel>
                  }
                />
              );
            })(),
          )}
        </Grid.Section>
      ))}
    </Grid>
  );
}

function getAssetGridColumns(): number {
  const { assetGridColumns } = getPreferenceValues<AssetCommandPreferences>();
  const columns = Number(assetGridColumns ?? 6);
  return Number.isFinite(columns) ? columns : 6;
}

function quickLookForAsset(
  icon: IconAsset,
): { path: string; name?: string } | undefined {
  return icon.filePath ? { path: icon.filePath, name: icon.name } : undefined;
}
