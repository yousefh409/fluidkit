import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render } from "@testing-library/react";
import { FluidThemeProvider } from "../../../src/theme";
import { LiquidTooltip } from "../../../src/components/LiquidTooltip";

/**
 * jsdom has no `CSS.supports`, so the glass material degrades to its
 * fallback fill — `background` carries the tint directly, which is exactly
 * where the theme's accent-derived `color-mix()` must land. jsdom also
 * normalizes hex colors inside `color-mix()` to `rgb()`:
 * #2D6A4F → rgb(45, 106, 79).
 */
const ACCENT_MIX = "color-mix(in srgb, rgb(45, 106, 79)";

const fillOf = (container: HTMLElement) =>
  container.querySelector('[data-fluidkit="liquid-fill"]') as HTMLElement;

/** Focus shows the tooltip without delay (same pattern as the component tests). */
function showTooltip(getByText: (text: string) => HTMLElement) {
  fireEvent.focus(getByText("trigger"));
}

describe("LiquidTooltip theming", () => {
  beforeEach(() => {
    // The droplet sizes itself off the measured label; jsdom has neither
    // ResizeObserver nor layout, so stub the observer and pin the size.
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      }
    );
    vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(80);
    vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(24);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("a mounted theme's accent tints the default glass fill (18% share)", () => {
    const { container, getByText } = render(
      <FluidThemeProvider theme={{ accent: "#2D6A4F" }}>
        <LiquidTooltip content="hi">
          <span tabIndex={0}>trigger</span>
        </LiquidTooltip>
      </FluidThemeProvider>
    );
    showTooltip(getByText);
    expect(fillOf(container).style.background).toContain(`${ACCENT_MIX} 18%`);
  });

  it("an explicit tint prop beats the theme's derived tint", () => {
    const { container, getByText } = render(
      <FluidThemeProvider theme={{ accent: "#2D6A4F" }}>
        <LiquidTooltip content="hi" tint="rgba(200, 220, 255, 0.4)">
          <span tabIndex={0}>trigger</span>
        </LiquidTooltip>
      </FluidThemeProvider>
    );
    showTooltip(getByText);
    expect(fillOf(container).style.background).toBe("rgba(200, 220, 255, 0.4)");
  });

  it("explicit material/color beat the theme's material and surface", () => {
    const { container, getByText } = render(
      <FluidThemeProvider
        theme={{ accent: "#2D6A4F", material: "glass", surface: "#101010" }}
      >
        <LiquidTooltip content="hi" material="flat" color="rgb(1, 2, 3)">
          <span tabIndex={0}>trigger</span>
        </LiquidTooltip>
      </FluidThemeProvider>
    );
    showTooltip(getByText);
    expect(fillOf(container).style.background).toBe("rgb(1, 2, 3)");
  });

  it("no provider: the fill keeps the unthemed default", () => {
    const { container, getByText } = render(
      <LiquidTooltip content="hi">
        <span tabIndex={0}>trigger</span>
      </LiquidTooltip>
    );
    showTooltip(getByText);
    // The glass fallback fill (jsdom path) — no theme contribution anywhere.
    expect(fillOf(container).style.background).toBe(
      "rgba(255, 255, 255, 0.65)"
    );
  });
});
