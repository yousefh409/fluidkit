import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render } from "@testing-library/react";
import { Profiler } from "react";

/**
 * `LiquidDrag` reads `usePrefersReducedMotion()`, which reads Motion's
 * `useReducedMotion()` under the hood. Same per-test mocking pattern as
 * Magnetic/FlowStagger/Droplets: mock `motion/react`, keep the real
 * `motion` factory (and every real hook the pipeline needs — `useVelocity`,
 * `useTransform`, `useSpring`, `useMotionValue`) via `importOriginal`, reset
 * the module registry so `LiquidDrag` re-imports fresh against the mock.
 */
async function loadLiquidDrag(initialReduced: boolean) {
  vi.resetModules();
  const state = { reduced: initialReduced };
  vi.doMock("motion/react", async (importOriginal) => {
    const actual = await importOriginal<typeof import("motion/react")>();
    return { ...actual, useReducedMotion: () => state.reduced };
  });
  const mod = await import("../../src/components/LiquidDrag");
  return { LiquidDrag: mod.LiquidDrag, state };
}

/** Motion writes `x`/`y`/`scaleX`/`scaleY` motion values onto the element as
 * substrings of the inline `transform` (confirmed against Magnetic's
 * `readTranslate` helper); a value that was never animated away from its
 * default is omitted entirely. Parsing the live DOM lets tests assert on
 * the drag position and stretch without reaching into Motion internals. */
function readTransform(el: HTMLElement): {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
} {
  const transform = el.style.transform;
  const x = /translateX\(([-\d.]+)px\)/.exec(transform);
  const y = /translateY\(([-\d.]+)px\)/.exec(transform);
  const scaleX = /scaleX\(([-\d.]+)\)/.exec(transform);
  const scaleY = /scaleY\(([-\d.]+)\)/.exec(transform);
  return {
    x: x ? parseFloat(x[1]) : 0,
    y: y ? parseFloat(y[1]) : 0,
    scaleX: scaleX ? parseFloat(scaleX[1]) : 1,
    scaleY: scaleY ? parseFloat(scaleY[1]) : 1,
  };
}

/** jsdom doesn't run layout, so `getBoundingClientRect` is all-zeros by
 * default; a fixed stub keeps Motion's drag/pan measurement well-defined
 * across every test, same trick Magnetic's and Droplets' tests rely on. */
function stubRect(el: HTMLElement) {
  el.getBoundingClientRect = () =>
    ({
      left: 0,
      top: 0,
      right: 50,
      bottom: 50,
      width: 50,
      height: 50,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }) as DOMRect;
}

const POINTER_ID = 1;

function pointerDown(el: HTMLElement, x: number, y: number) {
  fireEvent.pointerDown(el, {
    pointerId: POINTER_ID,
    clientX: x,
    clientY: y,
    button: 0,
    buttons: 1,
    isPrimary: true,
    pointerType: "mouse",
  });
}

function pointerMove(x: number, y: number) {
  fireEvent.pointerMove(window, {
    pointerId: POINTER_ID,
    clientX: x,
    clientY: y,
    buttons: 1,
    isPrimary: true,
    pointerType: "mouse",
  });
}

function pointerUp(x: number, y: number) {
  fireEvent.pointerUp(window, {
    pointerId: POINTER_ID,
    clientX: x,
    clientY: y,
    isPrimary: true,
    pointerType: "mouse",
  });
}

/** A single big jump: enough to move `x`/`y` but too fast/coarse (no real
 * elapsed time between samples) to register meaningful velocity — used by
 * tests that only care about drag POSITION, not the stretch pipeline. */
function dragOnce(el: HTMLElement, from: { x: number; y: number }, to: { x: number; y: number }) {
  pointerDown(el, from.x, from.y);
  pointerMove(to.x, to.y);
}

/** A rapid multi-step drag with small real delays between samples, so
 * Motion's `useVelocity` has actual elapsed time to compute a meaningful
 * (large) velocity from — used by tests that assert on the stretch
 * pipeline. Leaves the pointer DOWN (mid-drag) so assertions land before
 * release/momentum complicate the picture. */
async function fastDrag(el: HTMLElement, steps: number, stepPx: number) {
  pointerDown(el, 0, 0);
  let cx = 0;
  for (let i = 0; i < steps; i++) {
    cx += stepPx;
    pointerMove(cx, 0);
    await new Promise((r) => setTimeout(r, 8));
  }
  return cx;
}

