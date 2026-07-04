import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";

async function loadLiquidDialog(reduced: boolean) {
  vi.resetModules();
  vi.doMock("motion/react", async (importOriginal) => {
    const actual = await importOriginal<typeof import("motion/react")>();
    return { ...actual, useReducedMotion: () => reduced };
  });
  const mod = await import("../../src/components/LiquidDialog");
  return mod.LiquidDialog;
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

describe("LiquidDialog", () => {
  it("hints the compositor on the backdrop whose opacity and blur transition", async () => {
    // The backdrop mounts fresh every open and immediately transitions
    // opacity + backdrop-filter. Without will-change the layer is built
    // cold (worse after the page has sat idle) and the first frames can
    // paint unblurred.
    const LiquidDialog = await loadLiquidDialog(true);
    render(<LiquidDialog open>hello</LiquidDialog>);

    const backdrop = document.querySelector(
      '[data-fluidkit="liquid-dialog-backdrop"]'
    ) as HTMLElement;
    expect(backdrop).not.toBeNull();
    expect(backdrop.style.willChange).toContain("opacity");
    expect(backdrop.style.willChange).toContain("backdrop-filter");
  });
});
