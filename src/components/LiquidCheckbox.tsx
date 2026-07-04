/**
 * A checkbox whose check is LIQUID, not a tick: on check a droplet falls
 * into the box's well and the pool rises to fill it (settling with a
 * wobble); on uncheck the liquid drains back out. `indeterminate` — a
 * real capability of the native checkbox — reads as a half-filled well
 * with a flat meniscus.
 *
 * A real (visually hidden) `<input type="checkbox">` powers it: keyboard,
 * screen readers, form submission, and label association are the
 * browser's job. Controlled and uncontrolled both work. Keyboard focus
 * shows the shared focus meniscus.
 *
 * Reduced motion: fill level snaps between states; no droplet, no wobble.
 */

import type { CSSProperties, InputHTMLAttributes, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAnimationFrame } from "motion/react";
import {
  LiquidRenderer,
  circlePath,
  defaultLight,
  resolveMaterial,
  roundRectPath,
  specularPlacement,
} from "../liquid";
import type { LiquidSceneHandle, SpecularSpot, Vec } from "../liquid";
import { useMotionSprings } from "../liquid/useMotionSprings";
import { usePrefersReducedMotion } from "../utils";
import { resolveIntensity } from "./intensity";
import type { LiquidIntensity } from "./intensity";
import { focusMeniscusStyle, useFocusVisible } from "./focus";
import { useCheckedState, visuallyHiddenInput } from "./formControl";
import type { SurfaceStyleProps } from "./surface";

export interface LiquidCheckboxProps
  extends SurfaceStyleProps,
    Omit<
      InputHTMLAttributes<HTMLInputElement>,
      "size" | "type" | "checked" | "defaultChecked" | "onChange" | "color"
    > {
  /** Controlled state. */
  checked?: boolean;
  /** Uncontrolled initial state. */
  defaultChecked?: boolean;
  /** Fires with the next state on every toggle. */
  onCheckedChange?: (checked: boolean) => void;
  /** Mixed state: half-filled well, native `indeterminate` set. */
  indeterminate?: boolean;
  /** Label text, rendered beside the box and natively associated. */
  label?: ReactNode;
  /** Box size in px. Defaults to `20`. */
  size?: number;
  /**
   * How loudly the material reads. Defaults to `"present"` — the pool is
   * a droplet visual and carries Droplets' specular brightness (documented
   * divergence from the pack's `"whisper"`).
   */
  intensity?: LiquidIntensity;
}

const FILL_SPRING = { stiffness: 170, damping: 14 };
const DROP_SPRING = { stiffness: 300, damping: 20 };
const SETTLE_MS = 900;
/** Falling-droplet radius vs the well, and its post-landing drain. */
const DROP_R_FACTOR = 0.28;
const DRAIN_TAU_MS = 90;

interface Scene {
  path: string;
  speculars: SpecularSpot[];
}

