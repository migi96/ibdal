"use client";

import { useRef } from "react";
import { gsap, useGSAP, MOTION_OK, DESKTOP_POINTER } from "@/lib/motion/gsap";
import styles from "./HoverTitle.module.css";

/* Per-letter hover for display typography — with one crucial nuance:
   Arabic is cursive, so splitting Arabic letters into separate spans breaks
   contextual shaping (the word falls apart into disconnected glyphs).

   Strategy:
   - Latin words  → real per-letter <span>s, each lifts on hover.
   - Arabic words → kept as intact text runs; a cursor-tracked radial
     gradient (painted through background-clip:text on a ::after overlay)
     lights up the letters under the pointer individually, so it feels
     per-letter without ever un-joining the script.
   Both are enabled only on hover-capable fine-pointer screens. */

const ARABIC = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/;

interface HoverTitleProps {
  text: string;
  as?: "h1" | "h2" | "h3";
  className?: string;
  /** skip the scroll entrance (e.g. for the hero, which animates on load) */
  entrance?: "scroll" | "load" | "none";
}

export function HoverTitle({
  text,
  as: Tag = "h2",
  className,
  entrance = "scroll",
}: HoverTitleProps) {
  const rootRef = useRef<HTMLHeadingElement>(null);
  const frame = useRef(0);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;
      const mm = gsap.matchMedia();

      if (entrance !== "none") {
        mm.add(MOTION_OK, () => {
          gsap.from(root.querySelectorAll(`.${styles.word}`), {
            yPercent: 60,
            opacity: 0,
            duration: 0.9,
            ease: "expo.out",
            stagger: 0.05,
            ...(entrance === "scroll" && {
              scrollTrigger: { trigger: root, start: "top 85%", once: true },
            }),
          });
        });
      }

      mm.add(DESKTOP_POINTER, () => {
        root.classList.add(styles.interactive);
        const arabicWords = Array.from(
          root.querySelectorAll<HTMLElement>(`.${styles.arabic}`),
        );

        const onMove = (e: PointerEvent) => {
          cancelAnimationFrame(frame.current);
          frame.current = requestAnimationFrame(() => {
            for (const w of arabicWords) {
              const r = w.getBoundingClientRect();
              w.style.setProperty("--wx", `${e.clientX - r.left}px`);
              w.style.setProperty("--wy", `${e.clientY - r.top}px`);
            }
          });
        };
        root.addEventListener("pointermove", onMove, { passive: true });
        return () => {
          root.classList.remove(styles.interactive);
          root.removeEventListener("pointermove", onMove);
          cancelAnimationFrame(frame.current);
        };
      });
    },
    { scope: rootRef, dependencies: [entrance] },
  );

  const words = text.split(/\s+/).filter(Boolean);

  return (
    <Tag ref={rootRef} className={`${styles.title} ${className ?? ""}`}>
      {words.map((word, wi) => {
        const arabic = ARABIC.test(word);
        return (
          <span key={wi} className={styles.wordWrap}>
            {arabic ? (
              <span className={`${styles.word} ${styles.arabic}`} data-text={word}>
                {word}
              </span>
            ) : (
              <span className={styles.word} dir="ltr">
                {Array.from(word).map((ch, ci) => (
                  <span key={ci} className={styles.letter}>
                    {ch}
                  </span>
                ))}
              </span>
            )}
            {wi < words.length - 1 ? " " : null}
          </span>
        );
      })}
    </Tag>
  );
}
