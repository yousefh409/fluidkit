import { afterEach, describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { FluidThemeProvider } from "../../../src/theme";
import { LiquidText } from "../../../src/components/LiquidText";

/**
 * jsdom answers no to `supportsBackdropFilter()` and `background-clip:
 * text`, so LiquidText renders its flat path where the glyph fill is
 * literally `color` on the wrapper — exactly where the theme's `text`
 * token (derived as `themed.color`) must land.
 */
const wrapperOf = (container: HTMLElement) =>
  container.querySelector('[data-fluidkit="liquid-text"]') as HTMLElement;

describe("LiquidText theming", () => {
  afterEach(() => {
    document.getElementById("fluidkit-liquid-text-keyframes")?.remove();
  });

  it("a mounted theme's text token becomes the glyph color", () => {
    const { container } = render(
      <FluidThemeProvider theme={{ text: "#14151A" }}>
        <LiquidText>Liquid type</LiquidText>
      </FluidThemeProvider>
    );
    expect(wrapperOf(container).style.color).toBe("rgb(20, 21, 26)");
  });

  it("an explicit color prop beats the theme's text token", () => {
    const { container } = render(
      <FluidThemeProvider theme={{ text: "#14151A" }}>
        <LiquidText color="#123456">Liquid type</LiquidText>
      </FluidThemeProvider>
    );
    expect(wrapperOf(container).style.color).toBe("rgb(18, 52, 86)");
  });

  it("no provider: the glyphs keep the unthemed default color", () => {
    const { container } = render(<LiquidText>Liquid type</LiquidText>);
    // The built-in #23242c default, untouched by any theme.
    expect(wrapperOf(container).style.color).toBe("rgb(35, 36, 44)");
  });
});
