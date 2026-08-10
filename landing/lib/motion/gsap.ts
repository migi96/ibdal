"use client";

/* Single registration point for GSAP — every client component imports from
   here so plugins register exactly once and tree-shaking stays predictable. */
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
  ScrollTrigger.config({ ignoreMobileResize: true });
}

/** matchMedia conditions shared across the app */
export const MOTION_OK = "(prefers-reduced-motion: no-preference)";
export const DESKTOP_POINTER =
  "(hover: hover) and (pointer: fine) and (min-width: 1024px)";

export { gsap, ScrollTrigger, useGSAP };
