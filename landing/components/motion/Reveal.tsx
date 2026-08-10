"use client";

import { useRef } from "react";
import { gsap, useGSAP, MOTION_OK } from "@/lib/motion/gsap";

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  /** selector of children to stagger; defaults to the wrapper itself */
  childSelector?: string;
  y?: number;
  stagger?: number;
  delay?: number;
}

/* Enter-once rise+fade. Opacity/transform only. */
export function Reveal({
  children,
  className,
  childSelector,
  y = 44,
  stagger = 0.08,
  delay = 0,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const targets = childSelector
          ? ref.current!.querySelectorAll(childSelector)
          : ref.current;
        gsap.from(targets, {
          y,
          opacity: 0,
          duration: 1,
          delay,
          ease: "expo.out",
          stagger,
          scrollTrigger: { trigger: ref.current, start: "top 85%", once: true },
        });
      });
    },
    { scope: ref, dependencies: [childSelector, y, stagger, delay] },
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
