import {
  Action,
  ActionPanel,
  Alert,
  Color,
  confirmAlert,
  Detail,
  Form,
  getPreferenceValues,
  Grid,
  Icon,
  Keyboard,
  List,
  openCommandPreferences,
  showToast,
  Toast,
  useNavigation,
} from "@raycast/api";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ColorAsset, ColorMetadata, CustomColorInput } from "./types";
import {
  buildColorDetailMarkdown,
  COLOR_VIEW_FILTERS,
  ColorViewFilter,
  ColorViewMode,
  groupColorsByCategory,
  matchesColorViewFilter,
} from "./features/colors/model";
import {
  buildColorSearchKeywords,
  buildCustomColor,
  colorPinKey,
  colorValueToCss,
  colorValueToGridColor,
  formatColorSubtitle,
  getColorMetadata,
} from "./utils/color";
import { loadColorsJson, saveColorsJson } from "./utils/colors-json";
import { loadPinnedKeys, persistPinnedKeys } from "./utils/pins";

const PINNED_STORAGE_KEY = "pinned-colors";
const LEGACY_FAVORITES_STORAGE_KEY = "favorite-colors";

type ColorCommandPreferences = {
  colorDefaultView?: ColorViewMode;
  colorGridColumns?: string;
};

export default function ColorsCommand() {
  const [colors, setColors] = useState<ColorAsset[]>([]);
  const [colorsFilePath, setColorsFilePath] = useState<string>();
  const [rootFolder, setRootFolder] = useState<string>();
  const [errors, setErrors] = useState<string[]>([]);
  const [selectedView, setSelectedView] = useState<ColorViewFilter>("all");
  const [pinnedKeys, setPinnedKeys] = useState<string[]>([]);
  const [presentation, setPresentation] = useState<ColorViewMode>(
    getDefaultColorViewMode(),
  );
  const [columns, setColumns] = useState(getColorGridColumns());
  const [isShowingDetail, setIsShowingDetail] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const reloadColors = useCallback(async () => {
    setIsLoading(true);
    const result = await loadColorsJson();
    setColors(result.colors);
    setColorsFilePath(result.colorsFilePath);
    setRootFolder(result.rootFolder);
    setErrors(result.errors);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void reloadColors();
  }, [reloadColors]);

  useEffect(() => {
    let isMounted = true;

    async function loadPins() {
      const stored = await loadPinnedKeys(
        PINNED_STORAGE_KEY,
        LEGACY_FAVORITES_STORAGE_KEY,
      );
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
  const categories = useMemo(
    () =>
      Array.from(new Set(colors.map((color) => color.category))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [colors],
  );
  const filteredColors = useMemo(
    () =>
      colors.filter((color) =>
        matchesColorViewFilter(color, selectedView, pinnedSet),
      ),
    [colors, pinnedSet, selectedView],
  );
  const groupedColors = useMemo(
    () => groupColorsByCategory(filteredColors, pinnedSet),
    [filteredColors, pinnedSet],
  );

  async function persistColors(
    nextColors: ColorAsset[],
    toastTitle: string,
    message?: string,
  ) {
    const savedPath = await saveColorsJson(nextColors);
    setColors(nextColors);
    setColorsFilePath(savedPath);
    setErrors([]);
    await showToast({ style: Toast.Style.Success, title: toastTitle, message });
  }

  async function persistPins(nextKeys: string[]) {
    setPinnedKeys(nextKeys);
    await persistPinnedKeys(PINNED_STORAGE_KEY, nextKeys);
  }

  async function togglePin(color: ColorAsset) {
    const pinKey = colorPinKey(color);
    const isPinned = pinnedSet.has(pinKey);
    const nextKeys = isPinned
      ? pinnedKeys.filter((key) => key !== pinKey)
      : Array.from(new Set([...pinnedKeys, pinKey]));

    await persistPins(nextKeys);
    await showToast({
      style: Toast.Style.Success,
      title: isPinned ? "Removed pin" : "Pinned color",
      message: color.name,
    });
  }

  async function upsertColor(
    input: CustomColorInput,
    existingColor?: ColorAsset,
  ) {
    const color = buildCustomColor(input, existingColor?.id);
    const nextColors = existingColor
      ? colors.map((existing) =>
          existing.id === existingColor.id ? color : existing,
        )
      : [...colors, color];

    await persistColors(
      nextColors,
      existingColor ? "Color updated" : "Color added",
      color.name,
    );

    if (existingColor) {
      const previousPinKey = colorPinKey(existingColor);
      const nextPinKey = colorPinKey(color);
      if (pinnedSet.has(previousPinKey) && previousPinKey !== nextPinKey) {
        await persistPins(
          pinnedKeys.map((key) => (key === previousPinKey ? nextPinKey : key)),
        );
      }
    }
  }

  async function deleteColor(color: ColorAsset) {
    const shouldDelete = await confirmAlert({
      title: "Delete color?",
      message: color.name,
      primaryAction: {
        title: "Delete",
        style: Alert.ActionStyle.Destructive,
      },
    });

    if (!shouldDelete) {
      return;
    }

    const pinKey = colorPinKey(color);
    if (pinnedSet.has(pinKey)) {
      await persistPins(pinnedKeys.filter((key) => key !== pinKey));
    }

    await persistColors(
      colors.filter((existing) => existing.id !== color.id),
      "Color deleted",
      color.name,
    );
  }

  if (presentation === "list") {
    return (
      <List
        filtering={{ keepSectionOrder: true }}
        isLoading={isLoading}
        isShowingDetail={isShowingDetail}
        searchBarPlaceholder="Search colors by name, token, category, family, opacity, tone, or value"
        searchBarAccessory={
          <List.Dropdown
            tooltip="Filter colors by organization view"
            value={selectedView}
            onChange={(value) => setSelectedView(value as ColorViewFilter)}
          >
            <List.Dropdown.Section title="Views">
              {COLOR_VIEW_FILTERS.map((filter) => (
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
          icon={errors.length > 0 ? Icon.ExclamationMark : Icon.Circle}
          title={emptyTitle(Boolean(rootFolder), errors)}
          description={emptyDescription(
            Boolean(rootFolder),
            colorsFilePath,
            errors,
            selectedView,
          )}
          actions={
            <ActionPanel>
              <Action
                title={
                  isShowingDetail
                    ? "Hide Metadata Panel"
                    : "Show Metadata Panel"
                }
                icon={
                  isShowingDetail ? Icon.Sidebar : Icon.AppWindowSidebarRight
                }
                shortcut={{ modifiers: ["cmd", "shift"], key: "m" }}
                onAction={() => setIsShowingDetail((current) => !current)}
              />
              <Action
                title="Switch to Grid View"
                icon={Icon.AppWindowGrid3x3}
                shortcut={{ modifiers: ["cmd", "shift"], key: "g" }}
                onAction={() => setPresentation("grid")}
              />
              {rootFolder && errors.length === 0 ? (
                <Action.Push
                  icon={Icon.Plus}
                  title="Add Color"
                  target={
                    <ColorForm onSubmit={upsertColor} categories={categories} />
                  }
                  shortcut={Keyboard.Shortcut.Common.New}
                />
              ) : null}
              {errors.length > 0 ? (
                <Action.CopyToClipboard
                  title="Copy Validation Errors"
                  content={errors.join("\n")}
                  shortcut={{ modifiers: ["cmd", "shift"], key: "e" }}
                />
              ) : null}
              {colorsFilePath ? (
                <Action.ShowInFinder
                  path={colorsFilePath}
                  shortcut={{ modifiers: ["cmd"], key: "o" }}
                />
              ) : null}
              <Action
                title="Open Command Preferences"
                icon={Icon.Gear}
                onAction={openCommandPreferences}
              />
              <Action
                title="Refresh Colors"
                icon={Icon.ArrowClockwise}
                shortcut={Keyboard.Shortcut.Common.Refresh}
                onAction={() => void reloadColors()}
              />
            </ActionPanel>
          }
        />
        {groupedColors.map(([categoryPath, sectionColors]) => (
          <List.Section key={categoryPath} title={categoryPath}>
            {sectionColors.map((color) => {
              const isPinned = pinnedSet.has(colorPinKey(color));
              const metadata = getColorMetadata(color);

              return (
                <List.Item
                  key={color.id}
                  title={color.name}
                  subtitle={formatColorSubtitle(color)}
                  icon={colorListIcon(color)}
                  keywords={buildColorSearchKeywords(color, isPinned)}
                  accessories={colorAccessories(
                    color,
                    metadata,
                    isShowingDetail,
                  )}
                  detail={
                    isShowingDetail ? (
                      <ColorListDetail
                        color={color}
                        isPinned={isPinned}
                        metadata={metadata}
                      />
                    ) : undefined
                  }
                  actions={
                    <ColorActions
                      color={color}
                      categories={categories}
                      isPinned={isPinned}
                      isShowingDetail={isShowingDetail}
                      metadata={metadata}
                      mode="list"
                      onDelete={deleteColor}
                      onIncreaseGrid={() =>
                        setColumns((current) => Math.max(1, current - 1))
                      }
                      onDecreaseGrid={() =>
                        setColumns((current) => Math.min(8, current + 1))
                      }
                      onRefresh={reloadColors}
                      onSubmit={upsertColor}
                      onSwitchPresentation={() => setPresentation("grid")}
                      onToggleDetail={() =>
                        setIsShowingDetail((current) => !current)
                      }
                      onTogglePin={togglePin}
                    />
                  }
                />
              );
            })}
          </List.Section>
        ))}
      </List>
    );
  }

  return (
    <Grid
      columns={columns}
      fit={Grid.Fit.Fill}
      filtering={{ keepSectionOrder: true }}
      isLoading={isLoading}
      searchBarPlaceholder="Search colors by name, token, category, family, opacity, tone, or value"
      searchBarAccessory={
        <Grid.Dropdown
          tooltip="Filter colors by organization view"
          value={selectedView}
          onChange={(value) => setSelectedView(value as ColorViewFilter)}
        >
          <Grid.Dropdown.Section title="Views">
            {COLOR_VIEW_FILTERS.map((filter) => (
              <Grid.Dropdown.Item
                key={filter.value}
                title={filter.title}
                value={filter.value}
              />
            ))}
          </Grid.Dropdown.Section>
        </Grid.Dropdown>
      }
    >
      <Grid.EmptyView
        icon={errors.length > 0 ? Icon.ExclamationMark : Icon.Circle}
        title={emptyTitle(Boolean(rootFolder), errors)}
        description={emptyDescription(
          Boolean(rootFolder),
          colorsFilePath,
          errors,
          selectedView,
        )}
        actions={
          <ActionPanel>
            <Action
              title="Switch to List View"
              icon={Icon.List}
              shortcut={{ modifiers: ["cmd", "shift"], key: "l" }}
              onAction={() => setPresentation("list")}
            />
            {rootFolder && errors.length === 0 ? (
              <Action.Push
                icon={Icon.Plus}
                title="Add Color"
                target={
                  <ColorForm onSubmit={upsertColor} categories={categories} />
                }
                shortcut={Keyboard.Shortcut.Common.New}
              />
            ) : null}
            {errors.length > 0 ? (
              <Action.CopyToClipboard
                title="Copy Validation Errors"
                content={errors.join("\n")}
                shortcut={{ modifiers: ["cmd", "shift"], key: "e" }}
              />
            ) : null}
            {colorsFilePath ? (
              <Action.ShowInFinder
                path={colorsFilePath}
                shortcut={{ modifiers: ["cmd"], key: "o" }}
              />
            ) : null}
            <Action
              title="Open Command Preferences"
              icon={Icon.Gear}
              onAction={openCommandPreferences}
            />
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
              title="Refresh Colors"
              icon={Icon.ArrowClockwise}
              shortcut={Keyboard.Shortcut.Common.Refresh}
              onAction={() => void reloadColors()}
            />
          </ActionPanel>
        }
      />
      {groupedColors.map(([categoryPath, sectionColors]) => (
        <Grid.Section key={categoryPath} title={categoryPath} columns={columns}>
          {sectionColors.map((color) => {
            const isPinned = pinnedSet.has(colorPinKey(color));
            const metadata = getColorMetadata(color);

            return (
              <Grid.Item
                key={color.id}
                title={color.name}
                subtitle={formatColorSubtitle(color)}
                content={{ color: colorValueToGridColor(color.value) }}
                keywords={buildColorSearchKeywords(color, isPinned)}
                accessory={gridAccessory(color)}
                actions={
                  <ColorActions
                    color={color}
                    categories={categories}
                    isPinned={isPinned}
                    isShowingDetail={false}
                    metadata={metadata}
                    mode="grid"
                    onDelete={deleteColor}
                    onIncreaseGrid={() =>
                      setColumns((current) => Math.max(1, current - 1))
                    }
                    onDecreaseGrid={() =>
                      setColumns((current) => Math.min(8, current + 1))
                    }
                    onRefresh={reloadColors}
                    onSubmit={upsertColor}
                    onSwitchPresentation={() => setPresentation("list")}
                    onToggleDetail={() =>
                      setIsShowingDetail((current) => !current)
                    }
                    onTogglePin={togglePin}
                  />
                }
              />
            );
          })}
        </Grid.Section>
      ))}
    </Grid>
  );
}

function ColorActions({
  color,
  categories,
  isPinned,
  isShowingDetail,
  metadata,
  mode,
  onDelete,
  onIncreaseGrid,
  onDecreaseGrid,
  onRefresh,
  onSubmit,
  onSwitchPresentation,
  onToggleDetail,
  onTogglePin,
}: {
  color: ColorAsset;
  categories: string[];
  isPinned: boolean;
  isShowingDetail: boolean;
  metadata: ColorMetadata;
  mode: ColorViewMode;
  onDelete: (color: ColorAsset) => Promise<void>;
  onIncreaseGrid: () => void;
  onDecreaseGrid: () => void;
  onRefresh: () => Promise<void>;
  onSubmit: (
    input: CustomColorInput,
    existingColor?: ColorAsset,
  ) => Promise<void>;
  onSwitchPresentation: () => void;
  onToggleDetail: () => void;
  onTogglePin: (color: ColorAsset) => Promise<void>;
}) {
  const canManageColorJson = color.source !== "demo";

  return (
    <ActionPanel>
      <ActionPanel.Section>
        <Action.Push
          icon={Icon.Sidebar}
          title="Show Full Details"
          target={
            <ColorDetail
              color={color}
              categories={categories}
              isPinned={isPinned}
              metadata={metadata}
              onSubmit={onSubmit}
              onTogglePin={onTogglePin}
              onDelete={onDelete}
            />
          }
          shortcut={{ modifiers: ["cmd"], key: "return" }}
        />
        {mode === "list" ? (
          <Action
            title={
              isShowingDetail ? "Hide Metadata Panel" : "Show Metadata Panel"
            }
            icon={isShowingDetail ? Icon.Sidebar : Icon.AppWindowSidebarRight}
            shortcut={{ modifiers: ["cmd", "shift"], key: "m" }}
            onAction={onToggleDetail}
          />
        ) : (
          <Action
            title="Switch to List View"
            icon={Icon.List}
            shortcut={{ modifiers: ["cmd", "shift"], key: "l" }}
            onAction={onSwitchPresentation}
          />
        )}
        <Action.CopyToClipboard
          title="Copy Color"
          content={metadata.cssValue}
          shortcut={Keyboard.Shortcut.Common.Copy}
        />
        <Action.Paste
          title="Paste Color"
          content={metadata.cssValue}
          shortcut={{ modifiers: ["cmd"], key: "v" }}
        />
      </ActionPanel.Section>
      <ActionPanel.Section title="Copy As">
        {metadata.hexValue ? (
          <Action.CopyToClipboard
            title="Copy HEX"
            content={metadata.hexValue}
            shortcut={{ modifiers: ["cmd", "shift"], key: "h" }}
          />
        ) : null}
        <Action.CopyToClipboard
          title="Copy RGB/RGBA"
          content={metadata.rgbValue}
          shortcut={{ modifiers: ["cmd", "shift"], key: "r" }}
        />
        {color.token ? (
          <Action.CopyToClipboard
            title="Copy CSS Variable"
            content={`var(${color.token})`}
            shortcut={{ modifiers: ["cmd", "shift"], key: "v" }}
          />
        ) : null}
        {color.token ? (
          <Action.CopyToClipboard
            title="Copy Token Name"
            content={color.token}
            shortcut={{ modifiers: ["cmd", "shift"], key: "t" }}
          />
        ) : null}
      </ActionPanel.Section>
      <ActionPanel.Section title="Organize">
        <Action
          icon={isPinned ? Icon.PinDisabled : Icon.Pin}
          title={isPinned ? "Unpin Color" : "Pin Color"}
          shortcut={{ modifiers: ["cmd", "shift"], key: "p" }}
          onAction={() => void onTogglePin(color)}
        />
        {mode === "grid" ? (
          <>
            <Action
              title="Make Tiles Larger"
              icon={Icon.Plus}
              shortcut={{ modifiers: ["cmd", "shift"], key: "=" }}
              onAction={onIncreaseGrid}
            />
            <Action
              title="Make Tiles Smaller"
              icon={Icon.Minus}
              shortcut={{ modifiers: ["cmd", "shift"], key: "-" }}
              onAction={onDecreaseGrid}
            />
          </>
        ) : (
          <Action
            title="Switch to Grid View"
            icon={Icon.AppWindowGrid3x3}
            shortcut={{ modifiers: ["cmd", "shift"], key: "g" }}
            onAction={onSwitchPresentation}
          />
        )}
      </ActionPanel.Section>
      {canManageColorJson ? (
        <ActionPanel.Section title="colors.json">
          <Action.Push
            icon={Icon.Plus}
            title="Add Color"
            target={<ColorForm onSubmit={onSubmit} categories={categories} />}
            shortcut={Keyboard.Shortcut.Common.New}
          />
          <Action.Push
            icon={Icon.Pencil}
            title="Edit Color"
            target={
              <ColorForm
                color={color}
                onSubmit={onSubmit}
                categories={categories}
              />
            }
            shortcut={Keyboard.Shortcut.Common.Edit}
          />
          <Action
            icon={Icon.Trash}
            title="Delete Color"
            style={Action.Style.Destructive}
            onAction={() => void onDelete(color)}
            shortcut={Keyboard.Shortcut.Common.Remove}
          />
        </ActionPanel.Section>
      ) : null}
      <ActionPanel.Section title="Manage">
        <Action
          title="Refresh Colors"
          icon={Icon.ArrowClockwise}
          shortcut={Keyboard.Shortcut.Common.Refresh}
          onAction={() => {
            void onRefresh().then(() =>
              showToast({
                style: Toast.Style.Success,
                title: "Colors refreshed",
              }),
            );
          }}
        />
        <Action
          title="Open Command Preferences"
          icon={Icon.Gear}
          onAction={openCommandPreferences}
        />
      </ActionPanel.Section>
    </ActionPanel>
  );
}

function ColorListDetail({
  color,
  isPinned,
  metadata,
}: {
  color: ColorAsset;
  isPinned: boolean;
  metadata: ColorMetadata;
}) {
  const contrastTagColor =
    metadata.contrastText === "black" ? Color.SecondaryText : Color.Blue;

  return (
    <List.Item.Detail
      metadata={
        <List.Item.Detail.Metadata>
          <List.Item.Detail.Metadata.Label title="Overview" />
          <List.Item.Detail.Metadata.TagList title="Status">
            {isPinned ? (
              <List.Item.Detail.Metadata.TagList.Item
                text="Pinned"
                color={Color.Yellow}
              />
            ) : null}
            <List.Item.Detail.Metadata.TagList.Item
              text={metadata.isTransparent ? "Transparent" : "Solid"}
              color={metadata.isTransparent ? Color.Orange : Color.Green}
            />
            <List.Item.Detail.Metadata.TagList.Item
              text={color.token ? "Tokenized" : "Untokenized"}
              color={color.token ? Color.Blue : Color.SecondaryText}
            />
            {color.isEditable ? (
              <List.Item.Detail.Metadata.TagList.Item
                text="Editable"
                color={Color.Purple}
              />
            ) : null}
          </List.Item.Detail.Metadata.TagList>
          <List.Item.Detail.Metadata.Label
            title="Library Path"
            text={metadata.categoryPath}
          />
          <List.Item.Detail.Metadata.Label
            title="Source"
            text={
              color.source === "json"
                ? "colors.json"
                : color.source === "demo"
                  ? "Built-in demo"
                  : "Local"
            }
          />
          <List.Item.Detail.Metadata.Label
            title="Format"
            text={color.value.kind === "hex" ? "HEX" : "RGBA"}
          />
          <List.Item.Detail.Metadata.Label
            title="Color Family"
            text={capitalize(metadata.family)}
          />
          <List.Item.Detail.Metadata.Label
            title="Tone"
            text={capitalize(metadata.tone)}
          />
          <List.Item.Detail.Metadata.Label
            title="Contrast Text"
            text={{
              value: capitalize(metadata.contrastText),
              color: contrastTagColor,
            }}
          />
          <List.Item.Detail.Metadata.Separator />
          <List.Item.Detail.Metadata.Label title="Values" />
          <List.Item.Detail.Metadata.Label
            title="CSS"
            text={metadata.cssValue}
          />
          {metadata.hexValue ? (
            <List.Item.Detail.Metadata.Label
              title="HEX"
              text={metadata.hexValue}
            />
          ) : null}
          <List.Item.Detail.Metadata.Label
            title="RGB"
            text={metadata.rgbValue}
          />
          <List.Item.Detail.Metadata.Label
            title="Opacity"
            text={`${metadata.opacityPercent}%`}
          />
          <List.Item.Detail.Metadata.Label
            title="Alpha"
            text={metadata.alpha.toFixed(2)}
          />
          {color.token ? (
            <List.Item.Detail.Metadata.Label title="Token" text={color.token} />
          ) : null}
          <List.Item.Detail.Metadata.Label
            title="CSS Variable"
            text={color.token ? `var(${color.token})` : "Not available"}
          />
          <List.Item.Detail.Metadata.Separator />
          <List.Item.Detail.Metadata.Label title="Analysis" />
          <List.Item.Detail.Metadata.Label
            title="Hue"
            text={`${metadata.hue}°`}
          />
          <List.Item.Detail.Metadata.Label
            title="Saturation"
            text={`${metadata.saturation}%`}
          />
          <List.Item.Detail.Metadata.Label
            title="Lightness"
            text={`${metadata.lightness}%`}
          />
          <List.Item.Detail.Metadata.Label
            title="Luminance"
            text={metadata.luminance.toFixed(3)}
          />
        </List.Item.Detail.Metadata>
      }
    />
  );
}

function ColorDetail({
  color,
  categories,
  isPinned,
  metadata,
  onSubmit,
  onTogglePin,
  onDelete,
}: {
  color: ColorAsset;
  categories: string[];
  isPinned: boolean;
  metadata: ColorMetadata;
  onSubmit: (
    input: CustomColorInput,
    existingColor?: ColorAsset,
  ) => Promise<void>;
  onTogglePin: (color: ColorAsset) => Promise<void>;
  onDelete: (color: ColorAsset) => Promise<void>;
}) {
  const { pop } = useNavigation();
  const contrastTagColor =
    metadata.contrastText === "black" ? Color.SecondaryText : Color.Blue;
  const canManageColorJson = color.source !== "demo";

  return (
    <Detail
      navigationTitle={color.name}
      markdown={buildColorDetailMarkdown(color, metadata, isPinned)}
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.TagList title="Status">
            {isPinned ? (
              <Detail.Metadata.TagList.Item
                text="Pinned"
                color={Color.Yellow}
              />
            ) : null}
            <Detail.Metadata.TagList.Item
              text={metadata.isTransparent ? "Transparent" : "Solid"}
              color={metadata.isTransparent ? Color.Orange : Color.Green}
            />
            <Detail.Metadata.TagList.Item
              text={color.token ? "Tokenized" : "Untokenized"}
              color={color.token ? Color.Blue : Color.SecondaryText}
            />
            {color.isEditable ? (
              <Detail.Metadata.TagList.Item
                text="Editable"
                color={Color.Purple}
              />
            ) : null}
          </Detail.Metadata.TagList>
          <Detail.Metadata.Label title="Category" text={color.category} />
          {color.subcategory ? (
            <Detail.Metadata.Label
              title="Subcategory"
              text={color.subcategory}
            />
          ) : null}
          <Detail.Metadata.Label
            title="Family"
            text={capitalize(metadata.family)}
          />
          <Detail.Metadata.Label
            title="Tone"
            text={capitalize(metadata.tone)}
          />
          <Detail.Metadata.Label
            title="Contrast Text"
            text={{
              value: capitalize(metadata.contrastText),
              color: contrastTagColor,
            }}
          />
          <Detail.Metadata.Separator />
          <Detail.Metadata.Label title="CSS" text={metadata.cssValue} />
          {metadata.hexValue ? (
            <Detail.Metadata.Label title="HEX" text={metadata.hexValue} />
          ) : null}
          <Detail.Metadata.Label title="RGB" text={metadata.rgbValue} />
          <Detail.Metadata.Label
            title="Opacity"
            text={`${metadata.opacityPercent}%`}
          />
          <Detail.Metadata.Label title="Hue" text={`${metadata.hue}°`} />
          <Detail.Metadata.Label
            title="Saturation"
            text={`${metadata.saturation}%`}
          />
          <Detail.Metadata.Label
            title="Lightness"
            text={`${metadata.lightness}%`}
          />
          <Detail.Metadata.Label
            title="Luminance"
            text={metadata.luminance.toFixed(3)}
          />
          {color.token ? (
            <>
              <Detail.Metadata.Separator />
              <Detail.Metadata.Label title="Token" text={color.token} />
            </>
          ) : null}
        </Detail.Metadata>
      }
      actions={
        <ActionPanel>
          <ActionPanel.Section>
            <Action.CopyToClipboard
              title="Copy Color"
              content={metadata.cssValue}
              shortcut={Keyboard.Shortcut.Common.Copy}
            />
            <Action.Paste
              title="Paste Color"
              content={metadata.cssValue}
              shortcut={{ modifiers: ["cmd"], key: "v" }}
            />
          </ActionPanel.Section>
          <ActionPanel.Section title="Copy As">
            {metadata.hexValue ? (
              <Action.CopyToClipboard
                title="Copy HEX"
                content={metadata.hexValue}
                shortcut={{ modifiers: ["cmd", "shift"], key: "h" }}
              />
            ) : null}
            <Action.CopyToClipboard
              title="Copy RGB/RGBA"
              content={metadata.rgbValue}
              shortcut={{ modifiers: ["cmd", "shift"], key: "r" }}
            />
            {color.token ? (
              <Action.CopyToClipboard
                title="Copy CSS Variable"
                content={`var(${color.token})`}
                shortcut={{ modifiers: ["cmd", "shift"], key: "v" }}
              />
            ) : null}
          </ActionPanel.Section>
          <ActionPanel.Section title="Organize">
            <Action
              icon={isPinned ? Icon.PinDisabled : Icon.Pin}
              title={isPinned ? "Unpin Color" : "Pin Color"}
              shortcut={{ modifiers: ["cmd", "shift"], key: "p" }}
              onAction={() => void onTogglePin(color)}
            />
          </ActionPanel.Section>
          {canManageColorJson ? (
            <ActionPanel.Section title="colors.json">
              <Action.Push
                icon={Icon.Plus}
                title="Add Color"
                target={
                  <ColorForm onSubmit={onSubmit} categories={categories} />
                }
                shortcut={Keyboard.Shortcut.Common.New}
              />
              <Action.Push
                icon={Icon.Pencil}
                title="Edit Color"
                target={
                  <ColorForm
                    color={color}
                    onSubmit={onSubmit}
                    categories={categories}
                  />
                }
                shortcut={Keyboard.Shortcut.Common.Edit}
              />
              <Action
                icon={Icon.Trash}
                title="Delete Color"
                style={Action.Style.Destructive}
                onAction={() => {
                  void onDelete(color).then(pop);
                }}
                shortcut={Keyboard.Shortcut.Common.Remove}
              />
            </ActionPanel.Section>
          ) : null}
        </ActionPanel>
      }
    />
  );
}

function ColorForm({
  color,
  categories,
  onSubmit,
}: {
  color?: ColorAsset;
  categories: string[];
  onSubmit: (
    input: CustomColorInput,
    existingColor?: ColorAsset,
  ) => Promise<void>;
}) {
  const { pop } = useNavigation();
  const [nameError, setNameError] = useState<string>();
  const [categoryError, setCategoryError] = useState<string>();
  const [valueError, setValueError] = useState<string>();
  const defaultCategory = color?.category ?? categories[0] ?? "Brand";

  async function handleSubmit(values: CustomColorInput) {
    const name = values.name.trim();
    const category = values.category.trim();
    const value = values.value.trim();

    setNameError(name ? undefined : "Name is required");
    setCategoryError(category ? undefined : "Category is required");
    setValueError(value ? undefined : "Color value is required");

    if (!name || !category || !value) {
      return;
    }

    try {
      await onSubmit(
        {
          name,
          category,
          subcategory: values.subcategory,
          value,
          token: values.token,
        },
        color,
      );
      pop();
    } catch (error) {
      setValueError(
        error instanceof Error ? error.message : "Invalid color value",
      );
    }
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title={color ? "Save Color" : "Add Color"}
            shortcut={Keyboard.Shortcut.Common.Save}
            onSubmit={handleSubmit}
          />
        </ActionPanel>
      }
    >
      <Form.TextField
        id="name"
        title="Name"
        defaultValue={color?.name}
        error={nameError}
        onChange={() => setNameError(undefined)}
      />
      <Form.TextField
        id="category"
        title="Category"
        defaultValue={defaultCategory}
        error={categoryError}
        onChange={() => setCategoryError(undefined)}
      />
      <Form.TextField
        id="subcategory"
        title="Subcategory"
        placeholder="Optional"
        defaultValue={color?.subcategory}
      />
      <Form.TextField
        id="value"
        title="Value"
        placeholder="#1B6AEE or rgba(0, 15, 30, 0.4)"
        defaultValue={color ? colorValueToCss(color.value) : undefined}
        error={valueError}
        onChange={() => setValueError(undefined)}
      />
      <Form.TextField
        id="token"
        title="Token"
        placeholder="Optional CSS variable name"
        defaultValue={color?.token}
      />
    </Form>
  );
}

function emptyTitle(hasRootFolder: boolean, errors: string[]): string {
  if (!hasRootFolder) {
    return "Select a library folder";
  }

  return errors.length > 0 ? "Invalid colors.json" : "No colors found";
}

function emptyDescription(
  hasRootFolder: boolean,
  colorsFilePath: string | undefined,
  errors: string[],
  selectedView: ColorViewFilter,
): string {
  if (!hasRootFolder) {
    return "Set the Library Folder preference. The Colors command reads colors.json from that folder.";
  }

  if (errors.length > 0) {
    return errors.slice(0, 3).join("\n");
  }

  if (selectedView !== "all") {
    return `No colors match the current ${selectedView} filter.`;
  }

  return colorsFilePath
    ? `Add colors to ${colorsFilePath}.`
    : "Create colors.json in the library folder.";
}

function colorListIcon(color: ColorAsset): {
  source: Icon;
  tintColor: string;
} {
  return {
    source: Icon.CircleFilled,
    tintColor: colorValueToGridColor(color.value),
  };
}

function colorAccessories(
  color: ColorAsset,
  metadata: ColorMetadata,
  isShowingDetail: boolean,
): List.Item.Accessory[] {
  if (isShowingDetail) {
    return [];
  }

  const accessories: List.Item.Accessory[] = [
    { text: metadata.categoryPath },
    { text: metadata.hexValue ?? metadata.rgbValue },
  ];

  if (color.token) {
    accessories.unshift({
      tag: { value: "Token", color: Color.Blue },
    });
  }

  return accessories;
}

function gridAccessory(color: ColorAsset): Grid.Item.Accessory | undefined {
  if (color.token) {
    return {
      icon: { source: Icon.Code, tintColor: Color.Blue },
      tooltip: "Has token",
    };
  }

  return undefined;
}
function getColorGridColumns(): number {
  const { colorGridColumns } = getPreferenceValues<ColorCommandPreferences>();
  const columns = Number(colorGridColumns ?? 8);
  return Number.isFinite(columns) ? columns : 8;
}

function getDefaultColorViewMode(): ColorViewMode {
  const { colorDefaultView } = getPreferenceValues<ColorCommandPreferences>();
  return colorDefaultView === "list" ? "list" : "grid";
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
