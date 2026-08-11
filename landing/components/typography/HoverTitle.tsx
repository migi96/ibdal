"use client";

import { useRef } from "react";
import { gsap, useGSAP, MOTION_OK } from "@/lib/motion/gsap";
import styles from "./HoverTitle.module.css";

/* Display heading with a scroll/load entrance and a hover effect that turns
   the text blue one letter at a time.

   Arabic is cursive — splitting it into per-letter spans breaks contextual
   shaping — so instead of colouring spans we lay an identical blue copy over
   the text and reveal it with a hard clip edge that sweeps from the reading
   start (right, in RTL) to the end. As the edge crosses each glyph, that glyph
   turns blue, giving a letter-by-letter fill while the text stays one intact,
   correctly-shaped run.

   The entrance animates a single wrapper and clears its transform on
   completion so nothing ever leaks past the heading's layout box. */

interface HoverTitleProps {
  text: string;
  as?: "h1" | "h2" | "h3";
  className?: string;
  entrance?: "scroll" | "load" | "none";
}

export function HoverTitle({
  text,
  as: Tag = "h2",
  className,
  entrance = "scroll",
}: HoverTitleProps) {
  const rootRef = useRef<HTMLHeadingElement>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;
      const inner = root.querySelector<HTMLElement>(`.${styles.inner}`);
      if (entrance === "none" || !inner) return;

      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.from(inner, {
          yPercent: 22,
          opacity: 0,
          duration: 1,
          ease: "expo.out",
          ...(entrance === "scroll" && {
            scrollTrigger: { trigger: root, start: "top 88%", once: true },
          }),
          onComplete: () =>
            gsap.set(inner, { clearProps: "transform,opacity,willChange" }),
        });
      });
    },
    { scope: rootRef, dependencies: [entrance, text] },
  );

  return (
    <Tag ref={rootRef} className={`${styles.title} ${className ?? ""}`}>
      <span className={styles.inner}>
        <span className={styles.base}>{text}</span>
        <span className={styles.sweep} aria-hidden="true">
          {text}
        </span>
      </span>
    </Tag>
  );
}
