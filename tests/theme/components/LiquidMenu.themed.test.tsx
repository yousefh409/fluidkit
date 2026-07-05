import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { FluidThemeProvider } from "../../../src/theme";
import type { FluidTheme } from "../../../src/theme";
import { LiquidMenu } from "../../../src/components/LiquidMenu";

/**
 * Theme overlay wiring for LiquidMenu: the poured surface tints quietly
 * from the accent (12%), fills flat from the brand surface, and takes the
 * theme radius. The menu portals onto the shared overlay layer, so queries
 * go through `document` rather than the render container. jsdom reports
 * reduced motion (unknown → static-safe), so the menu renders fully poured.
 */

const SIZE = { width: 220, height: 160 };
const TINT_THEME: FluidTheme = { accent: "#2D6A4F", surface: "#F4F3F0", radius: 10 };

const ITEMS = [{ label: "Rename" }, { label: "Delete" }];

const themedRender = (theme: FluidTheme, ui: ReactElement) =>
  render(<FluidThemeProvider theme={theme}>{ui}</FluidThemeProvider>);

const openMenu = () => {
  act(() => {
    fireEvent.click(screen.getByText("Options"));
  });
};

const menuFill = () =>
  document.querySelector(
    '[data-fluidkit="liquid-menu"] [data-fluidkit="liquid-fill"]'
  ) as HTMLElement;

describe("LiquidMenu themed by FluidThemeProvider", () => {
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

  it("derives a quiet 12% accent tint for the poured glass", () => {
    themedRender(
      TINT_THEME,
      <LiquidMenu trigger={<button>Options</button>} items={ITEMS} />
    );
    openMenu();
    expect(menuFill().style.background).toContain(
      "color-mix(in srgb, rgb(45, 106, 79) 12%"
    );
  });

  it("fills the flat material with the theme surface color", () => {
    themedRender(
      { ...TINT_THEME, material: "flat" },
      <LiquidMenu trigger={<button>Options</button>} items={ITEMS} />
    );
    openMenu();
    expect(menuFill().style.background).toBe("rgb(244, 243, 240)");
  });

  it("applies the theme radius to the rim border-radius", () => {
    themedRender(
      { radius: 10 },
      <LiquidMenu trigger={<button>Options</button>} items={ITEMS} />
    );
    openMenu();
    const glow = document.querySelector(
      '[data-fluidkit="liquid-menu-glow"]'
    ) as HTMLElement;
    expect(glow).not.toBeNull();
    expect(glow.style.borderRadius).toBe("10px");
  });

  it("lets an explicit tint beat the themed tint", () => {
    themedRender(
      TINT_THEME,
      <LiquidMenu
        trigger={<button>Options</button>}
        items={ITEMS}
        tint="rgba(10, 20, 30, 0.4)"
      />
    );
    openMenu();
    expect(menuFill().style.background).toBe("rgba(10, 20, 30, 0.4)");
  });

  it("no provider: the fill keeps the unthemed glass fallback", () => {
    render(<LiquidMenu trigger={<button>Options</button>} items={ITEMS} />);
    openMenu();
    expect(menuFill().style.background).toBe("rgba(255, 255, 255, 0.65)");
  });
});
