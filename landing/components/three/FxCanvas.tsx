"use client";

import { useEffect, useRef, useState } from "react";
import { mountFx, type FxHandle, type FxName, type FxOptions } from "@/lib/fx/loader";

interface FxCanvasProps {
  effect: FxName;
  className?: string;
  opts?: FxOptions;
  /** shown instead of the canvas for prefers-reduced-motion users */
  fallbackSrc?: string;
  fallbackAlt?: string;
}

/* Performance contract:
   - nothing loads (three.js included) until the canvas nears the viewport;
   - the vendor modules cap DPR at 2 and pause when offscreen/tab-hidden;
   - reduced-motion users get the static artwork, no canvas at all. */
export function FxCanvas({
  effect,
  className,
  opts,
  fallbackSrc,
  fallbackAlt = "",
}: FxCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const optsRef = useRef<FxOptions>({ speed: 1, intensity: 1, ...opts });
  const [staticFallback, setStaticFallback] = useState(false);

  useEffect(() => {
    Object.assign(optsRef.current, opts); // vendor reads opts live, every frame
  }, [opts]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setStaticFallback(true);
      return;
    }

    let handle: FxHandle | null = null;
    let cancelled = false;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        io.disconnect();
        mountFx(effect, canvas, optsRef.current)
          .then((h) => {
            if (cancelled) h.destroy();
            else handle = h;
          })
          .catch((e) => console.warn(`fx "${effect}" failed to mount`, e));
      },
      { rootMargin: "30% 0px" },
    );
    io.observe(canvas);

    return () => {
      cancelled = true;
      io.disconnect();
      handle?.destroy();
    };
  }, [effect]);

  if (staticFallback && fallbackSrc) {
    /* plain img: the artwork is decorative and already sized by className */
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={fallbackSrc} alt={fallbackAlt} className={className} />;
  }

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
