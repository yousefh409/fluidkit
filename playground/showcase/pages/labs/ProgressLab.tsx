/**
 * LAB (throwaway) — LiquidProgress prototype.
 *
 * Determinate progress as a vessel filling. The fill's leading edge is a
 * meniscus bead that wobbles while the value is moving and settles flat
 * when it stops — the wobble envelope is driven by the fill spring's
 * velocity, so idle progress never animates. Raw knobs; deleted before the
 * wave merges.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useAnimationFrame } from "motion/react";
import {
  LiquidRenderer,
  circlePath,
  defaultLight,
  resolveMaterial,
  roundRectPath,
  specularPlacement,
} from "../../../../src/liquid";
import type { LiquidSceneHandle } from "../../../../src/liquid";
import { useMotionSprings } from "../../../../src/liquid/useMotionSprings";
import { Controls, PageLayout, Slider as Knob, Stage } from "../../kit";

const FILL_TINT = "rgba(96, 156, 220, 0.45)";

interface ProgressProtoProps {
  width: number;
  height: number;
  target: number; // 0..1
  stiffness: number;
  damping: number;
  wobbleAmp: number; // fraction of bead radius
  wobbleHz: number;
  beadScale: number; // bead radius as × (height/2)
}

function ProgressProto({
  width,
  height,
  target,
  stiffness,
  damping,
  wobbleAmp,
  wobbleHz,
  beadScale,
}: ProgressProtoProps) {
  const maxBeadR = (height / 2) * beadScale * (1 + wobbleAmp);
  const bleed = Math.ceil(Math.max(12, maxBeadR - height / 2 + 8));
  const W = width + bleed * 2;
  const H = Math.ceil(Math.max(height, maxBeadR * 2)) + bleed * 2;
  const cy = H / 2;

  const light = useMemo(() => defaultLight(W, H), [W, H]);
  const trackMaterial = useMemo(
    () => resolveMaterial("glass", { tint: "rgba(120, 128, 150, 0.14)" }),
    []
  );
  const fillMaterial = useMemo(
    () => resolveMaterial("glass", { tint: FILL_TINT }),
    []
  );

  const fill = useMotionSprings(1, () => target, { stiffness, damping });
  useEffect(() => {
    fill.setTargets([target], { stiffness, damping });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  const renderer = useRef<LiquidSceneHandle>(null);
  const clock = useRef(0);
  const env = useRef(0);

  useAnimationFrame((_, delta) => {
    clock.current += delta;
    const f = Math.max(0, Math.min(1, fill.values[0].get()));
    // Velocity is fraction/sec; full wobble needs ~0.6/s of movement
    // (round-1 feedback: the slide wobbled too much). The envelope decays
    // after motion stops so the meniscus settles, not snaps.
    const v = Math.abs(fill.values[0].getVelocity());
    const drive = Math.min(1, v / 0.6);
    env.current = Math.max(env.current * Math.exp(-delta / 260), drive);

    const wobble =
      1 +
      wobbleAmp *
        env.current *
        Math.sin((clock.current / 1000) * wobbleHz * Math.PI * 2);
    const beadR = (height / 2) * beadScale * wobble;
    const edgeX = bleed + f * width;

    let path = "";
    if (f > 0.005) {
      const fillW = Math.max(f * width, height);
      path += roundRectPath(
        { x: bleed + fillW / 2, y: cy },
        fillW,
        height,
        height / 2
      );
      path += circlePath({ x: edgeX, y: cy }, beadR);
    }
    renderer.current?.setScene({
      path,
      speculars:
        f > 0.005
          ? [specularPlacement({ x: edgeX, y: cy, r: beadR }, light, 0.7)]
          : [],
    });
  });

  const trackPath = roundRectPath(
    { x: bleed + width / 2, y: cy },
    width,
    height,
    height / 2
  );

  return (
    <div style={{ position: "relative", width: W, height: H, flex: "none" }}>
      <LiquidRenderer path={trackPath} material={trackMaterial} shadow />
      <LiquidRenderer
        ref={renderer}
        path=""
        material={fillMaterial}
        specularSlots={1}
        shadow={false}
      />
    </div>
  );
}

type Playback = "idle" | "steady" | "chunks";

export default function ProgressLabPage() {
  const [target, setTarget] = useState(0.35);
  const [stiffness, setStiffness] = useState(90);
  const [damping, setDamping] = useState(14);
  const [wobbleAmp, setWobbleAmp] = useState(0.08);
  const [wobbleHz, setWobbleHz] = useState(1.6);
  const [beadScale, setBeadScale] = useState(1.15);
  const [playback, setPlayback] = useState<Playback>("idle");

  // Scripted value feeds: a steady pour vs. chunky download-style jumps.
  useEffect(() => {
    if (playback === "idle") return;
    const tick =
      playback === "steady"
        ? window.setInterval(() => {
            setTarget((t) => (t >= 1 ? 0 : Math.min(1, t + 0.012)));
          }, 60)
        : window.setInterval(() => {
            setTarget((t) =>
              t >= 1 ? 0 : Math.min(1, t + 0.04 + Math.random() * 0.16)
            );
          }, 650);
    return () => window.clearInterval(tick);
  }, [playback]);

  return (
    <PageLayout
      title="Lab · Progress"
      description="Prototype: determinate progress as a vessel filling, with a meniscus bead at the fill edge. The bead wobbles only while the value moves (velocity-driven envelope) and settles flat at rest."
      hero={
        <>
          <Stage wall>
            <div style={{ display: "grid", gap: 26, justifyItems: "center" }}>
              <ProgressProto
                width={320}
                height={14}
                target={target}
                stiffness={stiffness}
                damping={damping}
                wobbleAmp={wobbleAmp}
                wobbleHz={wobbleHz}
                beadScale={beadScale}
              />
              <ProgressProto
                width={320}
                height={8}
                target={target}
                stiffness={stiffness}
                damping={damping}
                wobbleAmp={wobbleAmp}
                wobbleHz={wobbleHz}
                beadScale={beadScale}
              />
            </div>
          </Stage>
          <Controls>
            <Knob
              label="value"
              value={Math.round(target * 100)}
              set={(n) => {
                setPlayback("idle");
                setTarget(n / 100);
              }}
              min={0}
              max={100}
              step={1}
              suffix="%"
            />
            <button
              className="btn"
              onClick={() =>
                setPlayback((p) => (p === "steady" ? "idle" : "steady"))
              }
            >
              steady pour: {playback === "steady" ? "on" : "off"}
            </button>
            <button
              className="btn"
              onClick={() =>
                setPlayback((p) => (p === "chunks" ? "idle" : "chunks"))
              }
            >
              chunky download: {playback === "chunks" ? "on" : "off"}
            </button>
            <Knob
              label="fill stiffness"
              value={stiffness}
              set={setStiffness}
              min={30}
              max={300}
              step={5}
            />
            <Knob
              label="fill damping"
              value={damping}
              set={setDamping}
              min={6}
              max={40}
              step={1}
            />
            <Knob
              label="wobble amount"
              value={wobbleAmp}
              set={setWobbleAmp}
              min={0}
              max={0.5}
              step={0.02}
            />
            <Knob
              label="wobble speed"
              value={wobbleHz}
              set={setWobbleHz}
              min={0.5}
              max={6}
              step={0.1}
              suffix="hz"
            />
            <Knob
              label="meniscus size"
              value={beadScale}
              set={setBeadScale}
              min={0.6}
              max={1.8}
              step={0.05}
            />
          </Controls>
        </>
      }
    />
  );
}
