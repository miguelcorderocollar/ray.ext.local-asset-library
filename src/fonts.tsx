import {
  Action,
  ActionPanel,
  Color,
  Icon,
  Keyboard,
  List,
  openExtensionPreferences,
  showToast,
  Toast,
} from "@raycast/api";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  FONT_VIEW_FILTERS,
  FontViewFilter,
  groupFontFamiliesByCategory,
  matchesFontViewFilter,
  weightLabel,
  widthLabel,
} from "./features/fonts/model";
import { FontFamilyAsset } from "./types";
import { fontCategoryPath, loadLocalFonts } from "./utils/fonts";

export default function FontsCommand() {
  const [families, setFamilies] = useState<FontFamilyAsset[]>([]);
  const [rootFolder, setRootFolder] = useState<string>();
  const [error, setError] = useState<string>();
  const [diagnostics, setDiagnostics] = useState<string[]>([]);
  const [selectedView, setSelectedView] = useState<FontViewFilter>("all");
  const [isShowingDetail, setIsShowingDetail] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const reloadFonts = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await loadLocalFonts();
      setFamilies(result.families);
      setRootFolder(result.rootFolder);
      setError(result.error);
      setDiagnostics(result.diagnostics);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown font scan error.";
      console.log("[Local Asset Library] Unhandled font scan error", error);
      setFamilies([]);
      setError(message);
      setDiagnostics([message]);
      await showToast({
        style: Toast.Style.Failure,
        title: "Font scan failed",
        message,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void reloadFonts();
  }, [reloadFonts]);

  const filteredFamilies = useMemo(
    () =>
      families.filter((family) => matchesFontViewFilter(family, selectedView)),
    [families, selectedView],
  );
  const groupedFamilies = useMemo(
    () => groupFontFamiliesByCategory(filteredFamilies),
    [filteredFamilies],
  );
  const hasConfiguredFolder = Boolean(rootFolder);

  return (
    <List
      isLoading={isLoading}
      isShowingDetail={isShowingDetail}
      searchBarPlaceholder="Search fonts by family, style, PostScript name, format, foundry, category, or file name"
      searchBarAccessory={
        <List.Dropdown
          tooltip="Filter fonts by type"
          value={selectedView}
          onChange={(value) => setSelectedView(value as FontViewFilter)}
        >
          <List.Dropdown.Section title="Views">
            {FONT_VIEW_FILTERS.map((filter) => (
              <List.Dropdown.Item
                key={filter.value}
                title={filter.title}
                value={filter.value}
              />
            ))}
          </List.Dropdown.Section>
        </List.Dropdown>
      }
    >
      <List.EmptyView
        icon={hasConfiguredFolder ? Icon.Text : Icon.Folder}
        title={emptyTitle(hasConfiguredFolder, error, selectedView)}
        description={emptyDescription(hasConfiguredFolder, error, selectedView)}
        actions={
          <ActionPanel>
            <Action
              title={
                isShowingDetail ? "Hide Metadata Panel" : "Show Metadata Panel"
              }
              icon={isShowingDetail ? Icon.Sidebar : Icon.AppWindowSidebarRight}
              shortcut={{ modifiers: ["cmd", "shift"], key: "m" }}
              onAction={() => setIsShowingDetail((current) => !current)}
            />
            <Action
              title="Open Extension Preferences"
              icon={Icon.Gear}
              onAction={openExtensionPreferences}
            />
            <Action
              title="Refresh Fonts"
              icon={Icon.ArrowClockwise}
              shortcut={Keyboard.Shortcut.Common.Refresh}
              onAction={() => void reloadFonts()}
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
      {groupedFamilies.map(([categoryPath, categoryFamilies]) => (
        <List.Section key={categoryPath} title={categoryPath}>
          {categoryFamilies.map((family) => (
            <List.Item
              key={family.id}
              title={family.familyName}
              subtitle={
                family.faceCount === 1 ? family.faces[0].styleName : undefined
              }
              icon={iconForFamily(family)}
              keywords={family.keywords}
              accessories={accessoriesForFamily(family, isShowingDetail)}
              detail={
                isShowingDetail ? (
                  <FontFamilyDetail family={family} />
                ) : undefined
              }
              actions={
                <FontFamilyActions
                  family={family}
                  diagnostics={diagnostics}
                  isShowingDetail={isShowingDetail}
                  onRefresh={reloadFonts}
                  onToggleDetail={() =>
                    setIsShowingDetail((current) => !current)
                  }
                />
              }
            />
          ))}
        </List.Section>
      ))}
    </List>
  );
}

function FontFamilyDetail({ family }: { family: FontFamilyAsset }) {
  const sortedFaces = [...family.faces].sort((left, right) =>
    left.styleName.localeCompare(right.styleName),
  );
  const primaryFileLabel = family.primaryFilePath || "Built-in demo data";

  return (
    <List.Item.Detail
      metadata={
        <List.Item.Detail.Metadata>
          <List.Item.Detail.Metadata.Label title="Overview" />
          <List.Item.Detail.Metadata.TagList title="Status">
            {family.isVariable ? (
              <List.Item.Detail.Metadata.TagList.Item
                text="Variable"
                color={Color.Blue}
              />
            ) : null}
            {family.isColor ? (
              <List.Item.Detail.Metadata.TagList.Item
                text="Color"
                color={Color.Magenta}
              />
            ) : null}
            {family.isCollection ? (
              <List.Item.Detail.Metadata.TagList.Item
                text="Collection"
                color={Color.Orange}
              />
            ) : null}
            <List.Item.Detail.Metadata.TagList.Item
              text="Local"
              color={Color.Green}
            />
          </List.Item.Detail.Metadata.TagList>
          <List.Item.Detail.Metadata.Label
            title="Library Path"
            text={fontCategoryPath(family)}
          />
          <List.Item.Detail.Metadata.Label
            title="Faces"
            text={`${family.faceCount}`}
          />
          <List.Item.Detail.Metadata.Label
            title="Styles"
            text={`${family.styleCount}`}
          />
          <List.Item.Detail.Metadata.Label
            title="Primary File"
            text={primaryFileLabel}
          />
          <List.Item.Detail.Metadata.Separator />
          <List.Item.Detail.Metadata.Label title="Formats & Foundry" />
          <List.Item.Detail.Metadata.TagList title="Formats">
            {family.formats.map((format) => (
              <List.Item.Detail.Metadata.TagList.Item
                key={format}
                text={format}
              />
            ))}
          </List.Item.Detail.Metadata.TagList>
          {family.foundries.length > 0 ? (
            <List.Item.Detail.Metadata.TagList title="Foundry">
              {family.foundries.map((foundry) => (
                <List.Item.Detail.Metadata.TagList.Item
                  key={foundry}
                  text={foundry}
                />
              ))}
            </List.Item.Detail.Metadata.TagList>
          ) : null}
          <List.Item.Detail.Metadata.Separator />
          <List.Item.Detail.Metadata.Label title="Styles" />
          {sortedFaces.map((face) => (
            <List.Item.Detail.Metadata.Label
              key={face.id}
              title={face.styleName}
              text={[
                face.postscriptName ? `PS ${face.postscriptName}` : "",
                face.weight ? `Wt ${weightLabel(face.weight)}` : "",
                face.width ? `Wd ${widthLabel(face.width)}` : "",
                face.format,
              ]
                .filter(Boolean)
                .join(" · ")}
            />
          ))}
        </List.Item.Detail.Metadata>
      }
    />
  );
}

function FontFamilyActions({
  family,
  diagnostics,
  isShowingDetail,
  onRefresh,
  onToggleDetail,
}: {
  family: FontFamilyAsset;
  diagnostics: string[];
  isShowingDetail: boolean;
  onRefresh: () => Promise<void>;
  onToggleDetail: () => void;
}) {
  const postscriptNames = family.faces
    .map((face) => face.postscriptName)
    .filter((name): name is string => Boolean(name));
  const hasFilePath = Boolean(family.primaryFilePath);

  return (
    <ActionPanel>
      <ActionPanel.Section>
        {hasFilePath ? (
          <Action.Open
            title="Open Font"
            target={family.primaryFilePath}
            shortcut={Keyboard.Shortcut.Common.Open}
          />
        ) : null}
        <Action
          title={
            isShowingDetail ? "Hide Metadata Panel" : "Show Metadata Panel"
          }
          icon={isShowingDetail ? Icon.Sidebar : Icon.AppWindowSidebarRight}
          shortcut={{ modifiers: ["cmd", "shift"], key: "m" }}
          onAction={onToggleDetail}
        />
      </ActionPanel.Section>
      <ActionPanel.Section title="Copy As">
        <Action.CopyToClipboard
          title="Copy Family Name"
          content={family.familyName}
          shortcut={Keyboard.Shortcut.Common.CopyName}
        />
        <Action.CopyToClipboard
          title="Copy Face Names"
          content={family.faces.map((face) => face.fullName).join("\n")}
          shortcut={{ modifiers: ["cmd", "shift"], key: "f" }}
        />
        {postscriptNames.length > 0 ? (
          <Action.CopyToClipboard
            title="Copy PostScript Names"
            content={postscriptNames.join("\n")}
            shortcut={{ modifiers: ["cmd", "shift"], key: "p" }}
          />
        ) : null}
        {hasFilePath ? (
          <Action.CopyToClipboard
            title="Copy File Path"
            content={family.primaryFilePath}
            shortcut={Keyboard.Shortcut.Common.CopyPath}
          />
        ) : null}
      </ActionPanel.Section>
      <ActionPanel.Section title="Manage">
        {hasFilePath ? (
          <Action.ShowInFinder path={family.primaryFilePath} />
        ) : null}
        {hasFilePath ? <Action.OpenWith path={family.primaryFilePath} /> : null}
        <Action
          title="Refresh Fonts"
          icon={Icon.ArrowClockwise}
          shortcut={Keyboard.Shortcut.Common.Refresh}
          onAction={() => {
            void onRefresh().then(() =>
              showToast({
                style: Toast.Style.Success,
                title: "Fonts refreshed",
              }),
            );
          }}
        />
        <Action
          title="Open Extension Preferences"
          icon={Icon.Gear}
          onAction={openExtensionPreferences}
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
  );
}

function emptyTitle(
  hasRootFolder: boolean,
  error: string | undefined,
  selectedView: FontViewFilter,
): string {
  if (!hasRootFolder) {
    return "Select a library folder";
  }

  if (error) {
    return "Unable to scan fonts";
  }

  return selectedView === "all"
    ? "No fonts found"
    : "No fonts match this filter";
}

function emptyDescription(
  hasRootFolder: boolean,
  error: string | undefined,
  selectedView: FontViewFilter,
): string {
  if (!hasRootFolder) {
    return "Set the Library Folder preference. The Fonts command scans font files inside that folder tree.";
  }

  if (error) {
    return error;
  }

  if (selectedView !== "all") {
    return `No font families match the current ${selectedView} filter.`;
  }

  return "Add TTF, OTF, TTC, DFont, WOFF, or WOFF2 files anywhere in the library folder tree.";
}

function iconForFamily(family: FontFamilyAsset): {
  source: Icon;
  tintColor?: Color;
} {
  if (family.isColor) {
    return { source: Icon.Text, tintColor: Color.Magenta };
  }

  if (family.isVariable) {
    return { source: Icon.Text, tintColor: Color.Blue };
  }

  return { source: Icon.Text };
}

function accessoriesForFamily(
  family: FontFamilyAsset,
  isShowingDetail: boolean,
): List.Item.Accessory[] {
  if (isShowingDetail) {
    return [];
  }

  const accessories: List.Item.Accessory[] = [
    { text: fontCategoryPath(family) },
    { text: family.formats.join(", ") },
    {
      text: `${family.faceCount} face${family.faceCount === 1 ? "" : "s"}`,
    },
  ];

  if (family.foundries.length > 0) {
    accessories.unshift({
      text: family.foundries[0],
      tooltip:
        family.foundries.length > 1
          ? `Foundries: ${family.foundries.join(", ")}`
          : "Foundry",
    });
  }

  if (family.isCollection) {
    accessories.push({
      text: "Collection",
      tooltip: "Collection file",
    });
  }

  return accessories;
}
