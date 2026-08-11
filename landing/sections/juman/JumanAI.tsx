"use client";

import { useRef } from "react";
import { gsap, useGSAP, MOTION_OK } from "@/lib/motion/gsap";
import { FxCanvas } from "@/components/three/FxCanvas";
import MagicRings from "@/components/three/MagicRings";
import { HoverTitle } from "@/components/typography/HoverTitle";
import { Parallax } from "@/components/motion/Parallax";
import { Reveal } from "@/components/motion/Reveal";
import { TiltCard } from "@/components/motion/TiltCard";
import styles from "./JumanAI.module.css";

/* copy sourced verbatim from deck slides 12–14 */
const CHIPS = [
  {
    icon: "/assets/12-juman-ai-intro/icon-customer-service.svg",
    label: "متاح 24/7",
    pos: "chipSupport",
  },
  {
    icon: "/assets/12-juman-ai-intro/icon-security-lock.svg",
    label: "بياناتك خاصة وآمنة",
    pos: "chipSecure",
  },
  {
    icon: "/assets/12-juman-ai-intro/icon-link.svg",
    label: "يتكامل مع أنظمتك",
    pos: "chipIntegrate",
  },
  {
    icon: "/assets/12-juman-ai-intro/icon-local-run.svg",
    label: "تشغيل محلي",
    pos: "chipLocal",
  },
] as const;

