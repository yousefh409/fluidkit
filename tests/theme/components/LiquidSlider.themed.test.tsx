import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { FluidThemeProvider } from "../../../src/theme";
import { LiquidSlider } from "../../../src/components/LiquidSlider";

/**
 * Theme overlay wiring for LiquidSlider: the channel liquid (`fillTint`) is
 * a STATE color, so it takes the RAW brand accent via the overlay's
 * `stateTint`. jsdom has no `CSS.supports`, so glass degrades to its
 * fallback fill — `background` carries the tint directly.
 *
 * Renderer order inside the slider: track, fill, vivid fill, thumb, vivid
 * thumb — the channel fill is the SECOND `liquid-fill`.
 */

const fillsOf = (container: HTMLElement) =>
  container.querySelectorAll<HTMLElement>('[data-fluidkit="liquid-fill"]');

describe("LiquidSlider themed by FluidThemeProvider", () => {
  it("the channel fill takes the raw theme accent", () => {
    const { container } = render(
      <FluidThemeProvider theme={{ accent: "#2D6A4F" }}>
        <LiquidSlider defaultValue={50} label="Volume" />
      </FluidThemeProvider>
    );
    expect(fillsOf(container)[1].style.background).toBe("rgb(45, 106, 79)");
  });

  it("the track stays neutral under a theme — the fill must read against it", () => {
    const { container } = render(
      <FluidThemeProvider theme={{ accent: "#2D6A4F", surface: "#101010" }}>
        <LiquidSlider defaultValue={50} />
      </FluidThemeProvider>
    );
    expect(fillsOf(container)[0].style.background).toBe(
      "rgba(120, 128, 150, 0.16)"
    );
  });

  it("an explicit fillTint beats the theme accent", () => {
    const { container } = render(
      <FluidThemeProvider theme={{ accent: "#2D6A4F" }}>
        <LiquidSlider defaultValue={50} fillTint="rgba(220, 120, 40, 0.5)" />
      </FluidThemeProvider>
    );
    expect(fillsOf(container)[1].style.background).toBe(
      "rgba(220, 120, 40, 0.5)"
    );
  });

  it("no provider: the fill keeps the unthemed quiet-blue default", () => {
    const { container } = render(<LiquidSlider defaultValue={50} />);
    expect(fillsOf(container)[1].style.background).toBe(
      "rgba(96, 156, 220, 0.45)"
    );
  });
});
