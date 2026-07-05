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
    expect(deriveSurfaceOverlay(themed, "LiquidField").radius).toBe(10);
    expect(deriveSurfaceOverlay(themed, "LiquidMenu").radius).toBe(10);
    expect(deriveSurfaceOverlay(themed, "Ripple").radius).toBeUndefined();
    expect(deriveSurfaceOverlay(themed, "Thinking").radius).toBeUndefined();
    // Toast/switch/slider/progress/checkbox have no numeric radius prop.
    expect(deriveSurfaceOverlay(themed, "LiquidToast").radius).toBeUndefined();
    expect(deriveSurfaceOverlay(themed, "LiquidSwitch").radius).toBeUndefined();
    expect(deriveSurfaceOverlay(themed, "LiquidSlider").radius).toBeUndefined();
    expect(deriveSurfaceOverlay(themed, "LiquidProgress").radius).toBeUndefined();
    expect(deriveSurfaceOverlay(themed, "LiquidCheckbox").radius).toBeUndefined();
  });

  it("controls' state fills take the RAW accent — no color-mix dilution", () => {
    for (const key of ["LiquidSwitch", "LiquidSlider", "LiquidProgress"] as const) {
      const overlay = deriveSurfaceOverlay(brand, key);
      expect(overlay.stateTint).toBe("#2D6A4F");
      // State-fill controls derive no container tint/color of their own.
      expect(overlay.tint).toBeUndefined();
      expect(overlay.color).toBeUndefined();
    }
    // No accent set → no state tint.
    expect(deriveSurfaceOverlay({ surface: "#FFF" }, "LiquidSwitch").stateTint).toBeUndefined();
    // Containers never receive a state tint.
    expect(deriveSurfaceOverlay(brand, "LiquidCard").stateTint).toBeUndefined();
  });

  it("checkbox: the accent rides the shared tint/color at a strong share (the pool is state)", () => {
    const overlay = deriveSurfaceOverlay(brand, "LiquidCheckbox");
    expect(overlay.tint).toBe("color-mix(in srgb, #2D6A4F 45%, transparent)");
    expect(overlay.color).toBe("#2D6A4F");
    expect(overlay.stateTint).toBeUndefined();
  });

  it("field and menu tint quietly from the accent — quieter than a card", () => {
    const pct = (s: string) => Number(/ (\d+)%,/.exec(s)![1]);
    const field = deriveSurfaceOverlay(brand, "LiquidField");
    const menu = deriveSurfaceOverlay(brand, "LiquidMenu");
    const card = deriveSurfaceOverlay(brand, "LiquidCard");
    expect(pct(field.tint!)).toBeLessThan(pct(menu.tint!));
    expect(pct(menu.tint!)).toBeLessThan(pct(card.tint!));
    // Containers: flat fill from surface.
    expect(field.color).toBe("#FFFFFF");
    expect(menu.color).toBe("#FFFFFF");
  });

  it("toast tints from SURFACE at a near-solid share, and gets the brand ink", () => {
    const overlay = deriveSurfaceOverlay(brand, "LiquidToast");
    expect(overlay.tint).toBe("color-mix(in srgb, #FFFFFF 88%, transparent)");
    expect(overlay.color).toBe("#FFFFFF");
    expect(overlay.ink).toBe("#14151A");
    // Accent alone derives NO toast tint — the toast is surface-keyed.
    expect(deriveSurfaceOverlay({ accent: "#2D6A4F" }, "LiquidToast").tint).toBeUndefined();
    // No dark boost: the share is a readability floor, not glass legibility.
    const dark = deriveSurfaceOverlay({ ...brand, mode: "dark" }, "LiquidToast");
    expect(dark.tint).toBe("color-mix(in srgb, #FFFFFF 88%, transparent)");
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
      "LiquidCheckbox",
      "LiquidDialog",
      "LiquidField",
      "LiquidMenu",
      "LiquidPanel",
      "LiquidProgress",
      "LiquidSlider",
      "LiquidSwitch",
      "LiquidTabs",
      "LiquidText",
      "LiquidToast",
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
