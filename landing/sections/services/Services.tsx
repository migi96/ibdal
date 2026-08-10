"use client";

import { useRef } from "react";
import { gsap, useGSAP, MOTION_OK, DESKTOP_POINTER } from "@/lib/motion/gsap";
import { HoverTitle } from "@/components/typography/HoverTitle";
import { Reveal } from "@/components/motion/Reveal";
import { Parallax } from "@/components/motion/Parallax";
import { TiltCard } from "@/components/motion/TiltCard";
import styles from "./Services.module.css";

interface Service {
  num: string;
  /** Latin kicker (split from the deck's pair kickers) */
  kicker: string;
  /** Arabic group heading from the deck's accent column */
  group: string;
  icon: string;
  title: string;
  desc: string;
}

const SERVICES: Service[] = [
  {
    num: "01",
    kicker: "DIGITAL TRANSFORMATION",
    group: "التحول الرقمي وتطوير البرمجيات",
    icon: "/assets/16-services-1-2/icon-global.svg",
    title: "الاستشارات في التحول الرقمي",
    desc: "تمكين المؤسسات من تبني التقنيات الحديثة وإعادة صياغة العمليات التشغيلية لتحقيق الكفاءة القصوى والابتكار المستمر متوافقاً مع أهداف التحول الاستراتيجي الوطني.",
  },
  {
    num: "02",
    kicker: "CUSTOM DEVELOPMENT",
    group: "التحول الرقمي وتطوير البرمجيات",
    icon: "/assets/16-services-1-2/icon-computer-programming.svg",
    title: "تطوير البرمجيات المخصصة وبناء النظم",
    desc: "تصميم وتطوير حلول برمجية مخصصة وعالية الأداء تتوافق بالكامل مع متطلبات الأعمال التقنية المعقدة، باستخدام أحدث الأطر البرمجية وقواعد البيانات الآمنة.",
  },
  {
    num: "03",
    kicker: "CYBERSECURITY",
    group: "الذكاء الاصطناعي والأمن السيبراني",
    icon: "/assets/17-services-3-4/icon-security-lock.svg",
    title: "الأمن السيبراني الشامل والدفاع الرقمي",
    desc: "صياغة وتطبيق استراتيجيات دفاعية صارمة لحماية البنية التحتية، واكتشاف الثغرات وتقييم المخاطر السيبرانية لضمان أمان العمليات والامتثال مع التوجيهات والضوابط الوطنية للأمن.",
  },
  {
    num: "04",
    kicker: "ARTIFICIAL INTELLIGENCE",
    group: "الذكاء الاصطناعي والأمن السيبراني",
    icon: "/assets/17-services-3-4/icon-ai-brain.svg",
    title: "حلول الذكاء الاصطناعي المتقدمة",
    desc: "تطوير النماذج الذكية وتكامل الذكاء الاصطناعي التوليدي والسيادي داخل النظم المؤسسية، لزيادة الكفاءة وتسهيل اتخاذ القرارات وحماية المستندات والبيانات الاستراتيجية للمنشآت.",
  },
  {
    num: "05",
    kicker: "CLOUD COMPUTING",
    group: "الحوسبة السحابية وإدارة البيانات",
    icon: "/assets/18-services-5-6/icon-route.svg",
    title: "الحوسبة السحابية وهندسة النظم",
    desc: "تصميم وإدارة الهياكل السحابية الهجينة والمحلية لضمان الاستمرارية وقابلية التوسع مع تطبيق أفضل الممارسات في حوكمة البنية السحابية وإدارتها سيادياً لحماية عمليات الجهات الحيوية.",
  },
  {
    num: "06",
    kicker: "DATA MANAGEMENT",
    group: "الحوسبة السحابية وإدارة البيانات",
    icon: "/assets/18-services-5-6/icon-database.svg",
    title: "إدارة البيانات والتحليلات المتقدمة",
    desc: "هندسة البيانات وتأسيس مستودعات البيانات الضخمة مع تطبيق نماذج تحليلية ذكية لتحويل البيانات الخام إلى رؤى استراتيجية تدعم اتخاذ القرارات.",
  },
];

/* Pinned horizontal gallery: on desktop fine-pointer + motion-ok screens the
   stage pins for one full pass and the panel row scrubs sideways. RTL nuance:
   with dir=rtl the flex row starts flush at the RIGHT edge and overflows to
   the left, so panning first → last panel means translating the track toward
   +x. Everything is measured in functions (invalidateOnRefresh) — no
   hardcoded distances. All other pointers get a plain vertical stack. */
