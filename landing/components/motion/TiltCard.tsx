"use client";

import { useRef } from "react";
import { gsap, useGSAP, DESKTOP_POINTER } from "@/lib/motion/gsap";

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
}

/* Pointer-tracked 3D tilt, quickTo-driven, desktop pointers only. */
export function TiltCard({ children, className, maxTilt = 7 }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current!;
      const mm = gsap.matchMedia();
      mm.add(DESKTOP_POINTER, () => {
        gsap.set(el, { transformPerspective: 800 });
        const toRX = gsap.quickTo(el, "rotationX", { duration: 0.5, ease: "power3.out" });
        const toRY = gsap.quickTo(el, "rotationY", { duration: 0.5, ease: "power3.out" });

        const onMove = (e: PointerEvent) => {
          const r = el.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width - 0.5;
          const py = (e.clientY - r.top) / r.height - 0.5;
          toRX(-py * maxTilt * 2);
          toRY(px * maxTilt * 2);
        };
        const onLeave = () => {
          toRX(0);
          toRY(0);
        };
        el.addEventListener("pointermove", onMove, { passive: true });
        el.addEventListener("pointerleave", onLeave);
        return () => {
          el.removeEventListener("pointermove", onMove);
          el.removeEventListener("pointerleave", onLeave);
        };
      });
    },
    { scope: ref, dependencies: [maxTilt] },
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
