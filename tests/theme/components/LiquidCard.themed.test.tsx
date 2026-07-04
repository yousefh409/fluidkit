import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { LiquidCard } from "../../../src/components/LiquidCard";
import { FluidThemeProvider } from "../../../src/theme";
import type { FluidTheme } from "../../../src/theme";

/**
 * Theme overlay wiring for LiquidCard: a mounted FluidThemeProvider themes
 * the surface (derived glass tint, flat fill, radius), explicit props and
 * semantic variants keep winning. jsdom reports no backdrop-filter support,
 * so `material="glass"` renders the degraded flat fallback — which still
 * carries the tint, so tint assertions hold without mocking featureDetect.
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

describe("LiquidCard themed by FluidThemeProvider", () => {
  let restoreSizes: () => void;

  beforeEach(() => {
    // The card measures its own box; jsdom has neither ResizeObserver nor
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
      <LiquidCard>content</LiquidCard>
    );
    expect(fillOf(container)).not.toBeNull();
    expect(container.innerHTML).toMatch(ACCENT_TINT);
  });

  it("fills the flat material with the theme surface color", () => {
    const { container } = themedRender(
      FLAT_THEME,
      <LiquidCard>content</LiquidCard>
    );
    expect(fillOf(container).style.background).toBe("rgb(244, 243, 240)");
  });

  it("applies the theme radius to the rim border-radius", () => {
    const { container } = themedRender(
      { radius: 10 },
      <LiquidCard>content</LiquidCard>
    );
    const glow = container.querySelector(
      '[data-fluidkit="liquid-card-glow"]'
    ) as HTMLElement;
    expect(glow).not.toBeNull();
    expect(glow.style.borderRadius).toBe("10px");
  });

  it("lets an explicit tint beat the themed tint", () => {
    const { container } = themedRender(
      TINT_THEME,
      <LiquidCard tint="rgba(10, 20, 30, 0.4)">content</LiquidCard>
    );
    expect(fillOf(container).style.background).toBe("rgba(10, 20, 30, 0.4)");
    expect(container.innerHTML).not.toContain("color-mix");
  });

  it("lets an explicit material beat the themed material", () => {
    const { container } = themedRender(
      FLAT_THEME,
      <LiquidCard material="glass">content</LiquidCard>
    );
    // Glass carries the derived accent tint; the themed flat fill loses.
    expect(container.innerHTML).toMatch(ACCENT_TINT);
    expect(fillOf(container).style.background).not.toBe("rgb(244, 243, 240)");
  });

  it("keeps an explicit variant's semantic tint under a theme with accent", () => {
    const { container } = themedRender(
      TINT_THEME,
      <LiquidCard variant="info">content</LiquidCard>
    );
    expect(fillOf(container).style.background).toBe("rgba(96, 149, 255, 0.2)");
    expect(container.innerHTML).not.toContain("color-mix");
  });
});
