import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { FluidThemeProvider, useFluidTheme, useThemedSurface } from "../../src/theme";
import type { FluidTheme } from "../../src/theme";

function ShowTheme() {
  const theme = useFluidTheme();
  return <div data-testid="theme">{JSON.stringify(theme)}</div>;
}

function ShowOverlay() {
  const overlay = useThemedSurface("LiquidCard");
  return <div data-testid="overlay">{JSON.stringify(overlay)}</div>;
}

const read = (id: string) => JSON.parse(screen.getByTestId(id).textContent!);

describe("FluidThemeProvider", () => {
  it("defaults to an empty theme with no provider mounted", () => {
    render(<ShowTheme />);
    expect(read("theme")).toEqual({});
  });

  it("provides the theme to descendants", () => {
    render(
      <FluidThemeProvider theme={{ accent: "#0A7CFF" }}>
        <ShowTheme />
      </FluidThemeProvider>,
    );
    expect(read("theme")).toEqual({ accent: "#0A7CFF" });
  });

  it("nested providers merge, inner tokens winning", () => {
    render(
      <FluidThemeProvider theme={{ accent: "#0A7CFF", mode: "light" }}>
        <FluidThemeProvider theme={{ mode: "dark" }}>
          <ShowTheme />
        </FluidThemeProvider>
      </FluidThemeProvider>,
    );
    expect(read("theme")).toEqual({ accent: "#0A7CFF", mode: "dark" });
  });

  it("useThemedSurface returns an empty overlay with no provider (0.4.0 equivalence)", () => {
    render(<ShowOverlay />);
    expect(read("overlay")).toEqual({});
  });

  it("useThemedSurface derives from the provided theme", () => {
    const theme: FluidTheme = { surface: "#F4F3F0" };
    render(
      <FluidThemeProvider theme={theme}>
        <ShowOverlay />
      </FluidThemeProvider>,
    );
    expect(read("overlay")).toEqual({ color: "#F4F3F0" });
  });
});
