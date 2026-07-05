import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { FluidThemeProvider } from "../../../src/theme";
import type { FluidTheme } from "../../../src/theme";
import { LiquidField } from "../../../src/components/LiquidField";

/**
 * Theme overlay wiring for LiquidField: the surface behind the input tints
 * quietly from the accent (10% — the quietest container), fills flat from
 * the brand surface, and takes the theme radius. The field measures its
 * own box, so jsdom needs the LiquidCard test's ResizeObserver/size stubs.
 */

const SIZE = { width: 280, height: 44 };
const TINT_THEME: FluidTheme = { accent: "#2D6A4F", surface: "#F4F3F0", radius: 10 };

const themedRender = (theme: FluidTheme, ui: ReactElement) =>
  render(<FluidThemeProvider theme={theme}>{ui}</FluidThemeProvider>);

const fillOf = (container: HTMLElement) =>
  container.querySelector('[data-fluidkit="liquid-fill"]') as HTMLElement;

describe("LiquidField themed by FluidThemeProvider", () => {
  let restoreSizes: () => void;

  beforeEach(() => {
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

  it("derives a whisper-quiet 10% accent tint for the glass surface", () => {
    const { container } = themedRender(
      TINT_THEME,
      <LiquidField label="Name" placeholder="Jane" />
    );
    expect(fillOf(container).style.background).toContain(
      "color-mix(in srgb, rgb(45, 106, 79) 10%"
    );
  });

  it("fills the flat material with the theme surface color", () => {
    const { container } = themedRender(
      { ...TINT_THEME, material: "flat" },
      <LiquidField label="Name" />
    );
    expect(fillOf(container).style.background).toBe("rgb(244, 243, 240)");
  });

  it("applies the theme radius to the rim border-radius", () => {
    const { container } = themedRender({ radius: 10 }, <LiquidField />);
    const glow = container.querySelector(
      '[data-fluidkit="liquid-field-glow"]'
    ) as HTMLElement;
    expect(glow).not.toBeNull();
    expect(glow.style.borderRadius).toBe("10px");
  });

  it("lets an explicit tint beat the themed tint", () => {
    const { container } = themedRender(
      TINT_THEME,
      <LiquidField tint="rgba(10, 20, 30, 0.4)" />
    );
    expect(fillOf(container).style.background).toBe("rgba(10, 20, 30, 0.4)");
    expect(container.innerHTML).not.toContain("color-mix");
  });

  it("no provider: the fill keeps the unthemed glass fallback", () => {
    const { container } = render(<LiquidField />);
    expect(fillOf(container).style.background).toBe(
      "rgba(255, 255, 255, 0.65)"
    );
  });
});
