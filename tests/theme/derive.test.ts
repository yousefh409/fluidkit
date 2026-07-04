import { describe, expect, it } from "vitest";
import {
  deriveSurfaceOverlay,
  THEMEABLE_COMPONENTS,
  type ThemedComponentKey,
} from "../../src/theme/derive";
import type { FluidTheme } from "../../src/theme/theme";

const brand: FluidTheme = {
  accent: "#2D6A4F",
  surface: "#FFFFFF",
  text: "#14151A",
  mode: "light",
};

describe("deriveSurfaceOverlay", () => {
  it("derives nothing from an empty theme — components keep their own defaults", () => {
    for (const key of THEMEABLE_COMPONENTS) {
      expect(deriveSurfaceOverlay({}, key)).toEqual({});
    }
  });

  it("only explicitly-set tokens derive: a colors-only theme never sets material or intensity", () => {
    for (const key of THEMEABLE_COMPONENTS) {
      const overlay = deriveSurfaceOverlay(brand, key);
      expect(overlay.material).toBeUndefined();
      expect(overlay.intensity).toBeUndefined();
    }
  });

  it("accent derives a translucent glass tint via color-mix, with per-component alpha", () => {
    const card = deriveSurfaceOverlay(brand, "LiquidCard");
    const button = deriveSurfaceOverlay(brand, "LiquidButton");
    expect(card.tint).toMatch(/^color-mix\(in srgb, #2D6A4F \d+%, transparent\)$/);
    expect(button.tint).toMatch(/^color-mix\(in srgb, #2D6A4F \d+%, transparent\)$/);
    // A button reads louder than a card — its accent share is higher.
    const pct = (s: string) => Number(/ (\d+)%,/.exec(s)![1]);
    expect(pct(button.tint!)).toBeGreaterThan(pct(card.tint!));
  });

  it("dark mode raises the tint alpha so glass still reads over dark hosts", () => {
    const light = deriveSurfaceOverlay(brand, "LiquidCard");
    const dark = deriveSurfaceOverlay({ ...brand, mode: "dark" }, "LiquidCard");
    const pct = (s: string) => Number(/ (\d+)%,/.exec(s)![1]);
    expect(pct(dark.tint!)).toBeGreaterThan(pct(light.tint!));
  });

  it("surface derives the flat fill; text derives LiquidText's glyph color", () => {
    expect(deriveSurfaceOverlay(brand, "LiquidPanel").color).toBe("#FFFFFF");
    const text = deriveSurfaceOverlay(brand, "LiquidText");
    expect(text.color).toBe("#14151A");
    expect(text.tint).toBeUndefined(); // text glyphs have no glass tint
  });

  it("material and intensity pass through when set", () => {
    const overlay = deriveSurfaceOverlay({ material: "flat", intensity: "present" }, "LiquidTabs");
    expect(overlay.material).toBe("flat");
    expect(overlay.intensity).toBe("present");
  });

  it("radius applies only to components that expose a radius prop", () => {
    const themed: FluidTheme = { radius: 10 };
    expect(deriveSurfaceOverlay(themed, "LiquidCard").radius).toBe(10);
    expect(deriveSurfaceOverlay(themed, "LiquidDialog").radius).toBe(10);
    expect(deriveSurfaceOverlay(themed, "Ripple").radius).toBeUndefined();
    expect(deriveSurfaceOverlay(themed, "Thinking").radius).toBeUndefined();
  });

  it("reserved tokens (background, mutedText, fontFamily) are inert in 0.5", () => {
    const overlay = deriveSurfaceOverlay(
      { background: "#000", mutedText: "#888", fontFamily: "Inter" },
      "LiquidCard",
    );
    expect(overlay).toEqual({});
  });

  it("every themeable key has a derivation entry (table completeness)", () => {
    const keys: ThemedComponentKey[] = [
      "Droplets",
      "LiquidButton",
      "LiquidCard",
      "LiquidDialog",
      "LiquidPanel",
      "LiquidTabs",
      "LiquidText",
      "LiquidTooltip",
      "MeniscusDivider",
      "MorphSurface",
      "Ripple",
      "Thinking",
      "VoiceBall",
    ];
    expect([...THEMEABLE_COMPONENTS].sort()).toEqual(keys.sort());
  });
});
