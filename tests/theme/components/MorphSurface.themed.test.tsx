import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { MorphSurface } from "../../../src/components/MorphSurface";
import { FluidThemeProvider } from "../../../src/theme";
import type { FluidTheme } from "../../../src/theme";

/**
 * Theme overlay wiring for MorphSurface: a mounted FluidThemeProvider themes
 * the surface (derived glass tint, flat fill, radius) and explicit props
 * keep winning. The surface has no rim layers, so the themed radius is
 * asserted on the clip-path arcs instead: the closed pill (46px tall) caps
 * the corner radius at 23, so the default renders `A 23 23` arcs and a
 * theme radius of 10 renders `A 10 10` arcs. jsdom reports no
 * backdrop-filter support, so glass renders the degraded flat fallback —
 * which still carries the tint.
 */

/** Theme WITHOUT material: glass stays the default, so the tint derives. */
const TINT_THEME: FluidTheme = { accent: "#2D6A4F", surface: "#F4F3F0", radius: 10 };
const FLAT_THEME: FluidTheme = { ...TINT_THEME, material: "flat" };

const themedRender = (theme: FluidTheme, ui: ReactElement) =>
  render(<FluidThemeProvider theme={theme}>{ui}</FluidThemeProvider>);

/** jsdom normalizes the accent hex inside color-mix() to rgb() form. */
const ACCENT_TINT = /color-mix\(in srgb, (#2D6A4F|rgb\(45, 106, 79\))/;

const fillOf = (container: HTMLElement) =>
  container.querySelector('[data-fluidkit="liquid-fill"]') as HTMLElement;

const clipPathOf = (container: HTMLElement) =>
  (
    container.querySelector('[data-fluidkit="liquid-clip"]') as HTMLElement
  ).style.clipPath;

describe("MorphSurface themed by FluidThemeProvider", () => {
  it("derives the glass tint from the theme accent", () => {
    const { container } = themedRender(
      TINT_THEME,
      <MorphSurface open={false} />
    );
    expect(fillOf(container)).not.toBeNull();
    expect(container.innerHTML).toMatch(ACCENT_TINT);
  });

  it("fills the flat material with the theme surface color", () => {
    const { container } = themedRender(
      FLAT_THEME,
      <MorphSurface open={false} />
    );
    expect(fillOf(container).style.background).toBe("rgb(244, 243, 240)");
  });

  it("applies the theme radius to the clip-path corner arcs", () => {
    const themedRadius = themedRender(
      { radius: 10 },
      <MorphSurface open={false} />
    );
    expect(clipPathOf(themedRadius.container)).toContain("A 10.0 10.0");

    // Without a theme radius the closed pill keeps its capped default (23).
    const unthemed = render(<MorphSurface open={false} />);
    expect(clipPathOf(unthemed.container)).toContain("A 23.0 23.0");
    expect(clipPathOf(unthemed.container)).not.toContain("A 10.0 10.0");
  });

  it("lets an explicit tint beat the themed tint", () => {
    const { container } = themedRender(
      TINT_THEME,
      <MorphSurface open={false} tint="rgba(10, 20, 30, 0.4)" />
    );
    expect(fillOf(container).style.background).toBe("rgba(10, 20, 30, 0.4)");
    expect(container.innerHTML).not.toContain("color-mix");
  });

  it("lets an explicit material beat the themed material", () => {
    const { container } = themedRender(
      FLAT_THEME,
      <MorphSurface open={false} material="glass" />
    );
    // Glass carries the derived accent tint; the themed flat fill loses.
    expect(container.innerHTML).toMatch(ACCENT_TINT);
    expect(fillOf(container).style.background).not.toBe("rgb(244, 243, 240)");
  });
});
