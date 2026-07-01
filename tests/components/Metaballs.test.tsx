import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";

/**
 * `Metaballs` composes `useGoo()` (reduced-motion-aware goo filter),
 * `usePrefersReducedMotion()`, and `useInView()` — all of which read Motion's
 * `useReducedMotion()` under the hood. To drive each branch deterministically
 * (matching the pattern proven in tests/hooks/useGoo.test.tsx), we mock
 * `motion/react` per test, always keeping the real `motion` factory (via
 * `importOriginal`) so `motion.div` still renders — only `useReducedMotion`
 * is overridden. Each test resets the module registry so `Metaballs` and its
 * dependency chain are re-imported fresh against the mock.
 */

async function mockReducedMotion(reduced: boolean) {
  vi.resetModules();
  vi.doMock("motion/react", async (importOriginal) => {
    const actual = await importOriginal<typeof import("motion/react")>();
    return { ...actual, useReducedMotion: () => reduced };
  });
  const mod = await import("../../src/components/Metaballs");
  return mod.Metaballs;
}

describe("Metaballs", () => {
  afterEach(() => {
    vi.doUnmock("motion/react");
    vi.resetModules();
  });

  it("renders 3 blobs by default", async () => {
    const Metaballs = await mockReducedMotion(false);
    const { container } = render(<Metaballs />);

    expect(
      container.querySelectorAll('[data-fluidkit="metaball"]')
    ).toHaveLength(3);
  });

  it("renders `count` blobs when given a custom count", async () => {
    const Metaballs = await mockReducedMotion(false);
    const { container } = render(<Metaballs count={5} />);

    expect(
      container.querySelectorAll('[data-fluidkit="metaball"]')
    ).toHaveLength(5);
  });

  it("colors blobs with the resolved `color` prop", async () => {
    const Metaballs = await mockReducedMotion(false);
    const { container } = render(<Metaballs color="#abcdef" />);

    const blob = container.querySelector(
      '[data-fluidkit="metaball"]'
    ) as HTMLElement;

    // jsdom's CSSOM normalizes hex colors to rgb() for backgroundColor, so
    // the serialized inline style differs from the raw hex string passed in;
    // #abcdef === rgb(171, 205, 239) is what actually matters here.
    expect(blob.style.backgroundColor).toBe("rgb(171, 205, 239)");
  });

  it("defaults blob color to currentColor when `color` is omitted", async () => {
    const Metaballs = await mockReducedMotion(false);
    const { container } = render(<Metaballs />);

    const blob = container.querySelector(
      '[data-fluidkit="metaball"]'
    ) as HTMLElement;

    // jsdom lowercases the `currentColor` keyword when serializing.
    expect(blob.style.backgroundColor).toBe("currentcolor");
  });

  it("sizes blobs from the `size` prop", async () => {
    const Metaballs = await mockReducedMotion(false);
    const { container } = render(<Metaballs size={42} />);

    const blob = container.querySelector(
      '[data-fluidkit="metaball"]'
    ) as HTMLElement;

    expect(blob.style.width).toBe("42px");
    expect(blob.style.height).toBe("42px");
  });

  it("applies the goo filter and mounts the shared defs when motion is allowed", async () => {
    const Metaballs = await mockReducedMotion(false);
    const { container } = render(<Metaballs data-testid="stage" />);

    const stage = container.firstChild as HTMLElement;

    // jsdom's CSSOM normalizes `url(...)` values by quoting them; the id
    // inside is what actually matters here (see useGoo.test.tsx).
    expect(stage.style.filter).toBe('url("#fluidkit-goo")');
    expect(document.getElementById("fluidkit-defs")).not.toBeNull();
    expect(stage.getAttribute("data-animating")).toBe("true");
  });

  it("omits the filter and renders blobs static when the user prefers reduced motion", async () => {
    const Metaballs = await mockReducedMotion(true);
    const { container } = render(<Metaballs />);

    const stage = container.firstChild as HTMLElement;

    expect(stage.style.filter).toBe("");
    expect(stage.getAttribute("data-animating")).toBe("false");
    // Blobs still render (as separate, un-fused circles) — just static.
    expect(
      container.querySelectorAll('[data-fluidkit="metaball"]')
    ).toHaveLength(3);
  });

  it("renders blobs static when scrolled off-screen (inView false)", async () => {
    vi.resetModules();
    vi.doMock("motion/react", async (importOriginal) => {
      const actual = await importOriginal<typeof import("motion/react")>();
      return { ...actual, useReducedMotion: () => false };
    });
    vi.doMock("../../src/utils/useInView", () => ({
      useInView: () => ({ ref: () => {}, inView: false }),
    }));
    const { Metaballs } = await import("../../src/components/Metaballs");

    const { container } = render(<Metaballs />);
    const stage = container.firstChild as HTMLElement;

    // Motion is allowed (reduced motion is false) but the element is off
    // screen, so it should still be static, not just "not reduced".
    expect(stage.getAttribute("data-animating")).toBe("false");
    // The goo filter itself is independent of in-view state.
    expect(stage.style.filter).toBe('url("#fluidkit-goo")');

    vi.doUnmock("../../src/utils/useInView");
  });

  it("merges consumer className and style onto the container", async () => {
    const Metaballs = await mockReducedMotion(false);
    const { container } = render(
      <Metaballs className="custom-class" style={{ marginTop: 12 }} />
    );

    const stage = container.firstChild as HTMLElement;

    expect(stage.className).toContain("custom-class");
    expect(stage.style.marginTop).toBe("12px");
  });
});
