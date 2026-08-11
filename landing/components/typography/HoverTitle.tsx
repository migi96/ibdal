"use client";

import { useRef } from "react";
import { gsap, useGSAP, MOTION_OK } from "@/lib/motion/gsap";
import styles from "./HoverTitle.module.css";

/* Display heading with a scroll/load entrance and a single hover behaviour:
   the whole title shifts to blue on hover. The entrance animates one wrapper
   and clears its transform on completion, so no transform ever leaks past the
   heading's layout box (which would overlap the text below). */

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
      <span className={styles.inner}>{text}</span>
    </Tag>
  );
}
