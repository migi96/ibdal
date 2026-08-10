"use client";

import { useRef } from "react";
import { gsap, useGSAP, MOTION_OK } from "@/lib/motion/gsap";
import { HoverTitle } from "@/components/typography/HoverTitle";
import { Reveal } from "@/components/motion/Reveal";
import styles from "./Methodology.module.css";

/* Connector geometry lifted from the deck's wave-path.svg
   (starts at x=820 — the inline-start edge of the RTL layout — so the
   dashoffset draw flows phase 1 → 3 with the reading direction). */
const WAVE_D =
  "M820 100C720 100 680 30 600 30C520 30 500 170 410 170C320 170 300 60 220 60C140 60 100 100 0 100";

interface Phase {
  num: string;
  label: string;
  title: string;
  desc: string;
  icon: string;
  /** middle phase mirrors the deck: card above the line, badge below */
  flip?: boolean;
}

const PHASES: Phase[] = [
  {
    num: "1",
    label: "(Discover)",
    title: "اكـــتـشـــف",
    desc: "دراسة وتحليل الوضع الراهن وتحديد الفجوات والمتطلبات الأساسية بمشاركة أصحاب المصلحة.",
    icon: "icon-search.svg",
  },
  {
    num: "2",
    label: "(Build)",
    title: "ابـــــنِ",
    desc: "تطوير وبناء الأنظمة والحلول الهندسية بأعلى المعايير، مع فحص واختبار دائم للثغرات البرمجية والخصوصية.",
    icon: "icon-workflow.svg",
    flip: true,
  },
  {
    num: "3",
    label: "(Scale)",
    title: "وسّــــــع",
    desc: "نقل الأنظمة لحيز التشغيل والإنتاج الفعلي مع المتابعة المستمرة، والدعم التقني، وقياس الكفاءة التشغيلية للأصول.",
    icon: "icon-arrow-expand.svg",
  },
];

export function Methodology() {
  const rootRef = useRef<HTMLElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const path = pathRef.current;
        const timeline = timelineRef.current;
        if (!path || !timeline) return;
        const length = path.getTotalLength();
        gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
        gsap.to(path, {
          strokeDashoffset: 0,
          ease: "none",
          scrollTrigger: {
            trigger: timeline,
            start: "top 80%",
            end: "bottom 60%",
            scrub: true,
          },
        });
      });
    },
    { scope: rootRef },
  );

  return (
    <section
      ref={rootRef}
      className={`section ${styles.methodology}`}
      id="methodology"
    >
      <div className="container">
        <div className={styles.head}>
          <Reveal>
            <p className="kicker">
              <span dir="ltr">METHODOLOGY &amp; APPROACH</span>
            </p>
          </Reveal>
          <Reveal delay={0.06}>
            <div className="divider" />
          </Reveal>
          <HoverTitle
            as="h2"
            text="منهجيتنــــا في العمل"
            className={`h-section ${styles.title}`}
          />
          <Reveal delay={0.12}>
            <p className={styles.tagline}>اكتـــــشف . ابـــــنِ . وسّـــــع</p>
          </Reveal>
          <Reveal delay={0.18}>
            <p className={styles.desc}>
              منهجية ثلاثية واضحة ومجربة تضمن التدرج السليم للمشروعات والتحقق
              الكامل من جودة البنية البرمجية ونضوجها الأمني قبل النشر النهائي.
            </p>
          </Reveal>
        </div>

        <div className={styles.subhead}>
          <Reveal>
            <p className="kicker">
              <span dir="ltr">THREE-PHASE SERVICE CYCLE</span>
            </p>
          </Reveal>
          <Reveal delay={0.08}>
            <h3 className={styles.subtitle}>مراحل التنفيذ ومسار المنهجية</h3>
          </Reveal>
        </div>

        <div ref={timelineRef} className={styles.timeline}>
          <svg
            className={styles.wave}
            viewBox="0 0 820 200"
            preserveAspectRatio="none"
            aria-hidden="true"
            focusable="false"
          >
            <path
              ref={pathRef}
              className={styles.wavePath}
              d={WAVE_D}
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          <Reveal
            className={styles.grid}
            childSelector={`.${styles.col}`}
            stagger={0.2}
            y={54}
          >
            {PHASES.map((phase) => (
              <article
                key={phase.num}
                className={`${styles.col} ${phase.flip ? styles.colFlip : ""}`}
              >
                <p className={styles.ghost} dir="ltr" aria-hidden="true">
                  {phase.num}
                </p>
                <span className={styles.badge}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/assets/24-methodology-timeline/${phase.icon}`}
                    alt=""
                    loading="lazy"
                  />
                </span>
                <div className={styles.card}>
                  <p className={styles.label}>
                    <span dir="ltr">{phase.label}</span>
                  </p>
                  <h4 className={styles.phaseTitle}>{phase.title}</h4>
                  <p className={styles.phaseDesc}>{phase.desc}</p>
                </div>
              </article>
            ))}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
