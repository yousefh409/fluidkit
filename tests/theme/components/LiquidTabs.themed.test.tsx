import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { FluidThemeProvider } from "../../../src/theme";
import { LiquidTabs } from "../../../src/components/tabs/LiquidTabs";

/**
 * jsdom has no `CSS.supports`, so the glass material degrades to its
 * fallback fill — `background` carries the tint directly, which is exactly
 * where the theme's accent-derived `color-mix()` must land. jsdom also
 * normalizes hex colors inside `color-mix()` to `rgb()`:
 * #2D6A4F → rgb(45, 106, 79).
 */
const ACCENT_MIX = "color-mix(in srgb, rgb(45, 106, 79)";

const ITEMS = [
  { id: "one", label: "One" },
  { id: "two", label: "Two" },
];

const tablistOf = (container: HTMLElement) =>
  container.querySelector('[data-fluidkit="liquid-tabs"]') as HTMLElement;

describe("LiquidTabs theming", () => {
  it("accent alone leaves the default flat material untinted (tint is glass-only)", () => {
    const { container } = render(
      <FluidThemeProvider theme={{ accent: "#2D6A4F" }}>
        <LiquidTabs items={ITEMS} value="one" onChange={() => {}} />
      </FluidThemeProvider>
    );
    const tablist = tablistOf(container);
    // The theme sets no material, so the tabs keep their deliberate flat
    // default — and flat ignores tint, so the accent shows up nowhere.
    expect(tablist.getAttribute("data-material")).toBe("flat");
    expect(container.innerHTML).not.toContain("color-mix");
  });

  it("theme accent tints the tabs once the theme also sets material glass (12% share)", () => {
    const { container } = render(
      <FluidThemeProvider theme={{ accent: "#2D6A4F", material: "glass" }}>
        <LiquidTabs items={ITEMS} value="one" onChange={() => {}} />
      </FluidThemeProvider>
    );
    const tablist = tablistOf(container);
    expect(tablist.getAttribute("data-material")).toBe("glass");
    // Container glass (fallback path: background IS the tint) carries the
    // accent-derived color-mix at the tabs' quiet 12% share.
    expect(tablist.style.background).toContain(`${ACCENT_MIX} 12%`);
  });

  it("an explicit material prop beats the theme's material", () => {
    const { container } = render(
      <FluidThemeProvider theme={{ accent: "#2D6A4F", material: "glass" }}>
        <LiquidTabs items={ITEMS} value="one" onChange={() => {}} material="flat" />
      </FluidThemeProvider>
    );
    expect(tablistOf(container).getAttribute("data-material")).toBe("flat");
    expect(container.innerHTML).not.toContain("color-mix");
  });

  it("an explicit tint prop beats the theme's derived tint", () => {
    const { container } = render(
      <FluidThemeProvider theme={{ accent: "#2D6A4F", material: "glass" }}>
        <LiquidTabs
          items={ITEMS}
          value="one"
          onChange={() => {}}
          tint="rgba(200, 220, 255, 0.4)"
        />
      </FluidThemeProvider>
    );
    expect(tablistOf(container).style.background).toBe(
      "rgba(200, 220, 255, 0.4)"
    );
  });

  it("no provider: the container keeps the unthemed flat chrome", () => {
    const { container } = render(
      <LiquidTabs items={ITEMS} value="one" onChange={() => {}} />
    );
    const tablist = tablistOf(container);
    expect(tablist.getAttribute("data-material")).toBe("flat");
    // jsdom normalizes rgba() spacing on write.
    expect(tablist.style.background).toBe("rgba(255, 255, 255, 0.62)");
  });
});
