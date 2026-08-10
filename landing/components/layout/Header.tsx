"use client";

import { useRef } from "react";
import { gsap, useGSAP, MOTION_OK } from "@/lib/motion/gsap";
import styles from "./Header.module.css";

const LINKS = [
  { href: "#about", label: "من نحن" },
  { href: "#services", label: "خدماتنا" },
  { href: "#juman", label: "جُمان AI" },
  { href: "#methodology", label: "منهجيتنا" },
  { href: "#contact", label: "تواصل معنا" },
];

export function Header() {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        /* solidify the bar once the page scrolls */
        gsap.to(ref.current, {
          backgroundColor: "rgba(11, 16, 32, 0.82)",
          backdropFilter: "blur(14px)",
          boxShadow: "0 10px 40px rgba(3, 8, 26, 0.45)",
          duration: 0.3,
          scrollTrigger: {
            start: 60,
            toggleActions: "play none none reverse",
          },
        });
      });
    },
    { scope: ref },
  );

  return (
    <header ref={ref} className={styles.header}>
      <div className={`container ${styles.row}`}>
        <a href="#hero" className={styles.brand}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/16-services-1-2/logo-mark.svg" alt="" width={30} height={22} />
          <span>إبداع الفكر</span>
        </a>
        <nav className={styles.nav} aria-label="التنقل الرئيسي">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className={styles.link}>
              {l.label}
            </a>
          ))}
        </nav>
        <a href="#contact" className={styles.cta}>
          احجز استشارة
        </a>
      </div>
    </header>
  );
}
