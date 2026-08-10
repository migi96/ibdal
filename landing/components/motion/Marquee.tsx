"use client";

import styles from "./Marquee.module.css";

interface MarqueeProps {
  children: React.ReactNode;
  /** seconds per full loop */
  duration?: number;
  className?: string;
}

/* Pure-CSS transform marquee (compositor-only). Content is duplicated once
   for the seamless wrap; the copy is aria-hidden. Pauses on hover. */
export function Marquee({ children, duration = 36, className }: MarqueeProps) {
  return (
    <div className={`${styles.marquee} ${className ?? ""}`}>
      <div
        className={styles.track}
        style={{ ["--marquee-duration" as string]: `${duration}s` }}
      >
        <div className={styles.group}>{children}</div>
        <div className={styles.group} aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
}
