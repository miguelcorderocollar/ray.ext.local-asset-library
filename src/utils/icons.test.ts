import { describe, expect, it } from "vitest";

import { addSvgColorFallback } from "../features/icons/svg";

describe("addSvgColorFallback", () => {
  it("injects a black root color when currentColor has no fallback", () => {
    const input =
      '<svg viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor"/></svg>';

    expect(addSvgColorFallback(input)).toContain('color="#000000"');
  });

  it("does not rewrite svg markup when a color is already defined", () => {
    const input =
      '<svg color="#ff0000" viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor"/></svg>';

    expect(addSvgColorFallback(input)).toBe(input);
  });

  it("does not touch svg markup that does not use currentColor", () => {
    const input =
      '<svg viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg"><path fill="#111111"/></svg>';

    expect(addSvgColorFallback(input)).toBe(input);
  });
});
