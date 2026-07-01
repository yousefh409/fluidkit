import { afterEach, describe, expect, it, vi } from "vitest";
import {
  supportsBackdropFilter,
  supportsRefraction,
  supportsViewTransition,
} from "../../src/utils/featureDetect";

const originalCSS = globalThis.CSS;
const originalStartViewTransition = (
  document as unknown as { startViewTransition?: unknown }
).startViewTransition;

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();

  if (originalCSS === undefined) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (globalThis as any).CSS;
  } else {
    globalThis.CSS = originalCSS;
  }

  if (originalStartViewTransition === undefined) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (document as any).startViewTransition;
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (document as any).startViewTransition = originalStartViewTransition;
  }
});

describe("supportsBackdropFilter", () => {
  it("returns false without throwing when CSS.supports is absent (SSR-like)", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (globalThis as any).CSS;

    expect(() => supportsBackdropFilter()).not.toThrow();
    expect(supportsBackdropFilter()).toBe(false);
  });

  it("returns false without throwing when CSS exists but supports() is missing", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).CSS = {};

    expect(() => supportsBackdropFilter()).not.toThrow();
    expect(supportsBackdropFilter()).toBe(false);
  });

  it("returns true when CSS.supports reports backdrop-filter support", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).CSS = {
      supports: vi.fn((prop: string) => prop === "backdrop-filter"),
    };

    expect(supportsBackdropFilter()).toBe(true);
  });

  it("returns true when only the -webkit- prefixed form is supported", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).CSS = {
      supports: vi.fn((prop: string) => prop === "-webkit-backdrop-filter"),
    };

    expect(supportsBackdropFilter()).toBe(true);
  });

  it("returns false without throwing when CSS.supports throws", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).CSS = {
      supports: vi.fn(() => {
        throw new Error("boom");
      }),
    };

    expect(() => supportsBackdropFilter()).not.toThrow();
    expect(supportsBackdropFilter()).toBe(false);
  });
});

describe("supportsRefraction", () => {
  it("returns false without throwing when CSS.supports is absent (SSR-like)", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (globalThis as any).CSS;

    expect(() => supportsRefraction()).not.toThrow();
    expect(supportsRefraction()).toBe(false);
  });

  it("returns true when CSS.supports('backdrop-filter', 'url(#x)') is true", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).CSS = {
      supports: vi.fn(
        (prop: string, value: string) =>
          prop === "backdrop-filter" && value === "url(#x)"
      ),
    };

    expect(supportsRefraction()).toBe(true);
  });

  it("returns true when only the -webkit- prefixed url() form is supported", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).CSS = {
      supports: vi.fn(
        (prop: string, value: string) =>
          prop === "-webkit-backdrop-filter" && value === "url(#x)"
      ),
    };

    expect(supportsRefraction()).toBe(true);
  });

  it("returns false when backdrop-filter is supported but not the url() displacement form", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).CSS = {
      supports: vi.fn(
        (prop: string, value: string) =>
          prop === "backdrop-filter" && value === "blur(1px)"
      ),
    };

    expect(supportsRefraction()).toBe(false);
  });

  it("returns false without throwing when CSS.supports throws", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).CSS = {
      supports: vi.fn(() => {
        throw new Error("boom");
      }),
    };

    expect(() => supportsRefraction()).not.toThrow();
    expect(supportsRefraction()).toBe(false);
  });
});

describe("supportsViewTransition", () => {
  it("returns false without throwing when document.startViewTransition is absent", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (document as any).startViewTransition;

    expect(() => supportsViewTransition()).not.toThrow();
    expect(supportsViewTransition()).toBe(false);
  });

  it("returns false without throwing when document is undefined (SSR)", () => {
    vi.stubGlobal("document", undefined);

    expect(() => supportsViewTransition()).not.toThrow();
    expect(supportsViewTransition()).toBe(false);
  });

  it("returns true when document.startViewTransition is a function", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (document as any).startViewTransition = vi.fn();

    expect(supportsViewTransition()).toBe(true);
  });
});
