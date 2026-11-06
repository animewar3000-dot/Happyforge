"use client";

import { useRef } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";

export function AmbientScene() {
  const root = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const smoothX = useSpring(pointerX, { stiffness: 55, damping: 22, mass: 0.8 });
  const smoothY = useSpring(pointerY, { stiffness: 55, damping: 22, mass: 0.8 });
  const rotateY = useTransform(smoothX, [-1, 1], [-13, 13]);
  const rotateX = useTransform(smoothY, [-1, 1], [9, -9]);
  const driftX = useTransform(smoothX, [-1, 1], [-24, 24]);
  const driftY = useTransform(smoothY, [-1, 1], [-18, 18]);

  function trackPointer(event: React.PointerEvent<HTMLDivElement>) {
    if (reduceMotion || event.pointerType === "touch") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    pointerX.set(((event.clientX - bounds.left) / bounds.width - 0.5) * 2);
    pointerY.set(((event.clientY - bounds.top) / bounds.height - 0.5) * 2);
  }

  function resetPointer() {
    pointerX.set(0);
    pointerY.set(0);
  }

  return (
    <div
      ref={root}
      className="ambient-scene"
      aria-hidden="true"
      onPointerMove={trackPointer}
      onPointerLeave={resetPointer}
    >
      <div className="ambient-grid" />
      <div className="ambient-glow ambient-glow-one" />
      <div className="ambient-glow ambient-glow-two" />
      <motion.div
        className="ambient-object"
        style={reduceMotion ? undefined : { rotateX, rotateY, x: driftX, y: driftY }}
      >
        <div className="ambient-orb">
          <div className="orb-core" />
          <div className="orb-ring orb-ring-one" />
          <div className="orb-ring orb-ring-two" />
          <div className="orb-ring orb-ring-three" />
          <div className="orb-highlight" />
        </div>
      </motion.div>
      <div className="ambient-vignette" />
    </div>
  );
}
