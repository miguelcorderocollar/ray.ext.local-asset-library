import { LocalStorage } from "@raycast/api";

export async function loadPinnedKeys(
  storageKey: string,
  legacyStorageKey?: string,
): Promise<string[]> {
  const stored = await LocalStorage.getItem<string>(storageKey);
  const legacyStored =
    stored === undefined && legacyStorageKey
      ? await LocalStorage.getItem<string>(legacyStorageKey)
      : undefined;
  const keys = parseStoredKeys(stored ?? legacyStored);

  if (stored === undefined && legacyStored !== undefined) {
    await LocalStorage.setItem(storageKey, JSON.stringify(keys));
  }

  return keys;
}

export async function persistPinnedKeys(
  storageKey: string,
  keys: string[],
): Promise<void> {
  await LocalStorage.setItem(storageKey, JSON.stringify(keys));
}

export function parseStoredKeys(storedValue: string | undefined): string[] {
  if (!storedValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(storedValue) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === "string")
      : [];
  } catch {
    return [];
  }
}
