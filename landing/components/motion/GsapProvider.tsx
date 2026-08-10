"use client";

import { useEffect } from "react";
import { ScrollTrigger } from "@/lib/motion/gsap";

/* Keeps ScrollTrigger measurements honest: font swaps and late-decoded
   images change layout, so refresh once fonts and the full page settle. */
export function GsapProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const refresh = () => ScrollTrigger.refresh();
    document.fonts?.ready.then(refresh);
    if (document.readyState === "complete") refresh();
    else window.addEventListener("load", refresh, { once: true });
    return () => window.removeEventListener("load", refresh);
  }, []);

  return children;
}
