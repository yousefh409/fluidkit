import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render } from "@testing-library/react";

/**
 * `MorphSurface` composes `useMorph()`, which reads
 * `usePrefersReducedMotion()` -> Motion's `useReducedMotion()`. We mock
 * `motion/react` per test, always keeping the real `motion`/`AnimatePresence`
 * factories (via `importOriginal`) — matches the pattern already proven in
 * tests/components/ThinkingBlob.test.tsx. Each test resets the module
 * registry so `MorphSurface` and its dependency chain are re-imported fresh
 * against the mock.
 */
async function mockReducedMotion(reduced: boolean) {
  vi.resetModules();
  vi.doMock("motion/react", async (importOriginal) => {
    const actual = await importOriginal<typeof import("motion/react")>();
    return { ...actual, useReducedMotion: () => reduced };
  });
  const mod = await import("../../src/components/MorphSurface");
  return mod.MorphSurface;
}

describe("MorphSurface", () => {
  afterEach(() => {
    vi.doUnmock("motion/react");
    vi.resetModules();
  });

  it("renders the surface and content as siblings — content is never a descendant of the surface", async () => {
    const MorphSurface = await mockReducedMotion(false);
    const { container } = render(
      <MorphSurface open={false}>
        <span data-testid="content-probe">Pill</span>
      </MorphSurface>
    );

    const surface = container.querySelector(
      '[data-fluidkit="morph-surface"]'
    ) as HTMLElement;
    const content = container.querySelector(
      '[data-fluidkit="morph-content"]'
    ) as HTMLElement;

    expect(surface).not.toBeNull();
    expect(content).not.toBeNull();

    // The structural guarantee: this is the test that would fail if someone
    // nested content inside the (layout-animated, potentially scaling)
    // surface element.
    expect(surface.contains(content)).toBe(false);
    expect(content.contains(surface)).toBe(false);
    expect(surface.parentElement).toBe(content.parentElement);

    // The content itself renders inside the content wrapper, never inside
    // the surface.
    expect(
      content.querySelector('[data-testid="content-probe"]')
    ).not.toBeNull();
    expect(
      surface.querySelector('[data-testid="content-probe"]')
    ).toBeNull();
  });

  it("applies surface.className and surface.style to the surface element", async () => {
    const MorphSurface = await mockReducedMotion(false);
    const { container } = render(
      <MorphSurface
        open={false}
        surface={{ className: "glass", style: { borderRadius: 12 } }}
      >
        <span>Pill</span>
      </MorphSurface>
    );

    const surface = container.querySelector(
      '[data-fluidkit="morph-surface"]'
    ) as HTMLElement;

    expect(surface.className).toContain("glass");
    expect(surface.style.borderRadius).toBe("12px");
  });

  it("reflects open on the surface's data-open attribute, both values", async () => {
    const MorphSurface = await mockReducedMotion(false);
    const { container, rerender } = render(
      <MorphSurface open={false}>
        <span>Pill</span>
      </MorphSurface>
    );

    let surface = container.querySelector(
      '[data-fluidkit="morph-surface"]'
    ) as HTMLElement;
    expect(surface.getAttribute("data-open")).toBe("false");

    rerender(
      <MorphSurface open={true}>
        <span>Panel</span>
      </MorphSurface>
    );

    surface = container.querySelector(
      '[data-fluidkit="morph-surface"]'
    ) as HTMLElement;
    expect(surface.getAttribute("data-open")).toBe("true");
  });

  it("swaps rendered content when open toggles", async () => {
    const MorphSurface = await mockReducedMotion(false);
    const { container, rerender } = render(
      <MorphSurface open={false}>
        <span>Pill Label</span>
      </MorphSurface>
    );

    expect(container.textContent).toContain("Pill Label");

    rerender(
      <MorphSurface open={true}>
        <span>Panel Content</span>
      </MorphSurface>
    );

    expect(container.textContent).toContain("Panel Content");
  });

  it("wires onMorphComplete to the surface's layout-complete handler", async () => {
    // Motion doesn't run real layout animations in jsdom, so to observe the
    // wiring at the component level we swap `motion.div` for a passthrough
    // that exposes `onLayoutAnimationComplete` as a click handler — this
    // proves MorphSurface threads the callback onto the actual rendered
    // surface element, on top of the hook-level contract already covered by
    // tests/hooks/useMorph.test.tsx.
    vi.resetModules();
    vi.doMock("motion/react", async (importOriginal) => {
      const actual = await importOriginal<typeof import("motion/react")>();
      const passthroughDiv = ({
        onLayoutAnimationComplete,
        layout: _layout,
        ...rest
      }: Record<string, unknown>) => (
        <div {...rest} onClick={onLayoutAnimationComplete as () => void} />
      );
      return {
        ...actual,
        useReducedMotion: () => false,
        motion: { ...actual.motion, div: passthroughDiv },
      };
    });
    const { MorphSurface } = await import(
      "../../src/components/MorphSurface"
    );

    const onMorphComplete = vi.fn();
    const { container } = render(
      <MorphSurface open={false} onMorphComplete={onMorphComplete}>
        <span>Pill</span>
      </MorphSurface>
    );

    const surface = container.querySelector(
      '[data-fluidkit="morph-surface"]'
    ) as HTMLElement;

    fireEvent.click(surface);

    expect(onMorphComplete).toHaveBeenCalledTimes(1);
  });

  it('renders the surface as the given tag via `as="section"`', async () => {
    const MorphSurface = await mockReducedMotion(false);
    const { container } = render(
      <MorphSurface open={false} as="section">
        <span>Pill</span>
      </MorphSurface>
    );

    const surface = container.querySelector('[data-fluidkit="morph-surface"]');
    expect(surface?.tagName).toBe("SECTION");
  });

  it("reflects the reduced-motion decision on the surface via a stable signal", async () => {
    const MorphSurfaceReduced = await mockReducedMotion(true);
    const { container: reducedContainer } = render(
      <MorphSurfaceReduced open={false}>
        <span>Pill</span>
      </MorphSurfaceReduced>
    );
    const reducedSurface = reducedContainer.querySelector(
      '[data-fluidkit="morph-surface"]'
    ) as HTMLElement;
    // Reduced motion: the surface snaps (layout tweening disabled) rather
    // than tweening its box.
    expect(reducedSurface.getAttribute("data-motion")).toBe("snap");

    vi.doUnmock("motion/react");
    vi.resetModules();

    const MorphSurfaceFull = await mockReducedMotion(false);
    const { container: fullContainer } = render(
      <MorphSurfaceFull open={false}>
        <span>Pill</span>
      </MorphSurfaceFull>
    );
    const fullSurface = fullContainer.querySelector(
      '[data-fluidkit="morph-surface"]'
    ) as HTMLElement;
    expect(fullSurface.getAttribute("data-motion")).toBe("layout");
  });

  it("applies className and style to the outer wrapper", async () => {
    const MorphSurface = await mockReducedMotion(false);
    const { container } = render(
      <MorphSurface
        open={false}
        className="outer-class"
        style={{ maxWidth: 320 }}
      >
        <span>Pill</span>
      </MorphSurface>
    );

    const outer = container.firstChild as HTMLElement;
    expect(outer.className).toContain("outer-class");
    expect(outer.style.maxWidth).toBe("320px");
  });
});
