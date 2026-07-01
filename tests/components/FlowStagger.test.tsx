import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";

/**
 * `FlowStagger` composes `useFlow()`, which reads
 * `usePrefersReducedMotion()` -> Motion's `useReducedMotion()`. We mock
 * `motion/react` per test, always keeping the real `motion`/`AnimatePresence`
 * factories (via `importOriginal`) — matches the pattern already proven in
 * tests/components/MorphSurface.test.tsx. Each test resets the module
 * registry so `FlowStagger` and its dependency chain are re-imported fresh
 * against the mock.
 */
async function mockReducedMotion(reduced: boolean) {
  vi.resetModules();
  vi.doMock("motion/react", async (importOriginal) => {
    const actual = await importOriginal<typeof import("motion/react")>();
    return { ...actual, useReducedMotion: () => reduced };
  });
  const mod = await import("../../src/components/FlowStagger");
  return mod.FlowStagger;
}

describe("FlowStagger", () => {
  afterEach(() => {
    vi.doUnmock("motion/react");
    vi.resetModules();
  });

  it("wraps each child in a data-fluidkit=\"flow-item\" wrapper, one per child", async () => {
    const FlowStagger = await mockReducedMotion(false);
    const { container } = render(
      <FlowStagger>
        <div key="a">A</div>
        <div key="b">B</div>
        <div key="c">C</div>
      </FlowStagger>
    );

    const items = container.querySelectorAll('[data-fluidkit="flow-item"]');
    expect(items).toHaveLength(3);
    expect(items[0].textContent).toBe("A");
    expect(items[1].textContent).toBe("B");
    expect(items[2].textContent).toBe("C");
  });

  it("preserves child keys across reorder — wrapper content follows its key", async () => {
    const FlowStagger = await mockReducedMotion(false);
    const { container, rerender } = render(
      <FlowStagger>
        <div key="a">A</div>
        <div key="b">B</div>
        <div key="c">C</div>
      </FlowStagger>
    );

    rerender(
      <FlowStagger>
        <div key="c">C</div>
        <div key="a">A</div>
        <div key="b">B</div>
      </FlowStagger>
    );

    const items = container.querySelectorAll('[data-fluidkit="flow-item"]');
    expect(items).toHaveLength(3);
    expect(items[0].textContent).toBe("C");
    expect(items[1].textContent).toBe("A");
    expect(items[2].textContent).toBe("B");
  });

  it("forwards className, style, and rest props onto the container", async () => {
    const FlowStagger = await mockReducedMotion(false);
    const { container } = render(
      <FlowStagger
        className="my-flow"
        style={{ maxWidth: 320 }}
        data-testid="flow-root"
      >
        <div key="a">A</div>
      </FlowStagger>
    );

    const root = container.firstChild as HTMLElement;
    expect(root.className).toContain("my-flow");
    expect(root.style.maxWidth).toBe("320px");
    expect(root.getAttribute("data-testid")).toBe("flow-root");
  });

  it("reflects the reduced-motion decision on the container via a stable signal", async () => {
    const FlowStaggerReduced = await mockReducedMotion(true);
    const { container: reducedContainer } = render(
      <FlowStaggerReduced>
        <div key="a">A</div>
      </FlowStaggerReduced>
    );
    const reducedRoot = reducedContainer.firstChild as HTMLElement;
    expect(reducedRoot.getAttribute("data-motion")).toBe("fade");

    vi.doUnmock("motion/react");
    vi.resetModules();

    const FlowStaggerFull = await mockReducedMotion(false);
    const { container: fullContainer } = render(
      <FlowStaggerFull>
        <div key="a">A</div>
      </FlowStaggerFull>
    );
    const fullRoot = fullContainer.firstChild as HTMLElement;
    expect(fullRoot.getAttribute("data-motion")).toBe("flow");
  });
});
