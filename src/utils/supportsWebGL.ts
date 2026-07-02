/**
 * Whether the current environment can create a WebGL rendering context.
 *
 * Used to gate the GPU-tier primitives (`fluidkit/liquid-metal`,
 * `fluidkit/water-field`) so they never boot a shader/simulation on a device
 * or browser that can't run one. A function (never a top-level constant) so
 * nothing runs at module import time, and it swallows errors so it never
 * throws — including in SSR, where `document` may be absent entirely.
 */
export function supportsWebGL(): boolean {
  try {
    if (typeof document === "undefined") return false;
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}