describe("LiquidDrag", () => {
  afterEach(() => {
    vi.doUnmock("motion/react");
    vi.resetModules();
    vi.restoreAllMocks();
    // Defensive: a failed assertion mid-drag (thrown before a test's own
    // `pointerUp`) would otherwise leave Motion's pan session "captured" on
    // `window`, corrupting whichever drag gesture the NEXT test starts.
    // Releasing the same synthetic pointer id here is a no-op when the
    // previous test already released cleanly.
    pointerUp(0, 0);
  });

  it('renders children inside a data-fluidkit="liquid-drag" wrapper that responds to pointer drag', async () => {
    const { LiquidDrag } = await loadLiquidDrag(false);
    const { container, getByText } = render(
      <LiquidDrag>
        <span>drag me</span>
      </LiquidDrag>
    );
    const root = container.querySelector(
      '[data-fluidkit="liquid-drag"]'
    ) as HTMLElement;
    expect(root).not.toBeNull();
    expect(getByText("drag me")).toBeInTheDocument();

    stubRect(root);
    dragOnce(root, { x: 0, y: 0 }, { x: 40, y: 0 });
    await vi.waitFor(() => {
      expect(readTransform(root).x).toBeCloseTo(40, 0);
    });
    pointerUp(40, 0);
  });

  it("scales stay at 1 at rest (no scaleX/scaleY in the transform before any drag)", async () => {
    const { LiquidDrag } = await loadLiquidDrag(false);
    const { container } = render(
      <LiquidDrag>
        <span>x</span>
      </LiquidDrag>
    );
    const root = container.querySelector(
      '[data-fluidkit="liquid-drag"]'
    ) as HTMLElement;
    expect(readTransform(root)).toEqual({ x: 0, y: 0, scaleX: 1, scaleY: 1 });
  });

  it("a velocity spike stretches the dominant axis and compresses the cross axis (volume-preserving)", async () => {
    const { LiquidDrag } = await loadLiquidDrag(false);
    const { container } = render(
      <LiquidDrag>
        <span>x</span>
      </LiquidDrag>
    );
    const root = container.querySelector(
      '[data-fluidkit="liquid-drag"]'
    ) as HTMLElement;
    stubRect(root);

    const cx = await fastDrag(root, 8, 60);

    const { scaleX, scaleY } = readTransform(root);
    expect(scaleX).toBeGreaterThan(1);
    expect(scaleY).toBeLessThan(1);
    // Volume-preserving: scaleX * scaleY stays close to 1.
    expect(scaleX * scaleY).toBeCloseTo(1, 1);

    pointerUp(cx, 0);
  });

  it("reduced motion pins scaleX/scaleY at 1 while dragging still moves the element", async () => {
    const { LiquidDrag } = await loadLiquidDrag(true);
    const { container } = render(
      <LiquidDrag>
        <span>x</span>
      </LiquidDrag>
    );
    const root = container.querySelector(
      '[data-fluidkit="liquid-drag"]'
    ) as HTMLElement;
    stubRect(root);

    const cx = await fastDrag(root, 8, 60);

    await vi.waitFor(() => {
      expect(readTransform(root).x).toBeCloseTo(cx, 0);
    });
    const { scaleX, scaleY } = readTransform(root);
    expect(scaleX).toBe(1);
    expect(scaleY).toBe(1);
    expect(root.getAttribute("data-animating")).toBe("false");

    pointerUp(cx, 0);
  });

  it("elasticity={0} disables deformation entirely while dragging still moves the element", async () => {
    const { LiquidDrag } = await loadLiquidDrag(false);
    const { container } = render(
      <LiquidDrag elasticity={0}>
        <span>x</span>
      </LiquidDrag>
    );
    const root = container.querySelector(
      '[data-fluidkit="liquid-drag"]'
    ) as HTMLElement;
    stubRect(root);

    const cx = await fastDrag(root, 8, 60);

    await vi.waitFor(() => {
      expect(readTransform(root).x).toBeCloseTo(cx, 0);
    });
    const { scaleX, scaleY } = readTransform(root);
    expect(scaleX).toBe(1);
    expect(scaleY).toBe(1);
    expect(root.getAttribute("data-animating")).toBe("false");

    pointerUp(cx, 0);
  });

  it("onDragStart/onDragEnd receive Motion's PanInfo signature, not native DOM drag events", async () => {
    const { LiquidDrag } = await loadLiquidDrag(false);
    const onDragStart = vi.fn();
    const onDragEnd = vi.fn();
    const { container } = render(
      <LiquidDrag onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <span>x</span>
      </LiquidDrag>
    );
    const root = container.querySelector(
      '[data-fluidkit="liquid-drag"]'
    ) as HTMLElement;
    stubRect(root);

    // A genuine native HTML5 "dragstart" DOM event must NOT reach the
    // Motion-typed handler — proves it's wired through Motion's own
    // pointer-gesture system, not forwarded as a raw DOM attribute.
    fireEvent(root, new Event("dragstart", { bubbles: true }));
    expect(onDragStart).not.toHaveBeenCalled();

    dragOnce(root, { x: 0, y: 0 }, { x: 20, y: 0 });
    await vi.waitFor(() => {
      expect(onDragStart).toHaveBeenCalled();
    });
    const [, info] = onDragStart.mock.calls[0];
    // Motion's PanInfo shape: point/offset/velocity, each {x, y}. A native
    // DragEvent has none of these.
    expect(info).toHaveProperty("point.x");
    expect(info).toHaveProperty("offset.x");
    expect(info).toHaveProperty("velocity.x");

    pointerUp(20, 0);
    await vi.waitFor(() => {
      expect(onDragEnd).toHaveBeenCalled();
    });
  });

  it("commits no React updates while the pointer drags (springs driven imperatively)", async () => {
    const { LiquidDrag } = await loadLiquidDrag(false);
    const onRender = vi.fn();
    const { container } = render(
      <Profiler id="liquid-drag" onRender={onRender}>
        <LiquidDrag>
          <span>x</span>
        </LiquidDrag>
      </Profiler>
    );
    const root = container.querySelector(
      '[data-fluidkit="liquid-drag"]'
    ) as HTMLElement;
    stubRect(root);
    const commitsAfterMount = onRender.mock.calls.length;

    pointerDown(root, 0, 0);
    for (let i = 0; i < 10; i++) {
      pointerMove(i * 8, 0);
      await new Promise((r) => setTimeout(r, 4));
    }
    pointerUp(80, 0);
    await new Promise((r) => setTimeout(r, 50));

    expect(onRender.mock.calls.length).toBe(commitsAfterMount);
  });
});
