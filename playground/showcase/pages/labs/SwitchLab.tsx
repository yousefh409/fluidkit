/**
 * LAB (throwaway) — LiquidSwitch prototype.
 *
 * The thumb is a droplet seated in one of two wells. Each well holds a small
 * residual bead of liquid; on toggle the thumb travels, its bridge to the
 * departing bead necks, thins, and tears (leaving a satellite at the
 * pinch-off), then it connects and merges into the far bead. Raw knobs so
 * the motion can be judged live; deleted before the wave merges.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useAnimationFrame } from "motion/react";
import {
  LiquidRenderer,
  TensionField,
  circlePath,
  defaultLight,
  dist,
  resolveMaterial,
  roundRectPath,
  specularPlacement,
} from "../../../../src/liquid";
import type { LiquidBody, LiquidSceneHandle } from "../../../../src/liquid";
import { CONNECT_STRETCH, SNAP_STRETCH } from "../../../../src/liquid/tension";
import { useMotionSprings } from "../../../../src/liquid/useMotionSprings";
import { Controls, PageLayout, Slider as Knob, Stage, Toggle } from "../../kit";

/** Satellite droplet left behind at a torn neck (same recipe as Droplets). */
const SAT_R_FACTOR = 0.28;
const SAT_LIFE_MS = 420;

const ON_TINT = "rgba(64, 180, 120, 0.42)";

interface SwitchProtoProps {
  size: number;
  on: boolean;
  onToggle: () => void;
  beadRatio: number;
  stiffness: number;
  damping: number;
}

function SwitchProto({
  size,
  on,
  onToggle,
  beadRatio,
  stiffness,
  damping,
}: SwitchProtoProps) {
  const thumbR = size / 2;
  const pad = Math.max(3, size * 0.12);
  const trackH = size + pad * 2;
  const trackW = size * 2.4 + pad * 2;
  const bleed = Math.ceil(size * 0.6);
  const W = trackW + bleed * 2;
  const H = trackH + bleed * 2;
  const cy = H / 2;
  const seatL = bleed + trackH / 2;
  const seatR = bleed + trackW - trackH / 2;
  const beadR = thumbR * beadRatio;

  const light = useMemo(() => defaultLight(W, H), [W, H]);
  const trackMaterial = useMemo(
    () => resolveMaterial("glass", { tint: "rgba(120, 128, 150, 0.16)" }),
    []
  );
  const dropMaterial = useMemo(() => resolveMaterial("glass", {}), []);

  // One spring slot: thumb center x. Knob config is passed per-toggle (the
  // hook captures its initial config, overrides win).
  const x = useMotionSprings(1, () => (on ? seatR : seatL), {
    stiffness,
    damping,
  });
  useEffect(() => {
    x.setTargets([on ? seatR : seatL], { stiffness, damping });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on]);

  const tension = useRef(new TensionField());
  const bonds = useRef(new Set<string>());
  const sats = useRef<{ x: number; y: number; r0: number; age: number }[]>([]);
  const renderer = useRef<LiquidSceneHandle>(null);
  const tintRef = useRef<HTMLDivElement>(null);

  useAnimationFrame((_, delta) => {
    const tx = x.values[0].get();
    const bodies: LiquidBody[] = [
      { id: "L", x: seatL, y: cy, r: beadR },
      { id: "R", x: seatR, y: cy, r: beadR },
      { id: "T", x: tx, y: cy, r: thumbR },
    ];

    // Mirror the engine's pair hysteresis so the exact tear frame leaves a
    // satellite droplet at the pinch-off point.
    for (let i = 0; i < bodies.length; i++) {
      for (let j = i + 1; j < bodies.length; j++) {
        const a = bodies[i];
        const b = bodies[j];
        const key = `${a.id}|${b.id}`;
        const d = dist(a, b);
        const stretch = d / (a.r + b.r);
        const was = bonds.current.has(key);
        if (was ? stretch < SNAP_STRETCH : stretch < CONNECT_STRETCH) {
          bonds.current.add(key);
        } else {
          if (was) {
            const t = (a.r + (d - a.r - b.r) / 2) / d;
            sats.current.push({
              x: a.x + (b.x - a.x) * t,
              y: a.y + (b.y - a.y) * t,
              r0: Math.min(a.r, b.r) * SAT_R_FACTOR,
              age: 0,
            });
          }
          bonds.current.delete(key);
        }
      }
    }

    let satPath = "";
    sats.current = sats.current.filter((s) => {
      s.age += delta;
      const life = 1 - s.age / SAT_LIFE_MS;
      if (life <= 0) return false;
      satPath += circlePath(s, s.r0 * life ** 1.4);
      return true;
    });

    const path =
      bodies.map((b) => circlePath(b, b.r)).join("") +
      tension.current.bridges(bodies) +
      satPath;
    renderer.current?.setScene({
      path,
      speculars: bodies.map((b) => specularPlacement(b, light, 0.7)),
    });

    if (tintRef.current) {
      const progress = (tx - seatL) / (seatR - seatL);
      tintRef.current.style.opacity = String(
        Math.max(0, Math.min(1, progress))
      );
    }
  });

  const trackPath = roundRectPath(
    { x: bleed + trackW / 2, y: cy },
    trackW,
    trackH,
    trackH / 2
  );

  return (
    <div
      onClick={onToggle}
      style={{
        position: "relative",
        width: W,
        height: H,
        cursor: "pointer",
        flex: "none",
      }}
      data-on={on}
    >
      {/* Track vessel */}
      <LiquidRenderer path={trackPath} material={trackMaterial} shadow />
      {/* On-side tint: fades in as the thumb travels */}
      <div
        ref={tintRef}
        aria-hidden
        style={{
          position: "absolute",
          left: bleed,
          top: cy - trackH / 2,
          width: trackW,
          height: trackH,
          borderRadius: trackH / 2,
          background: ON_TINT,
          opacity: on ? 1 : 0,
          pointerEvents: "none",
        }}
      />
      {/* The liquid: two well beads + the thumb droplet */}
      <LiquidRenderer
        ref={renderer}
        path=""
        material={dropMaterial}
        specularSlots={3}
        shadow
      />
    </div>
  );
}