export function LiquidCheckbox({
  checked,
  defaultChecked,
  onCheckedChange,
  indeterminate = false,
  label,
  size = 20,
  material = "glass",
  tint,
  color,
  intensity = "present",
  light,
  reflection = true,
  refraction: _refraction, // reserved: edge lensing is not wired on checkboxes yet
  shadow = true,
  disabled,
  className,
  style,
  ...inputRest
}: LiquidCheckboxProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const animating = !prefersReducedMotion;
  const state = useCheckedState(checked, defaultChecked, onCheckedChange);
  const focus = useFocusVisible();

  /* ------------------------------ geometry ------------------------------ */

  const wall = Math.max(2.5, size * 0.14);
  const inner = size - wall * 2;
  const radius = Math.max(5, size * 0.3);
  const bleed = Math.ceil(size * 0.8);
  const W = size + bleed * 2;
  const H = size + bleed * 2;
  const cx = W / 2;
  const boxBottom = bleed + size - wall;
  const innerRad = Math.max(2, radius - wall);

  const sceneLight = useMemo<Vec | null>(() => {
    if (!reflection || light === null) return null;
    return light
      ? { x: light.x + bleed, y: light.y + bleed }
      : defaultLight(W, H);
  }, [reflection, light, bleed, W, H]);
  const volume = resolveIntensity(intensity);
  const resolved = useMemo(
    () => resolveMaterial(material, { tint, color }),
    [material, tint, color]
  );
  const wellMaterial = useMemo(
    () => resolveMaterial(material, { tint: "rgba(120, 128, 150, 0.16)", color }),
    [material, color]
  );

  /* ------------------------------- motion -------------------------------- */

  const fillTarget = indeterminate ? 0.5 : state.checked ? 1 : 0;
  // Slot 0: fill fraction. Slot 1: falling droplet y (canvas coords).
  const springs = useMotionSprings(
    2,
    (i) => (i === 0 ? fillTarget : bleed - size * 0.6),
    (i) => (i === 0 ? FILL_SPRING : DROP_SPRING)
  );
  const dropR = useRef(0);
  const [settling, setSettling] = useState(false);
  const settlingRef = useRef(false);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const prevTarget = useRef(fillTarget);
  useEffect(() => {
    if (prevTarget.current !== fillTarget) {
      if (animating) {
        springs.setTarget(0, fillTarget, FILL_SPRING);
        if (fillTarget === 1 && prevTarget.current < 1) {
          // The check arrives as a droplet: fall from above the well and
          // merge into the rising pool.
          dropR.current = inner * DROP_R_FACTOR;
          springs.values[1].set(bleed - size * 0.6);
          springs.setTarget(1, bleed + size / 2, DROP_SPRING);
        } else {
          dropR.current = 0;
        }
        settlingRef.current = true;
        setSettling(true);
        if (settleTimer.current) clearTimeout(settleTimer.current);
        settleTimer.current = setTimeout(() => {
          settlingRef.current = false;
          setSettling(false);
        }, SETTLE_MS);
      } else {
        dropR.current = 0;
        springs.snapTo([fillTarget, bleed - size * 0.6]);
      }
    }
    prevTarget.current = fillTarget;
    return () => {
      if (settleTimer.current) clearTimeout(settleTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fillTarget, animating]);

  useEffect(() => {
    if (!animating) {
      settlingRef.current = false;
      setSettling(false);
    }
  }, [animating]);

  const buildScene = (f: number, dropY: number, dropRadius: number): Scene => {
    let path = "";
    const speculars: SpecularSpot[] = [];
    const poolH = Math.max(0, Math.min(1, f)) * inner;
    if (poolH > 0.5) {
      const poolCy = boxBottom - poolH / 2;
      path += roundRectPath(
        { x: cx, y: poolCy },
        inner,
        poolH,
        Math.min(innerRad, poolH / 2)
      );
      if (resolved.specular && sceneLight) {
        speculars.push(
          specularPlacement(
            { x: cx, y: poolCy, r: Math.min(inner, poolH) * 0.45 },
            sceneLight,
            volume
          )
        );
      }
    }
    if (dropRadius > 0.5) {
      path += circlePath({ x: cx, y: dropY }, dropRadius);
      if (resolved.specular && sceneLight) {
        speculars.push(
          specularPlacement(
            { x: cx, y: dropY, r: dropRadius },
            sceneLight,
            volume
          )
        );
      }
    }
    return { path, speculars };
  };

  const staticScene = useMemo(
    () => buildScene(fillTarget, 0, 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fillTarget, size, resolved.specular, sceneLight, volume]
  );

  const renderer = useRef<LiquidSceneHandle>(null);
  useEffect(() => {
    if (!(animating && settlingRef.current))
      renderer.current?.setScene(staticScene);
  }, [animating, settling, staticScene]);

  useAnimationFrame((_, delta) => {
    if (!animating || !settling) return;
    const f = springs.values[0].get();
    const dropY = springs.values[1].get();
    // Landed (or nearly): the droplet drains into the pool.
    if (dropR.current > 0 && dropY > boxBottom - inner * f - 2) {
      dropR.current *= Math.exp(-delta / DRAIN_TAU_MS);
      if (dropR.current < 0.3) dropR.current = 0;
    }
    renderer.current?.setScene(buildScene(f, dropY, dropR.current));
  });

  /* ------------------------------- render -------------------------------- */

  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (inputRef.current) inputRef.current.indeterminate = indeterminate;
  }, [indeterminate]);

  const wellPath = roundRectPath(
    { x: cx, y: bleed + size / 2 },
    size,
    size,
    radius
  );

  const rootStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    cursor: disabled ? "default" : "pointer",
    opacity: disabled ? 0.55 : 1,
    ...style,
  };

  return (
    <label
      data-fluidkit="liquid-checkbox"
      data-checked={state.checked}
      data-indeterminate={indeterminate || undefined}
      data-animating={animating && settling}
      className={className}
      onPointerDown={focus.onPointerDown}
      style={rootStyle}
    >
      <span style={{ position: "relative", width: size, height: size, flex: "none" }}>
        <span aria-hidden style={{ position: "absolute", inset: -bleed }}>
          <LiquidRenderer path={wellPath} material={wellMaterial} shadow={shadow} />
        </span>
        <span aria-hidden style={{ position: "absolute", inset: -bleed }}>
          <LiquidRenderer
            ref={renderer}
            path={staticScene.path}
            material={resolved}
            speculars={staticScene.speculars}
            specularSlots={resolved.specular && sceneLight ? 2 : 0}
            shadow={false}
          />
        </span>
        {focus.focusVisible && (
          <span
            aria-hidden
            data-fluidkit="liquid-checkbox-focus"
            style={focusMeniscusStyle(radius)}
          />
        )}
        <input
          ref={inputRef}
          type="checkbox"
          style={visuallyHiddenInput}
          disabled={disabled}
          checked={checked !== undefined ? checked : undefined}
          defaultChecked={checked !== undefined ? undefined : defaultChecked}
          onChange={(e) => state.handleChange(e.target.checked)}
          onFocus={focus.onFocus}
          onBlur={focus.onBlur}
          {...inputRest}
        />
      </span>
      {label != null && <span>{label}</span>}
    </label>
  );
}
