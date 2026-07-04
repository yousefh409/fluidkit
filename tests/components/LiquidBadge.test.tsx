import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

async function loadBadge(reduced: boolean) {
  vi.resetModules();
  vi.doMock("motion/react", async (importOriginal) => {
    const actual = await importOriginal<typeof import("motion/react")>();
    return { ...actual, useReducedMotion: () => reduced };
  });
  const mod = await import("../../src/components/LiquidBadge");
  return mod.LiquidBadge;
}

beforeEach(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.doUnmock("motion/react");
  vi.resetModules();
});

describe("LiquidBadge", () => {
  it("wraps its anchor and shows the count", async () => {
    const LiquidBadge = await loadBadge(true);
    render(
      <LiquidBadge count={4}>
        <span>Inbox</span>
      </LiquidBadge>
    );
    expect(screen.getByText("Inbox")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
  });

  it("caps at max with a plus", async () => {
    const LiquidBadge = await loadBadge(true);
    render(<LiquidBadge count={120} max={99} />);
    expect(screen.getByText("99+")).toBeInTheDocument();
  });

  it("hides at zero unless showZero", async () => {
    const LiquidBadge = await loadBadge(true);
    const { rerender } = render(<LiquidBadge count={0} />);
    expect(document.querySelector('[data-fluidkit="liquid-badge"]')).toBeNull();
    rerender(<LiquidBadge count={0} showZero />);
    expect(
      document.querySelector('[data-fluidkit="liquid-badge"]')
    ).not.toBeNull();
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("updates the count text on change", async () => {
    const LiquidBadge = await loadBadge(true);
    const { rerender } = render(<LiquidBadge count={4} />);
    rerender(<LiquidBadge count={5} />);
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.queryByText("4")).toBeNull();
  });

  it("reduced motion: count cross-fades, no droplet loop", async () => {
    const LiquidBadge = await loadBadge(true);
    const { rerender } = render(<LiquidBadge count={4} />);
    rerender(<LiquidBadge count={5} />);
    expect(
      document
        .querySelector('[data-fluidkit="liquid-badge"]')
        ?.getAttribute("data-animating")
    ).toBe("false");
  });

  it("motion is decorative: the badge is aria-hidden by default", async () => {
    const LiquidBadge = await loadBadge(true);
    render(<LiquidBadge count={7} />);
    expect(
      document
        .querySelector('[data-fluidkit="liquid-badge"]')
        ?.getAttribute("aria-hidden")
    ).toBe("true");
  });
});