export default function SwitchLabPage() {
  const [on, setOn] = useState(false);
  const [beadRatio, setBeadRatio] = useState(0.32);
  const [stiffness, setStiffness] = useState(210);
  const [damping, setDamping] = useState(16);
  const toggle = () => setOn((v) => !v);

  return (
    <PageLayout
      title="Lab · Switch"
      description="Prototype: the switch thumb as a droplet that tears off one well and merges into the other through a real metaball bridge. Click any switch (or the stage button) to toggle all three sizes."
      hero={
        <>
          <Stage wall>
            <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
              <SwitchProto
                size={24}
                on={on}
                onToggle={toggle}
                beadRatio={beadRatio}
                stiffness={stiffness}
                damping={damping}
              />
              <SwitchProto
                size={32}
                on={on}
                onToggle={toggle}
                beadRatio={beadRatio}
                stiffness={stiffness}
                damping={damping}
              />
              <SwitchProto
                size={44}
                on={on}
                onToggle={toggle}
                beadRatio={beadRatio}
                stiffness={stiffness}
                damping={damping}
              />
            </div>
          </Stage>
          <Controls>
            <Toggle label="state" value={on} set={() => toggle()} />
            <Knob
              label="well bead (× thumb)"
              value={beadRatio}
              set={setBeadRatio}
              min={0.1}
              max={0.6}
              step={0.02}
            />
            <Knob
              label="travel stiffness"
              value={stiffness}
              set={setStiffness}
              min={50}
              max={600}
              step={10}
            />
            <Knob
              label="travel damping"
              value={damping}
              set={setDamping}
              min={6}
              max={40}
              step={1}
            />
          </Controls>
        </>
      }
    />
  );
}
