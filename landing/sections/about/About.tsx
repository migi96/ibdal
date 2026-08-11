import Image from "next/image";
import { FxCanvas } from "@/components/three/FxCanvas";
import { HoverTitle } from "@/components/typography/HoverTitle";
import { Parallax } from "@/components/motion/Parallax";
import { Reveal } from "@/components/motion/Reveal";
import { TiltCard } from "@/components/motion/TiltCard";
import styles from "./About.module.css";

const BULLETS = [
  "بنية برمجية وهندسية مطورة محلياً بالكامل",
  "توافق مطلق مع ضوابط هيئة الأمن السيبراني السعودية",
  "خبرات وطنية متمكنة تقود التحول الرقمي",
];

const PILLARS = [
  {
    icon: "/assets/07-about-us-detail-2/icon-lock-3d.png",
    num: "٠1",
    title: "١٠٠٪ عمليات محلية",
    body: "كافة العمليات الاستشارية والتحليلية تتم بأيدٍ وطنية وداخل حدود المملكة لضمان أعلى مستويات السرية والأمن.",
    speed: 0.07,
  },
  {
    icon: "/assets/07-about-us-detail-2/icon-shield-3d.png",
    num: "٠2",
    title: "سيادة البيانات الكاملة",
    body: "حوكمة شاملة لتدفق البيانات وتطبيق معايير مشددة تمنع الاستضافة الخارجية بما يتوافق مع الأنظمة الوطنية.",
    speed: 0.13,
  },
  {
    icon: "/assets/07-about-us-detail-2/icon-target-3d.png",
    num: "٠3",
    title: "بنية تحتية وطنية",
    body: "الاستفادة الكاملة من البنى السحابية المرخصة والمحلية، مما يعزز سرعة الاستجابة ويمنع مخاطر التوقف.",
    speed: 0.19,
  },
];