export function Services() {
  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const stage = stageRef.current;
      const track = trackRef.current;
      if (!stage || !track) return;

      const mm = gsap.matchMedia();
      mm.add(`${MOTION_OK} and ${DESKTOP_POINTER}`, () => {
        const distance = () => track.scrollWidth - stage.clientWidth;

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: stage,
            pin: true,
            scrub: 1,
            start: "top top",
            end: () => "+=" + distance(),
            invalidateOnRefresh: true,
            anticipatePin: 1,
          },
        });

        /* main pan: 0 → +(trackWidth − viewport), reads first → last in RTL */
        tl.to(track, { x: () => distance() }, 0);

        /* inner parallax — layers lag the pan at different ratios, all tied
           to the same scrub timeline */
        tl.to(track.querySelectorAll(`.${styles.ghost}`), { xPercent: -36 }, 0);
        tl.to(
          track.querySelectorAll(`.${styles.orb}`),
          { x: () => -distance() * 0.04 },
          0,
        );
        tl.to(track.querySelectorAll(`.${styles.iconWrap}`), { x: -18 }, 0);

        /* progress rail fills right → left (transform-only) */
        const bar = stage.querySelector(`.${styles.progressBar}`);
        if (bar) {
          tl.fromTo(
            bar,
            { scaleX: 0, transformOrigin: "100% 50%" },
            { scaleX: 1 },
            0,
          );
        }
      });
    },
    { scope: rootRef },
  );

  return (
    <section ref={rootRef} className={styles.services} id="services">
      {/* ------- header (slide 15) ------- */}
      <div className={`container ${styles.head}`}>
        <Parallax speed={0.18} className={styles.headGhost}>
          <span dir="ltr" aria-hidden="true">
            06
          </span>
        </Parallax>
        <p className="kicker" dir="ltr">
          SERVICES &amp; CAPABILITIES
        </p>
        <HoverTitle
          as="h2"
          text="خدماتنــــا الاستشاريّــــة"
          className={`h-section ${styles.title}`}
          entrance="scroll"
        />
        <Reveal className={styles.headMeta} childSelector={`.${styles.metaItem}`}>
          <div className={`divider ${styles.metaItem}`} />
          <p className={`${styles.subtitle} ${styles.metaItem}`}>
            نقدم حلولاً هندسية متكاملة واستشارات تقنية متطورة تصيغ معالم التحول
            الرقمي الآمن وتحقق أعلى مستويات الكفاءة والامتثال السيادي.
          </p>
        </Reveal>
      </div>

      {/* ------- pinned gallery ------- */}
      <div ref={stageRef} className={styles.stage}>
        <div ref={trackRef} className={styles.track}>
          {SERVICES.map((s) => (
            <article key={s.num} className={styles.panel}>
              <aside className={styles.accent}>
                <div className={styles.accentHead}>
                  <p className={styles.accentGroup}>{s.group}</p>
                  <p className={styles.accentKicker} dir="ltr">
                    {s.kicker}
                  </p>
                </div>
                <p className={styles.accentIndex} dir="ltr">
                  {s.num}
                  <span> / 06</span>
                </p>
              </aside>

              <div className={styles.content}>
                <span className={styles.orb} aria-hidden="true" />
                <p className={styles.ghost} dir="ltr" aria-hidden="true">
                  {s.num}
                </p>
                <Reveal className={styles.cardReveal}>
                  <TiltCard maxTilt={4}>
                    <div className={styles.card}>
                      <span className={styles.iconWrap} aria-hidden="true">
                        <span className={styles.iconBubble}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={s.icon} alt="" />
                        </span>
                      </span>
                      <div className={styles.cardText}>
                        <h3>{s.title}</h3>
                        <p>{s.desc}</p>
                      </div>
                      <span className={styles.chev} aria-hidden="true">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/assets/16-services-1-2/arrow-chevron.svg"
                          alt=""
                        />
                      </span>
                    </div>
                  </TiltCard>
                </Reveal>
              </div>
            </article>
          ))}
        </div>

        <div className={styles.progress} aria-hidden="true">
          <span className={styles.progressBar} />
        </div>
      </div>
    </section>
  );
}
