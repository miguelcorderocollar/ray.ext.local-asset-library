import { describe, expect, it } from "vitest";

import { serializeColorsJson, parseColorsJson } from "./json";

describe("colors json", () => {
  it("parses valid colors and assigns stable duplicate ids", () => {
    const result = parseColorsJson(`{
      "colors": [
        { "name": "Primary", "category": "Brand", "value": "#1B6AEE" },
        { "name": "Primary", "category": "Brand", "value": "#1B6AEE" }
      ]
    }`);

    expect(result.errors).toEqual([]);
    expect(result.colors.map((color) => color.id)).toEqual([
      "json-brand-primary-1b6aee",
      "json-brand-primary-1b6aee-2",
    ]);
  });

  it("reports exact entry paths for invalid values", () => {
    const result = parseColorsJson(`{
      "colors": [
        { "name": "Primary", "category": "Brand", "value": "blue" }
      ]
    }`);

    expect(result.colors).toEqual([]);
    expect(result.errors[0]).toContain("colors.json.colors[0].value");
  });

  it("serializes colors with a trailing newline", () => {
    const parsed = parseColorsJson(`{
      "colors": [
        { "name": "Primary", "category": "Brand", "value": "rgba(27, 106, 238, 1)" }
      ]
    }`);

    expect(serializeColorsJson(parsed.colors)).toBe(`{
  "colors": [
    {
      "name": "Primary",
      "category": "Brand",
      "value": "rgba(27, 106, 238, 1)"
    }
  ]
}
`);
  });
});
