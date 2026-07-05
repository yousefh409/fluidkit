import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render } from "@testing-library/react";
import type { ReactElement } from "react";
import { FluidThemeProvider } from "../../../src/theme";
import type { FluidTheme } from "../../../src/theme";
import { LiquidToastProvider, toast } from "../../../src/components/LiquidToast";

/**
 * Theme overlay wiring for LiquidToast: the toast's identity is NEAR-SOLID
 * (it sits over unknown content), so its themed tint derives from the brand
 * SURFACE at an 88% share — not from the accent — and the message ink pairs
 * with that fill via the LiquidButton rule (readableInk on flat, brand
 * `text` on glass). Toasts portal onto the overlay layer, so queries go
 * through `document`.
 */

const SIZE = { width: 260, height: 48 };

const themedRender = (theme: FluidTheme, ui: ReactElement) =>
  render(<FluidThemeProvider theme={theme}>{ui}</FluidThemeProvider>);

const fire = (message: string) => {
  act(() => {
    toast(message, { duration: 0 });
  });
};

const toastFill = () =>
  document.querySelector(
    '[data-fluidkit="liquid-toast"] [data-fluidkit="liquid-fill"]'
  ) as HTMLElement;

const toastContent = () =>
  document.querySelector(
    '[data-fluidkit="liquid-toast-content"]'
  ) as HTMLElement;

describe("LiquidToast themed by FluidThemeProvider", () => {
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

  it("derives the near-solid tint from the brand SURFACE at 88%", () => {
    themedRender(
      { surface: "#F4F3F0", text: "#14151A" },
      <LiquidToastProvider>app</LiquidToastProvider>
    );
    fire("Saved");
    expect(toastFill().style.background).toContain(
      "color-mix(in srgb, rgb(244, 243, 240) 88%"
    );
  });

  it("a dark-surface brand keeps a dark toast with readable light ink", () => {
    themedRender(
      { surface: "#17181C", text: "#F2F3F7", material: "flat" },
      <LiquidToastProvider>app</LiquidToastProvider>
    );
    fire("Saved");
    // Flat fill = brand surface; ink computed FROM the fill (readableInk).
    expect(toastFill().style.background).toBe("rgb(23, 24, 28)");
    expect(toastContent().style.color).toBe("rgb(255, 255, 255)");
  });

  it("glass message ink follows the brand text color", () => {
    themedRender(
      { surface: "#F4F3F0", text: "#14151A" },
      <LiquidToastProvider>app</LiquidToastProvider>
    );
    fire("Saved");
    expect(toastContent().style.color).toBe("rgb(20, 21, 26)");
  });

  it("an accent-only theme derives nothing: the near-solid white default holds", () => {
    themedRender(
      { accent: "#2D6A4F" },
      <LiquidToastProvider>app</LiquidToastProvider>
    );
    fire("Saved");
    expect(toastFill().style.background).toBe("rgba(255, 255, 255, 0.82)");
  });

  it("an explicit tint prop beats the themed surface tint", () => {
    themedRender(
      { surface: "#F4F3F0" },
      <LiquidToastProvider tint="rgba(10, 20, 30, 0.9)">app</LiquidToastProvider>
    );
    fire("Saved");
    expect(toastFill().style.background).toBe("rgba(10, 20, 30, 0.9)");
  });

  it("no provider: default fill, and the message inherits (no ink forced)", () => {
    render(<LiquidToastProvider>app</LiquidToastProvider>);
    fire("Saved");
    expect(toastFill().style.background).toBe("rgba(255, 255, 255, 0.82)");
    expect(toastContent().style.color).toBe("");
  });
});
