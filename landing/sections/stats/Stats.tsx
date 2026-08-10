import Image from "next/image";
import { HoverTitle } from "@/components/typography/HoverTitle";
import { Counter } from "@/components/motion/Counter";
import { Parallax } from "@/components/motion/Parallax";
import { Reveal } from "@/components/motion/Reveal";
import styles from "./Stats.module.css";

const STATS = [
  {
    value: 3,
    prefix: "",
    label: "دول عمل",
    img: "/assets/05-key-statistics/stat-globe.png",
    width: 2000,
    height: 1125,
    artClass: "artGlobe",
    speed: 0.06,
  },
  {
    value: 50,
    prefix: "+",
    label: "شريك وعميل",
    img: "/assets/05-key-statistics/stat-partners.png",
    width: 2000,
    height: 2000,
    artClass: "artPartners",
    speed: 0.13,
  },
  {
    value: 15,
    prefix: "+",
    label: "خبير ومستشار",
    img: "/assets/05-key-statistics/stat-experts.png",
    width: 2000,
    height: 1286,
    artClass: "artExperts",
    speed: 0.09,
  },
  {
    value: 200,
    prefix: "+",
    label: "مشروع ناجح",
    img: "/assets/05-key-statistics/stat-projects.png",
    width: 2000,
    height: 2000,
    artClass: "artProjects",
    speed: 0.16,
  },
];

export function Stats() {
  return (
    <section id="stats" className={`section ${styles.stats}`}>
      {/* background depth: two glows counter-drifting at different speeds */}
      <div className={styles.decor} aria-hidden="true">
        <Parallax speed={0.42} className={styles.glowA}>
          <span />
        </Parallax>
        <Parallax speed={0.22} className={styles.glowB}>
          <span />
        </Parallax>
      </div>

      <div className={`container ${styles.inner}`}>
        <div className={styles.head}>
          <Reveal>
            <p className={`kicker ${styles.caption}`}>
              <span dir="ltr">Key Statistics</span>
            </p>
          </Reveal>
          <HoverTitle
            as="h2"
            text="إنـجــــازاتـنـــا بـالأرقــــام"
            className={`h-section ${styles.title}`}
            entrance="scroll"
          />
          <Reveal
            className={styles.subhead}
            childSelector={`.${styles.rise}`}
            delay={0.1}
          >
            <p className={`${styles.subtitle} ${styles.rise}`}>
              نتائج تعكس خبرتنا وجودة أعمالنا
            </p>
            <span className={`${styles.accent} ${styles.rise}`} />
          </Reveal>
        </div>

        {/* ltr grid keeps the deck's escalating order: 3 → +50 → +15 → +200 */}
        <Reveal
          className={styles.grid}
          childSelector={`.${styles.cell}`}
          y={60}
          stagger={0.1}
        >
          {STATS.map((stat) => (
            <div key={stat.label} className={styles.cell}>
              <article className={styles.card}>
                <div className={styles.figures}>
                  <p className={styles.num} dir="ltr">
                    <Counter value={stat.value} prefix={stat.prefix} />
                  </p>
                  <p className={styles.label}>{stat.label}</p>
                </div>
                <div className={styles.artMask} aria-hidden="true">
                  <Parallax
                    speed={stat.speed}
                    className={`${styles.art} ${styles[stat.artClass]}`}
                  >
                    <Image
                      src={stat.img}
                      alt=""
                      width={stat.width}
                      height={stat.height}
                      sizes="(max-width: 900px) 46vw, 300px"
                    />
                  </Parallax>
                  <span className={styles.fade} />
                </div>
              </article>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
