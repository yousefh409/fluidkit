import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { FluidThemeProvider } from "../../../src/theme";
import { LiquidSwitch } from "../../../src/components/LiquidSwitch";

/**
 * Theme overlay wiring for LiquidSwitch: the checked track fill is a STATE
 * color, so it takes the RAW brand accent (no color-mix dilution) via the
 * overlay's `stateTint`. Explicit props keep winning, and with no provider
 * the quiet-green default is untouched.
 */

const tintOf = (container: HTMLElement) =>
  container.querySelector('[data-fluidkit="liquid-switch-tint"]') as HTMLElement;

describe("LiquidSwitch themed by FluidThemeProvider", () => {
  it("the checked track fill takes the raw theme accent", () => {
    const { container } = render(
      <FluidThemeProvider theme={{ accent: "#2D6A4F" }}>
        <LiquidSwitch defaultChecked label="Alerts" />
      </FluidThemeProvider>
    );
    expect(tintOf(container).style.background).toBe("rgb(45, 106, 79)");
  });

  it("an explicit checkedTint beats the theme accent", () => {
    const { container } = render(
      <FluidThemeProvider theme={{ accent: "#2D6A4F" }}>
        <LiquidSwitch defaultChecked checkedTint="rgba(200, 40, 40, 0.5)" />
      </FluidThemeProvider>
    );
    expect(tintOf(container).style.background).toBe("rgba(200, 40, 40, 0.5)");
  });

  it("no provider: the checked tint keeps the unthemed quiet-green default", () => {
    const { container } = render(<LiquidSwitch defaultChecked />);
    expect(tintOf(container).style.background).toBe("rgba(64, 180, 120, 0.42)");
  });

  it("a surface-only theme derives no state tint", () => {
    const { container } = render(
      <FluidThemeProvider theme={{ surface: "#F4F3F0" }}>
        <LiquidSwitch defaultChecked />
      </FluidThemeProvider>
    );
    expect(tintOf(container).style.background).toBe("rgba(64, 180, 120, 0.42)");
  });
});
