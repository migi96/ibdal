"use client";

import { useEffect, useRef, useState } from "react";

/* The Ibdal mark animated as a signal: three arcs pulse outward from the tip.
   Unlike the canvas effects this one addresses an INLINE <svg>'s paths, so it
   can't go through FxCanvas — it mounts the vendored `SignalPulse` module onto
   the rendered SVG. Loads lazily near the viewport; static for reduced motion. */

interface SignalPulseApi {
  ready(): Promise<unknown>;
  mount(
    svg: Element,
    opts: { stage?: Element | null; glow?: Element | null; speed?: number; cycle?: number },
  ): { destroy(): void };
}

export function SignalPulseMark({ className }: { className?: string }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setReduced(true);
      return;
    }

    let handle: { destroy(): void } | null = null;
    let cancelled = false;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        io.disconnect();
        (async () => {
          const w = window as unknown as Record<string, unknown>;
          if (!w.gsap) w.gsap = (await import("gsap")).gsap;
          await import("@/lib/fx/vendor/signal-pulse.js");
          const api = w.SignalPulse as SignalPulseApi;
          await api.ready();
          if (cancelled) return;
          handle = api.mount(svg, {
            stage: stageRef.current,
            glow: glowRef.current,
            speed: 1,
            cycle: 2.5,
          });
        })().catch((e) => console.warn("signal-pulse failed to mount", e));
      },
      { rootMargin: "20% 0px" },
    );
    io.observe(svg);

    return () => {
      cancelled = true;
      io.disconnect();
      handle?.destroy();
    };
  }, []);

  return (
    <div ref={stageRef} className={className} data-reduced={reduced || undefined}>
      <div ref={glowRef} className="signalGlow" aria-hidden="true" />
      <svg
        ref={svgRef}
        viewBox="0 0 175 131"
        fill="none"
        role="img"
        aria-label="إبداع الفكر"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g clipPath="url(#lm_clip)">
          <path
            data-arc="2"
            d="M166.09 62.17C153.16 47.26 136.05 36.03 116.57 30.33C107.24 27.57 97.35 26.11 87.11 26.11C76.87 26.11 66.99 27.57 57.65 30.33C38.18 36.04 21.06 47.26 8.12999 62.17C-3.19001 52.36 -2.64001 34.51 9.39999 25.59C21.58 16.57 35.39 9.62 50.3 5.27C61.97 1.83 74.34 0 87.11 0C99.88 0 112.26 1.83 123.91 5.27C138.82 9.62 152.63 16.57 164.81 25.59C176.99 34.61 177.4 52.36 166.08 62.17H166.09Z"
            fill="url(#lm_g0)"
          />
          <path
            data-arc="1"
            d="M146.34 79.28L126.59 96.4C120.14 88.93 111.58 83.32 101.85 80.46C97.17 79.1 92.24 78.35 87.12 78.35C82 78.35 77.07 79.09 72.39 80.46L65.04 55.44C72.05 53.33 79.46 52.25 87.12 52.25C94.78 52.25 102.19 53.34 109.2 55.44C123.8 59.66 136.64 68.06 146.35 79.28H146.34Z"
            fill="#4a8fe7"
          />
          <path
            data-arc="0"
            d="M87.1101 130.6L67.3601 113.48L47.6401 96.4C54.0901 88.93 62.6501 83.32 72.3801 80.46L79.7601 105.54L87.1101 130.59V130.6Z"
            fill="url(#lm_g1)"
          />
        </g>
        <defs>
          <linearGradient
            id="lm_g0"
            x1="87.1302"
            y1="0"
            x2="87.1302"
            y2="62.17"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="white" />
            <stop offset="1" stopColor="#EAF2FC" />
          </linearGradient>
          <linearGradient
            id="lm_g1"
            x1="67.3751"
            y1="80.46"
            x2="67.3751"
            y2="130.6"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="white" />
            <stop offset="1" stopColor="#EAF2FC" />
          </linearGradient>
          <clipPath id="lm_clip">
            <rect width="174.23" height="130.6" fill="white" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}
