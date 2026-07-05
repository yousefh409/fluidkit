import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { FluidThemeProvider } from "../../../src/theme";
import { LiquidCheckbox } from "../../../src/components/LiquidCheckbox";

/**
 * Theme overlay wiring for LiquidCheckbox: the checked pool rides the
 * shared `tint`/`color` props (no dedicated state-fill prop), so the theme
 * accent arrives through them — a strong 45% glass share, or the raw
 * accent as the flat pool fill. Renderer order: well first, pool second.
 * jsdom normalizes the hex inside color-mix() to rgb() form.
 */

const fillsOf = (container: HTMLElement) =>
  container.querySelectorAll<HTMLElement>('[data-fluidkit="liquid-fill"]');

describe("LiquidCheckbox themed by FluidThemeProvider", () => {
  it("the glass pool tints from the accent at a strong 45% share", () => {
    const { container } = render(
      <FluidThemeProvider theme={{ accent: "#2D6A4F" }}>
        <LiquidCheckbox defaultChecked label="Subscribe" />
      </FluidThemeProvider>
    );
    expect(fillsOf(container)[1].style.background).toContain(
      "color-mix(in srgb, rgb(45, 106, 79) 45%"
    );
  });

  it("a flat theme fills the pool with the raw accent", () => {
    const { container } = render(
      <FluidThemeProvider theme={{ accent: "#2D6A4F", material: "flat", surface: "#F4F3F0" }}>
        <LiquidCheckbox defaultChecked />
      </FluidThemeProvider>
    );
    expect(fillsOf(container)[1].style.background).toBe("rgb(45, 106, 79)");
  });

  it("the well stays neutral under a theme — the pool must read against it", () => {
    const { container } = render(
      <FluidThemeProvider theme={{ accent: "#2D6A4F" }}>
        <LiquidCheckbox defaultChecked />
      </FluidThemeProvider>
    );
    expect(fillsOf(container)[0].style.background).toBe(
      "rgba(120, 128, 150, 0.22)"
    );
  });

  it("an explicit tint beats the theme's derived pool tint", () => {
    const { container } = render(
      <FluidThemeProvider theme={{ accent: "#2D6A4F" }}>
        <LiquidCheckbox defaultChecked tint="rgba(10, 20, 30, 0.4)" />
      </FluidThemeProvider>
    );
    expect(fillsOf(container)[1].style.background).toBe("rgba(10, 20, 30, 0.4)");
  });

  it("no provider: the pool keeps the unthemed glass fallback", () => {
    const { container } = render(<LiquidCheckbox defaultChecked />);
    expect(fillsOf(container)[1].style.background).toBe(
      "rgba(255, 255, 255, 0.65)"
    );
  });
});
