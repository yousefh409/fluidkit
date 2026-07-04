import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";

class MockIntersectionObserver implements IntersectionObserver {
  static instances: MockIntersectionObserver[] = [];
  readonly root: Element | Document | null = null;
  readonly rootMargin: string = "";
  readonly thresholds: ReadonlyArray<number> = [];
  callback: IntersectionObserverCallback;
  disconnect = vi.fn();
  observe = vi.fn();
  unobserve = vi.fn();
  takeRecords = vi.fn(() => []);
  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    MockIntersectionObserver.instances.push(this);
  }
}

async function loadLayer() {
  vi.resetModules();
  const mod = await import("../../src/liquid/caustics");
  return mod.CausticsLayer;
}

describe("CausticsLayer", () => {
  beforeEach(() => {
    MockIntersectionObserver.instances = [];
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("renders an inert absolute layer", async () => {
    const CausticsLayer = await loadLayer();
    const { container } = render(<CausticsLayer />);
    const host = container.querySelector(
      '[data-fluidkit="caustics-layer"]'
    ) as HTMLElement;
    expect(host).toBeInTheDocument();
    expect(host.style.position).toBe("absolute");
    expect(host.style.pointerEvents).toBe("none");
    expect(host).toHaveAttribute("aria-hidden", "true");
  });

  it("without WebGL (jsdom) it mounts no canvas — the CSS base beneath is the fallback", async () => {
    const CausticsLayer = await loadLayer();
    const { container } = render(<CausticsLayer />);
    expect(container.querySelector("canvas")).toBeNull();
  });

  it("unmounts cleanly", async () => {
    const CausticsLayer = await loadLayer();
    const { unmount } = render(
      <CausticsLayer light="#dbeaff" intensity={0.8} />
    );
    expect(() => unmount()).not.toThrow();
  });
});
