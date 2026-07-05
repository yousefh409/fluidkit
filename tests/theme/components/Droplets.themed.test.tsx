import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { Droplets } from "../../../src/components/Droplets";
import { FluidThemeProvider } from "../../../src/theme";

/**
 * Theme wiring for `Droplets`. No module mocks: unmocked in jsdom, Motion's
 * `useReducedMotion()` resolves to the static-safe `true`, so every render
 * is the deterministic static scene — assertions read the initial render
 * only (no timers, no rAF races). jsdom also can't answer
 * `supportsBackdropFilter()`, so glass renders the resolver's degraded flat
 * fallback, whose background IS the tint — the derived accent tint lands on
 * the `[data-fluidkit="liquid-fill"]` layer either way. jsdom normalizes the
 * hex inside `color-mix()` to `rgb(...)`, so assertions accept both forms.
 */

const fillOf = (container: HTMLElement) =>
  container.querySelector('[data-fluidkit="liquid-fill"]') as HTMLElement;

const specularOpacities = (container: HTMLElement) =>
  Array.from(container.querySelectorAll("ellipse"))
    .map((el) => Number(el.getAttribute("opacity") ?? 0))
    .filter((opacity) => opacity > 0);

// Droplets' derived accent share is 18% (src/theme/derive.ts).
const ACCENT_MIX =
  /^color-mix\(in srgb, (?:#2D6A4F|rgb\(45, 106, 79\)) 18%, transparent\)$/;

describe("Droplets (themed)", () => {
  it("tints the glass fill with the theme accent via color-mix", () => {
    const { container } = render(
      <FluidThemeProvider theme={{ accent: "#2D6A4F" }}>
        <Droplets />
      </FluidThemeProvider>
    );
    expect(fillOf(container).style.background).toMatch(ACCENT_MIX);
  });

  it("explicit tint beats the theme accent", () => {
    const { container } = render(
      <FluidThemeProvider theme={{ accent: "#2D6A4F" }}>
        <Droplets tint="rgba(200, 220, 255, 0.4)" />
      </FluidThemeProvider>
    );
    expect(fillOf(container).style.background).toBe("rgba(200, 220, 255, 0.4)");
  });

  it("theme material=flat with a surface color fills flat and paints no speculars", () => {
    const { container } = render(
      <FluidThemeProvider theme={{ material: "flat", surface: "#123456" }}>
        <Droplets />
      </FluidThemeProvider>
    );
    expect(fillOf(container).style.background).toBe("rgb(18, 52, 86)");
    expect(specularOpacities(container)).toHaveLength(0);
  });

  it("explicit material and color beat the theme's", () => {
    const { container } = render(
      <FluidThemeProvider
        theme={{ material: "glass", accent: "#2D6A4F", surface: "#123456" }}
      >
        <Droplets material="flat" color="#ff0000" />
      </FluidThemeProvider>
    );
    expect(fillOf(container).style.background).toBe("rgb(255, 0, 0)");
  });

  it("theme intensity drives specular opacity; explicit intensity wins", () => {
    const themedOnly = render(
      <FluidThemeProvider theme={{ intensity: 0.5 }}>
        <Droplets />
      </FluidThemeProvider>
    );
    for (const opacity of specularOpacities(themedOnly.container)) {
      expect(opacity).toBeCloseTo(0.5, 12);
    }
    const explicit = render(
      <FluidThemeProvider theme={{ intensity: 0.5 }}>
        <Droplets intensity={0.9} />
      </FluidThemeProvider>
    );
    for (const opacity of specularOpacities(explicit.container)) {
      expect(opacity).toBeCloseTo(0.9, 12);
    }
  });

  it("renders the untinted default fill with no provider mounted", () => {
    const { container } = render(<Droplets />);
    // The resolver's degraded glass fallback, exactly as before theming.
    expect(fillOf(container).style.background).toBe(
      "rgba(255, 255, 255, 0.65)"
    );
  });
});
