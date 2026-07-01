import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { resolvePrefersReducedMotion } from "../../src/utils/reducedMotion";

describe("resolvePrefersReducedMotion", () => {
  it("returns true when the preference is true", () => {
    expect(resolvePrefersReducedMotion(true)).toBe(true);
  });

  it("returns false when the preference is explicitly false (no preference)", () => {
    expect(resolvePrefersReducedMotion(false)).toBe(false);
  });

  it("defaults to true (static-safe) when the preference is unknown (null)", () => {
    // SSR/unknown default must be reduced-motion-safe: when we can't read the
    // user's preference (e.g. no window/matchMedia yet, such as during SSR),
    // we assume reduced motion so primitives render their static fallback
    // instead of animating by default.
    expect(resolvePrefersReducedMotion(null)).toBe(true);
  });

  it("defaults to true (static-safe) when the preference is undefined", () => {
    expect(resolvePrefersReducedMotion(undefined)).toBe(true);
  });
});

describe("usePrefersReducedMotion", () => {
  it("returns true when Motion's useReducedMotion reports true", async () => {
    vi.resetModules();
    vi.doMock("motion/react", () => ({
      useReducedMotion: () => true,
    }));
    const { usePrefersReducedMotion: hook } = await import(
      "../../src/utils/reducedMotion"
    );

    const { result } = renderHook(() => hook());

    expect(result.current).toBe(true);
    vi.doUnmock("motion/react");
    vi.resetModules();
  });

  it("returns false when Motion's useReducedMotion reports false", async () => {
    vi.resetModules();
    vi.doMock("motion/react", () => ({
      useReducedMotion: () => false,
    }));
    const { usePrefersReducedMotion: hook } = await import(
      "../../src/utils/reducedMotion"
    );

    const { result } = renderHook(() => hook());

    expect(result.current).toBe(false);
    vi.doUnmock("motion/react");
    vi.resetModules();
  });

  it("resolves to true (static-safe default) when Motion's useReducedMotion reports null", async () => {
    vi.resetModules();
    vi.doMock("motion/react", () => ({
      useReducedMotion: () => null,
    }));
    const { usePrefersReducedMotion: hook } = await import(
      "../../src/utils/reducedMotion"
    );

    const { result } = renderHook(() => hook());

    expect(result.current).toBe(true);
    vi.doUnmock("motion/react");
    vi.resetModules();
  });
});
