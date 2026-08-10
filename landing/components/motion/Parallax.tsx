"use client";

import { useRef } from "react";
import { gsap, useGSAP, MOTION_OK } from "@/lib/motion/gsap";

interface ParallaxProps {
  children: React.ReactNode;
  /** -1..1 — positive drifts against scroll (classic depth), negative with it */
  speed?: number;
  className?: string;
}

/* Scrub-tied translateY over the element's viewport transit.
   Transform-only, so it never triggers layout or paint storms. */
export function Parallax({ children, speed = 0.25, className }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const shift = () => speed * window.innerHeight * 0.5;
        gsap.fromTo(
          ref.current,
          { y: () => -shift() },
          {
            y: () => shift(),
            ease: "none",
            scrollTrigger: {
              trigger: ref.current,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
              invalidateOnRefresh: true,
            },
          },
        );
      });
    },
    { scope: ref, dependencies: [speed] },
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
