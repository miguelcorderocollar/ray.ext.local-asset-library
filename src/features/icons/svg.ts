export function addSvgColorFallback(svgMarkup: string): string {
  if (!/\bcurrentColor\b/i.test(svgMarkup)) {
    return svgMarkup;
  }

  if (hasExplicitSvgColor(svgMarkup)) {
    return svgMarkup;
  }

  return svgMarkup.replace(/<svg\b([^>]*)>/i, '<svg$1 color="#000000">');
}

function hasExplicitSvgColor(svgMarkup: string): boolean {
  return (
    /\scolor\s*=\s*(['"])[\s\S]*?\1/i.test(svgMarkup) ||
    /style\s*=\s*(['"])[\s\S]*?\bcolor\s*:/i.test(svgMarkup) ||
    /<style\b[^>]*>[\s\S]*?\bcolor\s*:/i.test(svgMarkup)
  );
}