export function About() {
  return (
    <section id="about" className={`section ${styles.about}`}>
      {/* depth stack: wireframe sphere, 3D logo and a soft wash, each on its own scroll speed */}
      <div className={styles.decor} aria-hidden="true">
        <Parallax speed={0.3} className={styles.sphere}>
          <Image
            src="/assets/03-about-us-opener/wireframe-sphere.png"
            alt=""
            width={2000}
            height={1333}
            sizes="(max-width: 900px) 90vw, 54vw"
          />
        </Parallax>
        <Parallax speed={0.5} className={styles.logoFloat}>
          <FxCanvas
            effect="broadcast"
            fallbackSrc="/assets/03-about-us-opener/logo-3d.png"
            className={styles.logoCanvas}
            opts={{ speed: 1, intensity: 1, pointerFollow: false }}
          />
        </Parallax>
        <Parallax speed={0.18} className={styles.wash}>
          <span />
        </Parallax>
      </div>

      <div className={`container ${styles.inner}`}>
        {/* ---- opener: نبذة عنا ---- */}
        <div className={styles.opener}>
          <Reveal>
            <p className={`kicker ${styles.brandKicker}`}>
              <span dir="ltr">IBDAI AL-FAKR</span>
            </p>
          </Reveal>
          <HoverTitle
            as="h2"
            text="نبـــــــــذة عـنــــــا"
            className={`h-display ${styles.title}`}
            entrance="scroll"
          />
          <Reveal childSelector={`.${styles.rise}`} delay={0.12}>
            <div className={`divider ${styles.rise} ${styles.openerDivider}`} />
            <p className={`${styles.intro} ${styles.rise}`}>
              تأسست شركة <span className={styles.hl}>إبداع الفكر للاستشارات</span>{" "}
              لتكون <span className={styles.hl}>الشريك الاستراتيجي الأول</span>{" "}
              للقطاعات الحكومية والخاصة في تقديم الاستشارات الهندسية المتقدمة،
              وحوكمة التقنية، وبناء البنى التحتية المتوافقة مع تطلعات المستقبل
              الرقمي للمملكة.
            </p>
          </Reveal>
        </div>

        {/* ---- founding & data sovereignty ---- */}
        <Reveal className={styles.blockHead} childSelector={`.${styles.rise}`}>
          <p className={`${styles.blockAr} ${styles.rise}`}>
            التأسيس والسيادة الوطنية
          </p>
          <p className={`${styles.blockEn} ${styles.rise}`}>
            <span dir="ltr">FOUNDING &amp; DATA SOVEREIGNTY</span>
          </p>
        </Reveal>

        <div className={styles.founding}>
          <Reveal
            className={styles.foundingText}
            childSelector={`.${styles.rise}`}
          >
            <p className={`${styles.badge} ${styles.rise}`}>تأسست عام ٢٠٢٤</p>
            <h3 className={`${styles.foundingTitle} ${styles.rise}`}>
              ملتزمون بتــــوطين <span className={styles.fhl}>الخــــبرات</span>{" "}
              وبناء الحــــلول الرقمــــية المســــتقلة
            </h3>
            <p className={`${styles.foundingPara} ${styles.rise}`}>
              انطلاقاً من رؤية المملكة الطموحة، نعمل على تفعيل سيادة البيانات
              الكاملة محلياً وضمان توافق كافة حلول البرمجة والنظم مع التشريعات
              الوطنية للسيادة السيبرانية. تمتد خدماتنا لتشمل بناء الكوادر وتوطين
              المعرفة بشكل كامل داخل الأراضي السعودية.
            </p>
            <div className={`${styles.bullets} ${styles.rise}`}>
              {BULLETS.map((bullet) => (
                <div key={bullet} className={styles.bullet}>
                  <span className={styles.bulletIcon} aria-hidden="true">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/assets/04-about-us-detail-1/arrow-right.svg" alt="" />
                  </span>
                  <p>{bullet}</p>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.15}>
            <Parallax speed={0.12} className={styles.foundingArt}>
              <TiltCard className={styles.imageCard} maxTilt={6}>
                <Image
                  src="/assets/about/founder-visual.png"
                  alt="أحد كوادر إبداع الفكر"
                  width={380}
                  height={358}
                  sizes="(max-width: 900px) 86vw, 440px"
                />
              </TiltCard>
              {/* decorative cursor drifting in a slow zig-zag at the top-right */}
              <span className={styles.pointer} aria-hidden="true">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/about/pointer.png" alt="" className={styles.pointerImg} />
              </span>
            </Parallax>
          </Reveal>
        </div>

        {/* ---- data sovereignty pillars ---- */}
        <div className={styles.pillarsHead}>
          <Reveal>
            <p className={`kicker ${styles.pillarsKicker}`}>
              <span dir="ltr">DATA SOVEREIGNTY PILLARS</span>
            </p>
          </Reveal>
          <HoverTitle
            as="h3"
            text="حوكمة وسيادة البيانات الوطنية"
            className={`h-section ${styles.pillarsTitle}`}
            entrance="scroll"
          />
        </div>

        <Reveal
          className={styles.pillarGrid}
          childSelector={`.${styles.card}`}
          y={56}
          stagger={0.12}
        >
          {PILLARS.map((pillar) => (
            <TiltCard key={pillar.title} className={styles.card} maxTilt={6}>
              <span className={styles.cardLine} aria-hidden="true" />
              <div className={styles.cardTop}>
                <Parallax speed={pillar.speed} className={styles.cardIcon}>
                  <Image
                    src={pillar.icon}
                    alt=""
                    width={1200}
                    height={1200}
                    sizes="(max-width: 900px) 96px, 122px"
                  />
                </Parallax>
                <p className={styles.cardNum}>
                  <span dir="ltr">{pillar.num}</span>
                </p>
              </div>
              <h4 className={styles.cardTitle}>{pillar.title}</h4>
              <p className={styles.cardBody}>{pillar.body}</p>
            </TiltCard>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
