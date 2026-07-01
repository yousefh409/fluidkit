import { afterEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";

/**
 * `useFlow` reads `usePrefersReducedMotion()`, which reads Motion's
 * `useReducedMotion()` under the hood. To drive both branches
 * deterministically, we mock `motion/react` per test, always keeping the
 * real `motion` factory (via `importOriginal`) — only `useReducedMotion` is
 * overridden. Each test resets the module registry so `useFlow` (and its
 * dependency chain) is re-imported fresh against the mock; matches the
 * pattern already proven in tests/hooks/useMorph.test.tsx.
 */
async function mockReducedMotion(reduced: boolean) {
  vi.resetModules();
  vi.doMock("motion/react", async (importOriginal) => {
    const actual = await importOriginal<typeof import("motion/react")>();
    return { ...actual, useReducedMotion: () => reduced };
  });
  const mod = await import("../../src/hooks/useFlow");
  return mod.useFlow;
}

describe("useFlow", () => {
  afterEach(() => {
    vi.doUnmock("motion/react");
    vi.resetModules();
  });

  it("sets initial/animate to the hidden/visible variant names", async () => {
    const useFlow = await mockReducedMotion(false);
    const { result } = renderHook(() => useFlow({}));

    expect(result.current.containerProps.initial).toBe("hidden");
    expect(result.current.containerProps.animate).toBe("visible");
  });

  it("defaults the container's staggerChildren to ~0.06s", async () => {
    const useFlow = await mockReducedMotion(false);
    const { result } = renderHook(() => useFlow({}));

    expect(
      result.current.containerProps.variants.visible.transition
        ?.staggerChildren
    ).toBe(0.06);
  });

  it("honors a custom stagger value on the container's visible variant", async () => {
    const useFlow = await mockReducedMotion(false);
    const { result } = renderHook(() => useFlow({ stagger: 0.15 }));

    expect(
      result.current.containerProps.variants.visible.transition
        ?.staggerChildren
    ).toBe(0.15);
  });

  it("enables layout tweening on itemProps so siblings glide (FLIP) on reorder", async () => {
    const useFlow = await mockReducedMotion(false);
    const { result } = renderHook(() => useFlow({}));

    expect(result.current.itemProps.layout).toBe(true);
  });

  it("rises + un-blurs: hidden includes y + blur, visible clears both", async () => {
    const useFlow = await mockReducedMotion(false);
    const { result } = renderHook(() => useFlow({}));

    const { hidden, visible } = result.current.itemProps.variants;

    expect(hidden.opacity).toBe(0);
    expect(hidden.y).toBe(12);
    expect(hidden.filter).toBe("blur(2px)");

    expect(visible.opacity).toBe(1);
    expect(visible.y).toBe(0);
    expect(visible.filter).toBe("blur(0px)");
  });

  it("exposes prefersReducedMotion: false when motion is allowed", async () => {
    const useFlow = await mockReducedMotion(false);
    const { result } = renderHook(() => useFlow({}));

    expect(result.current.prefersReducedMotion).toBe(false);
  });

  it("collapses item variants to opacity-only under prefers-reduced-motion", async () => {
    const useFlow = await mockReducedMotion(true);
    const { result } = renderHook(() => useFlow({}));

    const { hidden, visible } = result.current.itemProps.variants;

    expect(hidden).toEqual({ opacity: 0 });
    expect(visible.opacity).toBe(1);
    expect(visible.y).toBeUndefined();
    expect(visible.filter).toBeUndefined();
  });

  it("exposes prefersReducedMotion: true and disables layout tweening under prefers-reduced-motion", async () => {
    const useFlow = await mockReducedMotion(true);
    const { result } = renderHook(() => useFlow({}));

    expect(result.current.prefersReducedMotion).toBe(true);
    expect(result.current.itemProps.layout).toBe(false);
  });
});
