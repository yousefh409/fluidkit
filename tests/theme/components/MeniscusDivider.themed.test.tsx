import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { FluidThemeProvider } from "../../../src/theme";
import { MeniscusDivider } from "../../../src/components/MeniscusDivider";

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

describe("MeniscusDivider theming", () => {
  beforeEach(() => {
    // The divider measures its own box; jsdom has neither ResizeObserver nor
    // layout, so stub the observer and pin the measured width.
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      }
    );
    vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(300);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("a mounted theme's accent tints the default glass bead (14% share)", () => {
    const { container } = render(
      <FluidThemeProvider theme={{ accent: "#2D6A4F" }}>
        <MeniscusDivider />
      </FluidThemeProvider>
    );
    expect(fillOf(container).style.background).toContain(`${ACCENT_MIX} 14%`);
  });

  it("an explicit tint prop beats the theme's derived tint", () => {
    const { container } = render(
      <FluidThemeProvider theme={{ accent: "#2D6A4F" }}>
        <MeniscusDivider tint="rgba(200, 220, 255, 0.4)" />
      </FluidThemeProvider>
    );
    expect(fillOf(container).style.background).toBe("rgba(200, 220, 255, 0.4)");
  });

  it("explicit material/color beat the theme's material and surface", () => {
    const { container } = render(
      <FluidThemeProvider
        theme={{ accent: "#2D6A4F", material: "glass", surface: "#101010" }}
      >
        <MeniscusDivider material="flat" color="rgb(1, 2, 3)" />
      </FluidThemeProvider>
    );
    expect(fillOf(container).style.background).toBe("rgb(1, 2, 3)");
  });

  it("no provider: the bead keeps the unthemed default fill", () => {
    const { container } = render(<MeniscusDivider />);
    // The glass fallback fill (jsdom path) — no theme contribution anywhere.
    expect(fillOf(container).style.background).toBe(
      "rgba(255, 255, 255, 0.65)"
    );
  });
});