export function JumanAI() {
  const rootRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        /* chips pop around the glossy letters once the stage enters */
        gsap.from(`.${styles.chip}`, {
          scale: 0.6,
          opacity: 0,
          duration: 0.8,
          ease: "back.out(1.7)",
          stagger: 0.09,
          scrollTrigger: {
            trigger: `.${styles.introStage}`,
            start: "top 78%",
            once: true,
          },
        });
        /* idle bob for the أب letters (composes with the Parallax wrapper) */
        gsap.to(`.${styles.letterFloat}`, {
          y: 18,
          rotation: 2.2,
          duration: 3.8,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
        });
        /* connector lines draw outward from the docking field */
        gsap.from(`.${styles.line}`, {
          scaleX: 0,
          opacity: 0,
          duration: 1.1,
          ease: "expo.out",
          stagger: 0.12,
          scrollTrigger: {
            trigger: `.${styles.archStage}`,
            start: "top 75%",
            once: true,
          },
        });
      });
    },
    { scope: rootRef },
  );

  return (
    <section ref={rootRef} className={styles.juman} id="juman">
      {/* drifting depth glows shared by all three acts */}
      <div className={styles.bg} aria-hidden="true">
        <Parallax speed={0.4} className={styles.glowA}>
          <span />
        </Parallax>
        <Parallax speed={0.22} className={styles.glowB}>
          <span />
        </Parallax>
        <Parallax speed={0.14} className={styles.glowC}>
          <span />
        </Parallax>
      </div>

      {/* ————— Act 1 · intro ————— */}
      <div className={`${styles.act} ${styles.intro}`}>
        <div className={`container ${styles.introGrid}`}>
          <Reveal className={styles.introCopy} childSelector={`.${styles.rise}`}>
            <p className={`kicker ${styles.rise}`}>
              <span dir="ltr">JUMAN AI</span>
            </p>
            <HoverTitle
              as="h2"
              text="جُمان AI"
              className={`h-display ${styles.title}`}
              entrance="scroll"
            />
            <span className={`${styles.launchPill} ${styles.rise}`}>
              تدشين ٢٠٢٦
            </span>
            <p className={`${styles.subtitle} ${styles.rise}`}>
              الذكاء الاصطناعي السيادي · المساعد المؤسسي الأول للغتنا العربية
            </p>
            <p className={`${styles.desc} ${styles.rise}`}>
              محرك لغوي ذكي مخصص ومطور محلياً، يعمل بالكامل داخل بيئة الخوادم
              السيادية لشركتكم لتوفير حماية كاملة للمستندات والقرارات
              الاستراتيجية.
            </p>
          </Reveal>

          <div className={styles.introStage}>
            <Parallax speed={0.2} className={styles.letterWrap}>
              <div className={`${styles.letterFloat} ${styles.orbStage}`}>
                <FxCanvas
                  effect="counterRotate"
                  fallbackSrc="/fx/counter-rotate-orb-1.png"
                  className={styles.orbCanvas}
                  opts={{ speed: 1, intensity: 1, pointerFollow: true }}
                />
              </div>
            </Parallax>
            <div className={styles.chipLayer}>
              {CHIPS.map(({ icon, label, pos }) => (
                <span key={label} className={`${styles.chip} ${styles[pos]}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={icon} alt="" className={styles.chipIcon} />
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ————— Act 2 · capabilities ————— */}
      <div className={`${styles.act} ${styles.caps}`}>
        <div className={styles.capsRings} aria-hidden="true">
          <MagicRings
            color="#A855F7"
            colorTwo="#6366F1"
            ringCount={6}
            speed={1}
            attenuation={10}
            lineThickness={2}
            baseRadius={0.35}
            radiusStep={0.1}
            scaleRate={0.1}
            opacity={1}
            blur={0}
            noiseAmount={0.1}
            rotation={0}
            ringGap={1.5}
            fadeIn={0.7}
            fadeOut={0.5}
            followMouse={false}
            mouseInfluence={0.2}
            hoverScale={1.2}
            parallax={0.05}
            clickBurst={false}
          />
        </div>

        <div className={`container ${styles.capsInner}`}>
          <Reveal className={styles.actHead} childSelector={`.${styles.rise}`}>
            <p className={`kicker ${styles.rise}`}>
              <span dir="ltr">JUMAN AI CAPABILITIES</span>
            </p>
          </Reveal>
          <HoverTitle
            as="h3"
            text="مـــزايا الــذكـــاء المــــؤسسي"
            className={`h-section ${styles.title} ${styles.actTitle}`}
          />

          <Reveal className={styles.capGrid} childSelector={`.${styles.card}`}>
            <TiltCard className={`${styles.card} ${styles.cardHero}`} maxTilt={5}>
              <div className={styles.cardHead}>
                <span className={styles.cardTag} dir="ltr">
                  HERO-01
                </span>
                <span className={styles.cardIcon} aria-hidden="true">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/assets/13-juman-ai-capabilities/icon-language-skill.svg"
                    alt=""
                  />
                </span>
              </div>
              <div className={`${styles.heroFig} ${styles.glassStage}`}>
                <FxCanvas
                  effect="glassSuspension"
                  fallbackSrc="/assets/13-juman-ai-capabilities/3d-arabic-letter.png"
                  className={styles.glassCanvas}
                  opts={{ speed: 1, intensity: 1, pointerFollow: true }}
                />
              </div>
              <div className={styles.cardText}>
                <h4>معالجة اللغة الطبيعية العربية</h4>
                <p>
                  فهم عميق للهجات العربية المتعددة والمصطلحات والتشريعات
                  الهندسية والتنظيمية المحلية بدقة لغوية متناهية وبلا أي أخطاء
                  تفسيرية.
                </p>
              </div>
            </TiltCard>

            <TiltCard className={`${styles.card} ${styles.cardSide}`} maxTilt={6}>
              <div className={styles.cardHead}>
                <span className={styles.cardTag} dir="ltr">
                  02
                </span>
                <span className={styles.cardIcon} aria-hidden="true">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/assets/13-juman-ai-capabilities/icon-link-square.svg"
                    alt=""
                  />
                </span>
              </div>
              <div className={styles.cardText}>
                <h4>التكامل مع النظم والبيانات</h4>
                <p>
                  ارتباط كامل مباشر مع أنظمة إدارة موارد المؤسسات{" "}
                  <span dir="ltr">(ERP)</span> ومستودعات البيانات لتمكين صناع
                  القرار من استخراج رؤى فورية.
                </p>
              </div>
              <div className={`${styles.cardFig} ${styles.loopStage}`}>
                <FxCanvas
                  effect="dataUplink"
                  fallbackSrc="/fx/data-uplink-stack.png"
                  className={styles.loopCanvas}
                  opts={{ speed: 1, intensity: 1, pointerFollow: true }}
                />
              </div>
            </TiltCard>

            <TiltCard className={`${styles.card} ${styles.cardSide}`} maxTilt={6}>
              <div className={styles.cardHead}>
                <span className={styles.cardTag} dir="ltr">
                  03
                </span>
                <span className={styles.cardIcon} aria-hidden="true">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/assets/13-juman-ai-capabilities/icon-segment.svg"
                    alt=""
                  />
                </span>
              </div>
              <div className={styles.cardText}>
                <h4>التعلم والتحسين المستمر</h4>
                <p>
                  آلية ذكاء متطورة تمكن النظام من مراجعة جودة إجاباته والتأقلم
                  الذاتي الدائم مع التحديثات التنظيمية والمهام والمستندات
                  الجديدة.
                </p>
              </div>
              <div className={`${styles.cardFig} ${styles.loopStage}`}>
                <FxCanvas
                  effect="flowLoop"
                  fallbackSrc="/fx/flow-loop-loop.png"
                  className={styles.loopCanvas}
                  opts={{ speed: 1, intensity: 1 }}
                />
              </div>
            </TiltCard>
          </Reveal>
        </div>
      </div>

      {/* ————— Act 3 · architecture ————— */}
      <div className={`${styles.act} ${styles.arch}`}>
        <div className="container">
          <Reveal className={styles.actHead} childSelector={`.${styles.rise}`}>
            <p className={`kicker ${styles.rise}`}>
              <span dir="ltr">JUMAN AI ARCHITECTURE</span>
            </p>
          </Reveal>
          <HoverTitle
            as="h3"
            text="البنية الفنية والربط"
            className={`h-section ${styles.title} ${styles.actTitle}`}
          />

          <div className={styles.archGrid}>
            <div className={styles.archCopy}>
              <Reveal childSelector={`.${styles.rise}`} className={styles.archIntro}>
                <span className={`${styles.sovereignPill} ${styles.rise}`}>
                  بنية محلية سيادية ١٠٠٪
                </span>
                <p className={`${styles.archDesc} ${styles.rise}`}>
                  مخطط تكامل جُمان <span dir="ltr">AI</span> مع القنوات
                  التشغيلية للشركة لضمان تدفق سريع ومستدام للبيانات والمعرفة
                  بمرونة عالية.
                </p>
              </Reveal>

              <Reveal className={styles.spokes} childSelector={`.${styles.spoke}`}>
                <div className={styles.spoke}>
                  <span className={styles.spokeIcon} aria-hidden="true">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/assets/14-juman-ai-architecture/icon-computer-programming.svg"
                      alt=""
                    />
                  </span>
                  <span className={styles.spokeLabel}>
                    نظام <span dir="ltr">ERP</span>
                  </span>
                </div>
                <div className={styles.spoke}>
                  <span className={styles.spokeIcon} aria-hidden="true">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/assets/14-juman-ai-architecture/icon-user-multiple.svg"
                      alt=""
                    />
                  </span>
                  <span className={styles.spokeLabel}>
                    إدارة العملاء <span dir="ltr">CRM</span>
                  </span>
                </div>
                <div className={styles.spoke}>
                  <span className={styles.spokeIcon} aria-hidden="true">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/assets/14-juman-ai-architecture/icon-database.svg"
                      alt=""
                    />
                  </span>
                  <span className={styles.spokeLabel}>قواعد البيانات</span>
                </div>
              </Reveal>
            </div>

            <div className={styles.archStage}>
              <span className={`${styles.line} ${styles.lineErp}`} aria-hidden="true" />
              <span className={`${styles.line} ${styles.lineCrm}`} aria-hidden="true" />
              <span className={`${styles.line} ${styles.lineDb}`} aria-hidden="true" />
              <span className={`${styles.line} ${styles.lineComm}`} aria-hidden="true" />
              <FxCanvas
                effect="dockingField"
                fallbackSrc="/fx/docking-field-tiles.png"
                className={styles.archCanvas}
                opts={{ speed: 1, intensity: 1, pointerFollow: true }}
              />
            </div>

            <Reveal className={styles.commCard}>
              <span className={styles.spokeIcon} aria-hidden="true">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/14-juman-ai-architecture/icon-mail.svg" alt="" />
              </span>
              <h4>البريد والاتصال</h4>
              <p>ربط مباشر لقنوات التواصل الرسمية لتمكين الاستجابة الذكية.</p>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
