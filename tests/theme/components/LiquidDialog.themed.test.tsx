import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { LiquidDialog } from "../../../src/components/LiquidDialog";
import { FluidThemeProvider } from "../../../src/theme";
import type { FluidTheme } from "../../../src/theme";

/**
 * Theme overlay wiring for LiquidDialog: a mounted FluidThemeProvider themes
 * the surface (derived glass tint, flat fill, radius) and explicit props
 * keep winning. The dialog portals to `document.body`, so assertions query
 * `document.body` rather than the RTL container (per LiquidDialog.test.tsx).
 * jsdom reports no backdrop-filter support, so glass renders the degraded
 * flat fallback — which still carries the tint.
 */

const SIZE = { width: 300, height: 200 };

/** Theme WITHOUT material: glass stays the default, so the tint derives. */
const TINT_THEME: FluidTheme = { accent: "#2D6A4F", surface: "#F4F3F0", radius: 10 };
const FLAT_THEME: FluidTheme = { ...TINT_THEME, material: "flat" };

const themedRender = (theme: FluidTheme, ui: ReactElement) =>
  render(<FluidThemeProvider theme={theme}>{ui}</FluidThemeProvider>);

/** jsdom normalizes the accent hex inside color-mix() to rgb() form. */
const ACCENT_TINT = /color-mix\(in srgb, (#2D6A4F|rgb\(45, 106, 79\))/;

const fillOf = () =>
  document.body.querySelector('[data-fluidkit="liquid-fill"]') as HTMLElement;

describe("LiquidDialog themed by FluidThemeProvider", () => {
  let restoreSizes: () => void;

  beforeEach(() => {
    // The dialog box measures itself; jsdom has neither ResizeObserver nor
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
    themedRender(TINT_THEME, <LiquidDialog open>hello</LiquidDialog>);
    expect(fillOf()).not.toBeNull();
    expect(document.body.innerHTML).toMatch(ACCENT_TINT);
  });

  it("fills the flat material with the theme surface color", () => {
    themedRender(FLAT_THEME, <LiquidDialog open>hello</LiquidDialog>);
    expect(fillOf().style.background).toBe("rgb(244, 243, 240)");
  });

  it("applies the theme radius to the rim border-radius", () => {
    themedRender({ radius: 10 }, <LiquidDialog open>hello</LiquidDialog>);
    const glow = document.body.querySelector(
      '[data-fluidkit="liquid-dialog-glow"]'
    ) as HTMLElement;
    expect(glow).not.toBeNull();
    expect(glow.style.borderRadius).toBe("10px");
  });

  it("lets an explicit tint beat the themed tint", () => {
    themedRender(
      TINT_THEME,
      <LiquidDialog open tint="rgba(10, 20, 30, 0.4)">
        hello
      </LiquidDialog>
    );
    expect(fillOf().style.background).toBe("rgba(10, 20, 30, 0.4)");
    expect(document.body.innerHTML).not.toContain("color-mix");
  });

  it("lets an explicit material beat the themed material", () => {
    themedRender(
      FLAT_THEME,
      <LiquidDialog open material="glass">
        hello
      </LiquidDialog>
    );
    // Glass carries the derived accent tint; the themed flat fill loses.
    expect(document.body.innerHTML).toMatch(ACCENT_TINT);
    expect(fillOf().style.background).not.toBe("rgb(244, 243, 240)");
  });
});
