import { afterEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";

/**
 * `useMorph` reads `usePrefersReducedMotion()`, which reads Motion's
 * `useReducedMotion()` under the hood. To drive both branches
 * deterministically, we mock `motion/react` per test, always keeping the
 * real `motion` factory (via `importOriginal`) — only `useReducedMotion` is
 * overridden. Each test resets the module registry so `useMorph` (and its
 * dependency chain) is re-imported fresh against the mock; matches the
 * pattern already proven in tests/hooks/useGoo.test.tsx and
 * tests/components/ThinkingBlob.test.tsx.
 */
async function mockReducedMotion(reduced: boolean) {
  vi.resetModules();
  vi.doMock("motion/react", async (importOriginal) => {
    const actual = await importOriginal<typeof import("motion/react")>();
    return { ...actual, useReducedMotion: () => reduced };
  });
  const mod = await import("../../src/hooks/useMorph");
  return mod.useMorph;
}

describe("useMorph", () => {
  afterEach(() => {
    vi.doUnmock("motion/react");
    vi.resetModules();
  });

  it("returns surfaceProps with layout tweening enabled and data-open true when open", async () => {
    const useMorph = await mockReducedMotion(false);
    const { result } = renderHook(() => useMorph({ open: true }));

    expect(result.current.surfaceProps.layout).toBe(true);
    expect(result.current.surfaceProps["data-open"]).toBe(true);
  });

  it("returns surfaceProps with data-open false when closed", async () => {
    const useMorph = await mockReducedMotion(false);
    const { result } = renderHook(() => useMorph({ open: false }));

    expect(result.current.surfaceProps.layout).toBe(true);
    expect(result.current.surfaceProps["data-open"]).toBe(false);
  });

  it("wires onMorphComplete to the surface's layout-complete handler", async () => {
    const useMorph = await mockReducedMotion(false);
    const onMorphComplete = vi.fn();
    const { result } = renderHook(() =>
      useMorph({ open: true, onMorphComplete })
    );

    expect(typeof result.current.surfaceProps.onLayoutAnimationComplete).toBe(
      "function"
    );
    result.current.surfaceProps.onLayoutAnimationComplete?.();

    expect(onMorphComplete).toHaveBeenCalledTimes(1);
  });

  it("keys contentProps by the open state so AnimatePresence swaps content", async () => {
    const useMorph = await mockReducedMotion(false);
    const { result: openResult } = renderHook(() => useMorph({ open: true }));
    const { result: closedResult } = renderHook(() =>
      useMorph({ open: false })
    );

    expect(openResult.current.contentProps.key).toBe("true");
    expect(closedResult.current.contentProps.key).toBe("false");
  });

  it("disables layout tweening (snap) under prefers-reduced-motion", async () => {
    const useMorph = await mockReducedMotion(true);
    const { result } = renderHook(() => useMorph({ open: true }));

    expect(result.current.surfaceProps.layout).toBe(false);
    expect(result.current.prefersReducedMotion).toBe(true);
  });

  it("exposes prefersReducedMotion: false when motion is allowed", async () => {
    const useMorph = await mockReducedMotion(false);
    const { result } = renderHook(() => useMorph({ open: true }));

    expect(result.current.prefersReducedMotion).toBe(false);
  });

  it("cross-fades content with opacity only, no translate, under prefers-reduced-motion", async () => {
    const useMorph = await mockReducedMotion(true);
    const { result } = renderHook(() => useMorph({ open: true }));

    const { initial, animate, exit } = result.current.contentProps;

    // Opacity-only: no `y` (or any transform) key present on any phase.
    expect(initial).toEqual({ opacity: 0 });
    expect(animate).toEqual({ opacity: 1 });
    expect(exit).toEqual({ opacity: 0 });
  });

  it("cross-fades content with opacity + a small translate when motion is allowed", async () => {
    const useMorph = await mockReducedMotion(false);
    const { result } = renderHook(() => useMorph({ open: true }));

    const { initial, animate, exit } = result.current.contentProps;

    expect(initial.opacity).toBe(0);
    expect(animate.opacity).toBe(1);
    expect(exit.opacity).toBe(0);

    // A few px of translate, not zero, and settling back to 0 on animate.
    expect(typeof initial.y).toBe("number");
    expect(initial.y).not.toBe(0);
    expect(Math.abs(initial.y as number)).toBeLessThanOrEqual(12);
    expect(animate.y).toBe(0);
    expect(typeof exit.y).toBe("number");
    expect(exit.y).not.toBe(0);
  });
});
