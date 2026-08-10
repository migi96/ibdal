"use client";

import { useRef } from "react";
import { gsap, useGSAP, MOTION_OK } from "@/lib/motion/gsap";

interface CounterProps {
  value: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  duration?: number;
}

/* Counts up once when scrolled into view; writes textContent directly so
   React never re-renders during the tween. */
export function Counter({
  value,
  prefix = "",
  suffix = "",
  className,
  duration = 1.6,
}: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const el = ref.current!;
      const render = (n: number) => {
        el.textContent = `${prefix}${Math.round(n)}${suffix}`;
      };
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const state = { n: 0 };
        render(0);
        gsap.to(state, {
          n: value,
          duration,
          ease: "power3.out",
          onUpdate: () => render(state.n),
          scrollTrigger: { trigger: el, start: "top 90%", once: true },
        });
      });
      /* reduced motion: verbatim value, no tween (mm add returns nothing) */
      mm.add("(prefers-reduced-motion: reduce)", () => render(value));
    },
    { scope: ref, dependencies: [value, prefix, suffix, duration] },
  );

  return (
    <span ref={ref} className={className}>
      {prefix}
      {value}
      {suffix}
    </span>
  );
}
