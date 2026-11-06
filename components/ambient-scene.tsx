"use client";

import { useEffect } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";

export function AmbientScene() {
  const reduceMotion = useReducedMotion();
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const smoothX = useSpring(pointerX, { stiffness: 55, damping: 22, mass: 0.8 });
  const smoothY = useSpring(pointerY, { stiffness: 55, damping: 22, mass: 0.8 });
  const rotateY = useTransform(smoothX, [-1, 1], [-13, 13]);
  const rotateX = useTransform(smoothY, [-1, 1], [9, -9]);
  const driftX = useTransform(smoothX, [-1, 1], [-24, 24]);
  const driftY = useTransform(smoothY, [-1, 1], [-18, 18]);

  useEffect(() => {
    if (reduceMotion) return;
    const handlePointer = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      pointerX.set((event.clientX / window.innerWidth - 0.5) * 2);
      pointerY.set((event.clientY / window.innerHeight - 0.5) * 2);
    };
    const reset = () => {
      pointerX.set(0);
      pointerY.set(0);
    };
    window.addEventListener("pointermove", handlePointer, { passive: true });
    window.addEventListener("blur", reset);
    return () => {
      window.removeEventListener("pointermove", handlePointer);
      window.removeEventListener("blur", reset);
    };
  }, [pointerX, pointerY, reduceMotion]);

  return (
    <div
      className="ambient-scene"
      aria-hidden="true"
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
