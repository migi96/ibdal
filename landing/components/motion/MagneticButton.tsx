"use client";

import { useRef } from "react";
import { gsap, useGSAP, DESKTOP_POINTER } from "@/lib/motion/gsap";

interface MagneticButtonProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  children: React.ReactNode;
  strength?: number;
}

/* Magnetic pull via gsap.quickTo — two pre-compiled tweens updated per
   pointermove, no allocation and no React state in the hot path. */
export function MagneticButton({
  children,
  strength = 0.35,
  ...anchorProps
}: MagneticButtonProps) {
  const ref = useRef<HTMLAnchorElement>(null);

  useGSAP(
    () => {
      const el = ref.current!;
      const mm = gsap.matchMedia();
      mm.add(DESKTOP_POINTER, () => {
        const toX = gsap.quickTo(el, "x", { duration: 0.4, ease: "power3.out" });
        const toY = gsap.quickTo(el, "y", { duration: 0.4, ease: "power3.out" });

        const onMove = (e: PointerEvent) => {
          const r = el.getBoundingClientRect();
          toX((e.clientX - (r.left + r.width / 2)) * strength);
          toY((e.clientY - (r.top + r.height / 2)) * strength);
        };
        const onLeave = () => {
          toX(0);
          toY(0);
        };
        el.addEventListener("pointermove", onMove, { passive: true });
        el.addEventListener("pointerleave", onLeave);
        return () => {
          el.removeEventListener("pointermove", onMove);
          el.removeEventListener("pointerleave", onLeave);
        };
      });
    },
    { scope: ref, dependencies: [strength] },
  );

  return (
    <a ref={ref} {...anchorProps}>
      {children}
    </a>
  );
}
