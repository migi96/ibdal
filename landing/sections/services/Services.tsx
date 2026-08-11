import type { FxName } from "@/lib/fx/loader";
import { HoverTitle } from "@/components/typography/HoverTitle";
import { Reveal } from "@/components/motion/Reveal";
import { Parallax } from "@/components/motion/Parallax";
import { FxCanvas } from "@/components/three/FxCanvas";
import styles from "./Services.module.css";

/* ============ Services — dark "services-variation-dark-split" ============
   Figma node 20:587. A royal-blue → near-black band: a centred gradient
   header, a 3×2 grid of glass cards (each with a live animated 3D icon), and
   a "ready to transform?" CTA panel pairing the brain light-up animation with
   the contact block. RTL, so the grid naturally fills right→left (01 top-right).

   This is a server-component shell: every animated part is an already-built
   client island (FxCanvas / HoverTitle / Reveal / Parallax). The card hover
   micro-interaction and all layout are pure CSS (transform/opacity only), so
   no custom GSAP — hence no "use client" here. */

interface Service {
  num: string;
  title: string;
  subtitle: string;
  /** animated 3D icon effect (see lib/fx/loader.ts) */
  effect: FxName;
  fallbackSrc: string;
}

const SERVICES: Service[] = [
  {
    num: "01",
    title: "الاستشارات في التحول الرقمي",
    subtitle: "تصميم وتنفيذ استراتيجيات التحول الرقمي",
    effect: "orbitCluster",
    fallbackSrc: "/fx/icons/orbit-cluster.png",
  },
  {
    num: "02",
    title: "تطوير البرمجيات المخصصة",
    subtitle: "حلول برمجية مبنية حسب احتياجاتكم",
    effect: "snapTogether",
    fallbackSrc: "/fx/icons/snap-together.png",
  },
  {
    num: "03",
    title: "حلول الذكاء الاصطناعي",
    subtitle: "أنظمة ذكية لتحسين الأداء المؤسسي",
    effect: "scanField",
    fallbackSrc: "/fx/icons/scan-field.png",
  },
  {
    num: "04",
    title: "الأمن السيبراني",
    subtitle: "حماية شاملة للبنية التحتية الرقمية",
    effect: "guardPulse",
    fallbackSrc: "/fx/icons/guard-pulse.png",
  },
  {
    num: "05",
    title: "الحوسبة السحابية",
    subtitle: "بنية سحابية آمنة وقابلة للتوسع",
    effect: "focusPull",
    fallbackSrc: "/fx/icons/focus-pull.png",
  },
  {
    num: "06",
    title: "إدارة البيانات والتحليلات",
    subtitle: "تحويل البيانات إلى رؤى لاتخاذ القرارات",
    effect: "segmentSweep",
    fallbackSrc: "/fx/icons/segment-sweep.png",
  },
];

interface Contact {
  label: string;
  value: string;
  dir: "ltr" | "rtl";
  href?: string;
}

const CONTACTS: Contact[] = [
  {
    label: "البريد الإلكتروني",
    value: "info@ibdai.sa",
    href: "mailto:info@ibdai.sa",
    dir: "ltr",
  },
  {
    label: "الهاتف",
    value: "+966 11 000 0000",
    href: "tel:+966110000000",
    dir: "ltr",
  },
  {
    label: "المقر الرئيسي",
    value: "الرياض، حي الملقا، طريق الملك فهد",
    dir: "rtl",
  },
];

const FX_OPTS = { speed: 1, intensity: 1, pointerFollow: true } as const;

export function Services() {
  return (
    <section id="services" className={`section ${styles.services}`}>
      {/* decorative parallax glow for depth (clipped by the section) */}
      <Parallax speed={0.2} className={styles.glow}>
        <span aria-hidden="true" className={styles.glowOrb} />
      </Parallax>

      <div className={`container ${styles.inner}`}>
        {/* ---------------- header ---------------- */}
        <header className={styles.head}>
          <HoverTitle
            as="h2"
            text="خـدمـــاتـنــــا الاسـتـشــــاريـة"
            className={`h-section ${styles.title}`}
            entrance="scroll"
          />
          <Reveal className={styles.subWrap} delay={0.1}>
            <p className={styles.subtitle}>
              خبرات هندسية رصينة تبني جيل الغد الرقمي للمملكة
            </p>
          </Reveal>
        </header>

        {/* ---------------- 3 × 2 service grid ---------------- */}
        <Reveal
          className={styles.grid}
          childSelector={`.${styles.card}`}
          y={40}
          stagger={0.08}
        >
          {SERVICES.map((s) => (
            <article key={s.num} className={styles.card}>
              <div className={styles.iconStage}>
                <FxCanvas
                  effect={s.effect}
                  fallbackSrc={s.fallbackSrc}
                  className={styles.iconCanvas}
                  opts={FX_OPTS}
                />
              </div>

              <div className={styles.cardText}>
                <span className={styles.cardNum} dir="ltr">
                  {s.num}
                </span>
                <h3 className={styles.cardTitle}>{s.title}</h3>
                <p className={styles.cardSub}>{s.subtitle}</p>
              </div>
            </article>
          ))}
        </Reveal>

        {/* ---------------- CTA panel ---------------- */}
        <Reveal className={styles.cta} childSelector={`.${styles.ctaInner}`}>
          <div className={styles.ctaInner}>
            <div className={styles.brainStage}>
              <FxCanvas
                effect="lightUp"
                fallbackSrc="/fx/icons/light-up-lit.png"
                className={styles.brainCanvas}
                opts={FX_OPTS}
              />
            </div>

            <div className={styles.ctaBody}>
              <HoverTitle
                as="h3"
                text="هل مؤسستـك جاهـزة للتحـول الرقمـي الحقيقـي؟"
                className={styles.ctaTitle}
                entrance="scroll"
              />
              <p className={styles.ctaText}>
                دعنا نترجم تحدياتك التشغيلية إلى أنظمة ذكية، آمنة، وقابلة للتوسع.
                فريقنا من الخبراء جاهز لبناء خارطة الطريق الخاصة بك.
              </p>

              <a className={styles.ctaButton} href="mailto:info@ibdai.sa">
                <span>احجز استشارة تقنية</span>
                <span className={styles.ctaArrow} aria-hidden="true">
                  ↗
                </span>
              </a>

              <div className={styles.chips}>
                {CONTACTS.map((c) => {
                  const body = (
                    <>
                      <span className={styles.chipLabel}>{c.label}</span>
                      <span className={styles.chipValue} dir={c.dir}>
                        {c.value}
                      </span>
                    </>
                  );
                  return c.href ? (
                    <a key={c.label} className={styles.chip} href={c.href}>
                      {body}
                    </a>
                  ) : (
                    <div key={c.label} className={styles.chip}>
                      {body}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Reveal>

        {/* ---------------- footer line ---------------- */}
        <div className={styles.footer}>
          <span dir="ltr">IBDAI AL-FAKR</span>
        </div>
      </div>
    </section>
  );
}
