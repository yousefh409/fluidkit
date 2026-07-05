import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { FluidThemeProvider } from "../../../src/theme";
import { LiquidProgress } from "../../../src/components/LiquidProgress";

/**
 * Theme overlay wiring for LiquidProgress: the vessel liquid (`fillTint`)
 * is a STATE color, so it takes the RAW brand accent via the overlay's
 * `stateTint`. Renderer order: track first, fill second.
 */

const fillsOf = (container: HTMLElement) =>
  container.querySelectorAll<HTMLElement>('[data-fluidkit="liquid-fill"]');

describe("LiquidProgress themed by FluidThemeProvider", () => {
  it("the vessel fill takes the raw theme accent", () => {
    const { container } = render(
      <FluidThemeProvider theme={{ accent: "#2D6A4F" }}>
        <LiquidProgress value={0.5} />
      </FluidThemeProvider>
    );
    expect(fillsOf(container)[1].style.background).toBe("rgb(45, 106, 79)");
  });

  it("the track keeps its neutral default under a theme", () => {
    const { container } = render(
      <FluidThemeProvider theme={{ accent: "#2D6A4F", surface: "#101010" }}>
        <LiquidProgress value={0.5} />
      </FluidThemeProvider>
    );
    expect(fillsOf(container)[0].style.background).toBe(
      "rgba(120, 128, 150, 0.14)"
    );
  });

  it("an explicit fillTint beats the theme accent", () => {
    const { container } = render(
      <FluidThemeProvider theme={{ accent: "#2D6A4F" }}>
        <LiquidProgress value={0.5} fillTint="rgba(220, 120, 40, 0.5)" />
      </FluidThemeProvider>
    );
    expect(fillsOf(container)[1].style.background).toBe(
      "rgba(220, 120, 40, 0.5)"
    );
  });

  it("no provider: the fill keeps the unthemed quiet-blue default", () => {
    const { container } = render(<LiquidProgress value={0.5} />);
    expect(fillsOf(container)[1].style.background).toBe(
      "rgba(96, 156, 220, 0.45)"
    );
  });
});
