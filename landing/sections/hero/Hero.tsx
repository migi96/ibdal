"use client";

import { useRef } from "react";
import { gsap, useGSAP, MOTION_OK } from "@/lib/motion/gsap";
import { FxCanvas } from "@/components/three/FxCanvas";
import { HoverTitle } from "@/components/typography/HoverTitle";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { Parallax } from "@/components/motion/Parallax";
import styles from "./Hero.module.css";

const CHIPS = [
  "بياناتك خاصة وآمنة",
  "تشغيل محلي",
  "متاح 24/7",
  "يتكامل مع أنظمتك",
];

export function Hero() {
  const rootRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        /* load entrance */
        gsap.from(`.${styles.rise}`, {
          y: 36,
          opacity: 0,
          duration: 1,
          ease: "expo.out",
          stagger: 0.09,
          delay: 0.15,
        });
        gsap.from(`.${styles.chip}`, {
          scale: 0.6,
          opacity: 0,
          duration: 0.8,
          ease: "back.out(1.7)",
          stagger: 0.07,
          delay: 0.7,
        });
        /* scroll-out: content drifts up and fades as the next act begins */
        gsap.to(`.${styles.inner}`, {
          yPercent: -12,
          opacity: 0.25,
          ease: "none",
          scrollTrigger: {
            trigger: rootRef.current,
            start: "40% top",
            end: "bottom top",
            scrub: true,
          },
        });
      });
    },
    { scope: rootRef },
  );

  return (
    <section ref={rootRef} className={styles.hero} id="hero">
      {/* depth stack: three decor layers drifting at different speeds */}
      <div className={styles.bg} aria-hidden="true">
        <Parallax speed={0.5} className={styles.glowA}>
          <span />
        </Parallax>
        <Parallax speed={0.3} className={styles.glowB}>
          <span />
        </Parallax>
        <Parallax speed={0.16} className={styles.watermark}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/01-cover-page/logo-mark-bg.svg" alt="" />
        </Parallax>
      </div>

      <div className={`container ${styles.inner}`}>
        <div className={styles.copy}>
          <p className={`kicker ${styles.rise}`}>IBDAI AL-FAKR CONSULTING</p>
          <HoverTitle
            as="h1"
            text="إبداع الفكر للاستشارات"
            className={`h-display ${styles.title}`}
            entrance="load"
          />
          <p className={`${styles.lede} ${styles.rise}`}>
            الشريك الاستراتيجي للتحول الرقمي والحلول الهندسية المتقدمة — نوطّن
            المعرفة البرمجية ونبني السيادة الرقمية للقطاعات الحكومية والخاصة في
            المملكة.
          </p>
          <div className={`${styles.actions} ${styles.rise}`}>
            <MagneticButton href="#contact" className={styles.primaryBtn}>
              احجز استشارة تقنية
              <span className={styles.btnArrow} aria-hidden="true">
                ↗
              </span>
            </MagneticButton>
            <a href="#about" className={styles.ghostBtn}>
              اكتشف المزيد
            </a>
          </div>
        </div>

        <div className={styles.stage}>
          <FxCanvas
            effect="latentField"
            className={styles.sphere}
            opts={{ speed: 1, intensity: 1, pointerFollow: true }}
            fallbackSrc="/fx/latent-field-sphere.png"
          />
          {CHIPS.map((chip, i) => (
            <span
              key={chip}
              className={`${styles.chip} ${styles[`chip${i}` as keyof typeof styles]}`}
            >
              {chip}
            </span>
          ))}
        </div>
      </div>

      <div className={styles.scrollCue} aria-hidden="true">
        <span className={styles.scrollDot} />
      </div>
    </section>
  );
}
