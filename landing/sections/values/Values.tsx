import Image from "next/image";
import { HoverTitle } from "@/components/typography/HoverTitle";
import { Parallax } from "@/components/motion/Parallax";
import { Reveal } from "@/components/motion/Reveal";
import { TiltCard } from "@/components/motion/TiltCard";
import styles from "./Values.module.css";

type ValueArea =
  | "innovation"
  | "sovereignty"
  | "quality"
  | "security"
  | "focus"
  | "open";

interface ValueCard {
  area: ValueArea;
  title: string;
  desc: string;
  img: string;
  wide?: boolean;
}

/* Copy is sourced verbatim from deck slides 09 + 10 */
const VALUES: ValueCard[] = [
  {
    area: "innovation",
    title: "الابتكار التقني المستمر",
    desc: "نصيغ حلولاً هندسية سبّاقة توظف أحدث تقنيات الذكاء الاصطناعي وهندسة النظم لبناء مستقبل رقمي واعد.",
    img: "/assets/10-values-bento/innovation-chip.png",
    wide: true,
  },
  {
    area: "sovereignty",
    title: "سيادة البيانات والخصوصية",
    desc: "نلتزم بتوطين التقنية بالكامل لضمان استقلالية البيانات الحيوية للمؤسسات الشريكة وحمايتها سيادياً.",
    img: "/assets/10-values-bento/data-sovereignty-lock.png",
  },
  {
    area: "quality",
    title: "الجودة الهندسية",
    desc: "مخرجات دقيقة تتطابق مع المعايير القياسية العالمية.",
    img: "/assets/10-values-bento/engineering-gears.png",
  },
  {
    area: "security",
    title: "الأمن السيبراني المتكامل",
    desc: "أطر حوكمة مشددة تمنع الثغرات وتحمي الأصول التقنية.",
    img: "/assets/10-values-bento/cyber-security-server.png",
  },
  {
    area: "focus",
    title: "التركيز على المستفيد",
    desc: "تصميم حلول مخصصة تتماشى مع الأهداف التشغيلية للجهات.",
    img: "/assets/10-values-bento/user-focus-heads.png",
  },
  {
    area: "open",
    title: "المصادر المفتوحة",
    desc: "الاستفادة الاستراتيجية من البرمجيات لتعزيز المرونة.",
    img: "/assets/10-values-bento/open-source-sphere.png",
    wide: true,
  },
];

/* Server component shell; motion lives in the imported client islands. */
export function Values() {
  return (
    <section className={`section ${styles.values}`} id="values">
      {/* depth stack: accent glows drifting behind the bento */}
      <div className={styles.bg} aria-hidden="true">
        <Parallax speed={0.42} className={styles.glowA}>
          <span />
        </Parallax>
        <Parallax speed={0.24} className={styles.glowB}>
          <span />
        </Parallax>
        <Parallax speed={0.34} className={styles.glowC}>
          <span />
        </Parallax>
      </div>

      <div className={`container ${styles.inner}`}>
        <header className={styles.header}>
          <Reveal>
            <p className="kicker">
              <span dir="ltr">CORE PRINCIPLES &amp; PILLARS</span>
            </p>
          </Reveal>
          <HoverTitle
            as="h2"
            text="قيمنـــــا الجوهريّـــــة"
            className={`h-section ${styles.title}`}
          />
          <Reveal delay={0.12}>
            <p className={styles.sub}>
              المبادئ الراسخة التي توجّه استشاراتنا، وتصيغ علاقتنا مع شركاء
              النجاح، وتضمن سيادة وأمن التحول الرقمي المتقدم.
            </p>
          </Reveal>
        </header>

        <Reveal
          className={styles.grid}
          childSelector={`.${styles.cell}`}
          y={56}
          stagger={0.1}
        >
          {VALUES.map((v) => (
            <div key={v.area} className={`${styles.cell} ${styles[v.area]}`}>
              <TiltCard
                maxTilt={v.wide ? 4 : 7}
                className={[
                  styles.card,
                  v.wide ? styles.cardWide : styles.cardSm,
                  v.area === "open" ? styles.cardOpen : "",
                ].join(" ")}
              >
                <div className={styles.content}>
                  <h3 className={styles.cardTitle}>{v.title}</h3>
                  <p className={styles.cardDesc}>{v.desc}</p>
                </div>
                <div className={styles.art}>
                  <Image
                    src={v.img}
                    alt=""
                    fill
                    sizes={
                      v.wide
                        ? "(max-width: 900px) 40vw, 280px"
                        : "(max-width: 900px) 26vw, 128px"
                    }
                    className={styles.artImg}
                  />
                </div>
              </TiltCard>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
