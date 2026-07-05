import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { LiquidPanel } from "../../../src/components/LiquidPanel";
import { FluidThemeProvider } from "../../../src/theme";
import type { FluidTheme } from "../../../src/theme";

/**
 * Theme overlay wiring for LiquidPanel: a mounted FluidThemeProvider themes
 * the surface (derived glass tint, flat fill, radius) and explicit props
 * keep winning. jsdom reports no backdrop-filter support, so glass renders
 * the degraded flat fallback — which still carries the tint. jsdom reports
 * reduced motion as unknown (→ reduced), so the panel renders its static
 * at-rest scene.
 */

const SIZE = { width: 300, height: 200 };

/** Theme WITHOUT material: glass stays the default, so the tint derives. */
const TINT_THEME: FluidTheme = { accent: "#2D6A4F", surface: "#F4F3F0", radius: 10 };
const FLAT_THEME: FluidTheme = { ...TINT_THEME, material: "flat" };

const themedRender = (theme: FluidTheme, ui: ReactElement) =>
  render(<FluidThemeProvider theme={theme}>{ui}</FluidThemeProvider>);

/** jsdom normalizes the accent hex inside color-mix() to rgb() form. */
const ACCENT_TINT = /color-mix\(in srgb, (#2D6A4F|rgb\(45, 106, 79\))/;

const fillOf = (container: HTMLElement) =>
  container.querySelector('[data-fluidkit="liquid-fill"]') as HTMLElement;

describe("LiquidPanel themed by FluidThemeProvider", () => {
  let restoreSizes: () => void;

  beforeEach(() => {
    // The panel measures its own box; jsdom has neither ResizeObserver nor
    // layout, so stub the observer and pin the measured size.
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      }
    );
    const widthSpy = vi
      .spyOn(HTMLElement.prototype, "offsetWidth", "get")
      .mockReturnValue(SIZE.width);
    const heightSpy = vi
      .spyOn(HTMLElement.prototype, "offsetHeight", "get")
      .mockReturnValue(SIZE.height);
    restoreSizes = () => {
      widthSpy.mockRestore();
      heightSpy.mockRestore();
    };
  });

  afterEach(() => {
    restoreSizes();
    vi.unstubAllGlobals();
  });

  it("derives the glass tint from the theme accent", () => {
    const { container } = themedRender(
      TINT_THEME,
      <LiquidPanel open>content</LiquidPanel>
    );
    expect(fillOf(container)).not.toBeNull();
    expect(container.innerHTML).toMatch(ACCENT_TINT);
  });

  it("fills the flat material with the theme surface color", () => {
    const { container } = themedRender(
      FLAT_THEME,
      <LiquidPanel open>content</LiquidPanel>
    );
    expect(fillOf(container).style.background).toBe("rgb(244, 243, 240)");
  });

  it("applies the theme radius to the rim border-radius", () => {
    const { container } = themedRender(
      { radius: 10 },
      <LiquidPanel open>content</LiquidPanel>
    );
    const glow = container.querySelector(
      '[data-fluidkit="liquid-panel-glow"]'
    ) as HTMLElement;
    expect(glow).not.toBeNull();
    expect(glow.style.borderRadius).toBe("10px");
  });

  it("lets an explicit tint beat the themed tint", () => {
    const { container } = themedRender(
      TINT_THEME,
      <LiquidPanel open tint="rgba(10, 20, 30, 0.4)">
        content
      </LiquidPanel>
    );
    expect(fillOf(container).style.background).toBe("rgba(10, 20, 30, 0.4)");
    expect(container.innerHTML).not.toContain("color-mix");
  });

  it("lets an explicit material beat the themed material", () => {
    const { container } = themedRender(
      FLAT_THEME,
      <LiquidPanel open material="glass">
        content
      </LiquidPanel>
    );
    // Glass carries the derived accent tint; the themed flat fill loses.
    expect(container.innerHTML).toMatch(ACCENT_TINT);
    expect(fillOf(container).style.background).not.toBe("rgb(244, 243, 240)");
  });
});
