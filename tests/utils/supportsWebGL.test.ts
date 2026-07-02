import { afterEach, describe, expect, it, vi } from "vitest";
import { supportsWebGL } from "../../src/utils/supportsWebGL";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("supportsWebGL", () => {
  it("returns false in jsdom (no real WebGL context)", () => {
    expect(() => supportsWebGL()).not.toThrow();
    expect(supportsWebGL()).toBe(false);
  });

  it("returns false without throwing when document is undefined (SSR)", () => {
    vi.stubGlobal("document", undefined);

    expect(() => supportsWebGL()).not.toThrow();
    expect(supportsWebGL()).toBe(false);
  });

  it("does not touch document at module import time (lazy detection)", async () => {
    vi.resetModules();
    const getContextSpy = vi.spyOn(document, "createElement");

    await import("../../src/utils/supportsWebGL");

    expect(getContextSpy).not.toHaveBeenCalled();
  });

  it("returns true when a webgl2 context is available", () => {
    const fakeContext = {};
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
      (contextId: string) => (contextId === "webgl2" ? (fakeContext as unknown as RenderingContext) : null)
    );

    expect(supportsWebGL()).toBe(true);
  });

  it("falls back to a webgl context when webgl2 is unavailable", () => {
    const fakeContext = {};
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
      (contextId: string) => (contextId === "webgl" ? (fakeContext as unknown as RenderingContext) : null)
    );

    expect(supportsWebGL()).toBe(true);
  });

  it("returns false without throwing when getContext throws", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(() => {
      throw new Error("boom");
    });

    expect(() => supportsWebGL()).not.toThrow();
    expect(supportsWebGL()).toBe(false);
  });

  it("returns false without throwing when document.createElement throws", () => {
    vi.spyOn(document, "createElement").mockImplementation(() => {
      throw new Error("boom");
    });

    expect(() => supportsWebGL()).not.toThrow();
    expect(supportsWebGL()).toBe(false);
  });
});
