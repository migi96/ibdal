"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, useGSAP, DESKTOP_POINTER } from "@/lib/motion/gsap";
import styles from "./Header.module.css";

const LINKS = [
  { href: "#about", label: "من نحن" },
  { href: "#services", label: "خدماتنا" },
  { href: "#juman", label: "جُمان AI" },
  { href: "#methodology", label: "منهجيتنا" },
  { href: "#offices", label: "مكاتبنا" },
  { href: "#contact", label: "تواصل معنا" },
];

export function Header() {
  const ref = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const particleRef = useRef<HTMLCanvasElement>(null);
  const [scrolled, setScrolled] = useState(false);

  /* frost the bar once the page leaves the hero */
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setScrolled(window.scrollY > 40));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  /* per-letter particle sparkle: hovering a link emits sky-blue particles
     spread across its glyphs (Arabic stays intact — we sample emit points
     across the link's width, one per ~letter, rather than splitting spans).
     rAF only runs while particles are alive; desktop + motion-ok only. */
  useEffect(() => {
    const nav = navRef.current;
    const canvas = particleRef.current;
    if (!nav || !canvas) return;
    const desktop = window.matchMedia(
      "(hover: hover) and (pointer: fine) and (min-width: 1024px)",
    );
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!desktop.matches || reduced.matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    const COLORS = [
      [188, 214, 255],
      [74, 143, 231],
      [147, 197, 253],
      [255, 255, 255],
    ];
    type P = { x: number; y: number; vx: number; vy: number; life: number; r: number; c: number[] };
    const parts: P[] = [];
    let w = 0, h = 0, raf = 0, running = false;

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      w = r.width; h = r.height;
      canvas.width = Math.round(w * DPR);
      canvas.height = Math.round(h * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const loop = () => {
      ctx.clearRect(0, 0, w, h);
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.x += p.vx; p.y += p.vy; p.vy += 0.006; p.life -= 0.017;
        if (p.life <= 0) { parts.splice(i, 1); continue; }
        ctx.globalAlpha = Math.max(0, p.life) * 0.9;
        ctx.fillStyle = `rgb(${p.c[0]},${p.c[1]},${p.c[2]})`;
        ctx.shadowBlur = 6;
        ctx.shadowColor = ctx.fillStyle;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * p.life + 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      if (parts.length) raf = requestAnimationFrame(loop);
      else running = false;
    };
    const spawn = (x: number, y: number) => {
      parts.push({
        x, y,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -0.5 - Math.random() * 1.15,
        life: 1,
        r: 1 + Math.random() * 1.8,
        c: COLORS[(Math.random() * COLORS.length) | 0],
      });
      if (!running) { running = true; raf = requestAnimationFrame(loop); }
    };
    const emitAcross = (link: HTMLElement) => {
      const lr = link.getBoundingClientRect();
      const cr = canvas.getBoundingClientRect();
      const n = Math.max(6, Math.round(lr.width / 12)); // ≈ one per letter
      for (let i = 0; i < n; i++) {
        const x = lr.left - cr.left + ((i + 0.5) / n) * lr.width + (Math.random() - 0.5) * 6;
        const y = lr.top - cr.top + lr.height * 0.5 + (Math.random() - 0.5) * lr.height * 0.5;
        spawn(x, y);
      }
    };

    const links = Array.from(nav.querySelectorAll<HTMLElement>(`.${styles.link}`));
    const onEnter = (e: Event) => emitAcross(e.currentTarget as HTMLElement);
    const onMove = (e: PointerEvent) => {
      if (Math.random() > 0.22) return;
      const cr = canvas.getBoundingClientRect();
      spawn(e.clientX - cr.left, e.clientY - cr.top);
    };
    links.forEach((l) => {
      l.addEventListener("pointerenter", onEnter);
      l.addEventListener("pointermove", onMove as EventListener, { passive: true });
    });
    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
      links.forEach((l) => {
        l.removeEventListener("pointerenter", onEnter);
        l.removeEventListener("pointermove", onMove as EventListener);
      });
    };
  }, []);

  /* creative hover: a sky-blue pill that glides to whichever link is hovered */
  useGSAP(
    () => {
      const nav = navRef.current;
      if (!nav) return;
      const indicator = nav.querySelector<HTMLElement>(`.${styles.indicator}`);
      if (!indicator) return;
      const mm = gsap.matchMedia();

      mm.add(DESKTOP_POINTER, () => {
        const toX = gsap.quickTo(indicator, "x", { duration: 0.4, ease: "power3.out" });
        const toW = gsap.quickTo(indicator, "width", { duration: 0.4, ease: "power3.out" });
        const setO = gsap.quickTo(indicator, "opacity", { duration: 0.25, ease: "power2.out" });
        const links = Array.from(nav.querySelectorAll<HTMLElement>(`.${styles.link}`));

        const move = (el: HTMLElement) => {
          toX(el.offsetLeft);
          toW(el.offsetWidth);
          setO(1);
        };
        const enter = (e: Event) => move(e.currentTarget as HTMLElement);
        const leave = () => setO(0);

        links.forEach((l) => l.addEventListener("pointerenter", enter));
        nav.addEventListener("pointerleave", leave);
        return () => {
          links.forEach((l) => l.removeEventListener("pointerenter", enter));
          nav.removeEventListener("pointerleave", leave);
        };
      });
    },
    { scope: navRef },
  );

  return (
    <header
      ref={ref}
      className={`${styles.header} ${scrolled ? styles.scrolled : ""}`}
    >
      <canvas ref={particleRef} className={styles.particles} aria-hidden="true" />
      <div className={`container ${styles.row}`}>
        <a href="#hero" className={styles.brand} aria-label="إبداع الفكر — الصفحة الرئيسية">
          <span className={styles.brandMark} aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/16-services-1-2/logo-mark.svg" alt="" width={28} height={20} />
          </span>
          <span className={styles.brandName}>إبداع الفكر</span>
        </a>

        <nav ref={navRef} className={styles.nav} aria-label="التنقل الرئيسي">
          <span className={styles.indicator} aria-hidden="true" />
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className={styles.link}>
              {l.label}
            </a>
          ))}
        </nav>

        <a href="#contact" className={styles.cta}>
          <span className={styles.ctaLabel}>احجز استشارة</span>
          <span className={styles.ctaGlow} aria-hidden="true" />
        </a>
      </div>
    </header>
  );
}
