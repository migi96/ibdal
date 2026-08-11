import { HoverTitle } from "@/components/typography/HoverTitle";
import { Reveal } from "@/components/motion/Reveal";
import styles from "./Sectors.module.css";

type SectorTone = "violet" | "lilac" | "mint" | "ice" | "cream" | "blush";

interface SectorCard {
  key: string;
  icon: string;
  title: string;
  desc: string;
  tone: SectorTone;
  wide?: boolean;
}

/* Copy is sourced verbatim from deck slides 25 + 26 (elongated Arabic kept) */
const SECTORS: SectorCard[] = [
  {
    key: "government",
    icon: "/assets/26-client-sectors/icon-city.svg",
    title: "الــقــطــاع الــحــكــومــي والــســيــادي",
    desc: "تــمــكــيــن الــهــيــئــات والــوزارات مــن تــحــقــيــق الامــتــثــال وتــقــديــم مــخــرجــات اســتــشــاريــة وحــلــول ذكــاء اصــطــنــاعــي ســيــادي آمــن ومــؤصــل.",
    tone: "violet",
    wide: true,
  },
  {
    key: "finance",
    icon: "/assets/26-client-sectors/icon-estimate.svg",
    title: "الــبــنــوك والــقــطــاع الــمــالــي",
    desc: "حــوكــمــة الــبــيــانــات والــتــحــقــق مــن الالتــزام بــالــمــعــايــيــر الــرقــابــيــة الــصــارمــة لــحــمــايــة الــمــعــامــلات وبــنــاء الــثــقــة الــرقــمــيــة.",
    tone: "lilac",
    wide: true,
  },
  {
    key: "health",
    icon: "/assets/26-client-sectors/icon-user-shield.svg",
    title: "الــقــطــاع الــصــحــي",
    desc: "حــمــايــة مــلــفــات وبــيــانــات الــمــرضــى الــحــيــويــة.",
    tone: "mint",
  },
  {
    key: "education",
    icon: "/assets/26-client-sectors/icon-certificate.svg",
    title: "قــطــاع الــتــعــلــيــم",
    desc: "بــنــاء مــصــفــوفــة الــكــفــاءة الــمــعــرفــيــة والــتــطــويــر.",
    tone: "ice",
  },
  {
    key: "energy",
    icon: "/assets/26-client-sectors/icon-global.svg",
    title: "قــطــاع الــطــاقــة والــصــنــاعــة",
    desc: "أمــان الــبــنــى الــتــحــتــيــة الــحــســاســة ومــتــابــعــة الــمــخــاطــر.",
    tone: "cream",
  },
  {
    key: "telecom",
    icon: "/assets/26-client-sectors/icon-link.svg",
    title: "قــطــاع الاتــصــالات",
    desc: "شــبــكــات ربــط آمــنــة وإدارة الــهــويــة الــرقــمــيــة.",
    tone: "blush",
  },
];

/* Server component shell; motion lives in the imported client islands. */
export function Sectors() {
  return (
    <section className={`section ${styles.sectors}`} id="sectors">
      {/* wavy blue accents — physical top-left and bottom-right per the design */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/assets/sectors/wave-top-left.png" alt="" className={styles.waveTL} aria-hidden="true" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/assets/sectors/wave-bottom-right.png" alt="" className={styles.waveBR} aria-hidden="true" />

      <div className={`container ${styles.inner}`}>
        <header className={styles.header}>
          <Reveal>
            <p className="kicker">
              <span dir="ltr">CLIENT PORTFOLIO SECTORS</span>
            </p>
          </Reveal>
          <HoverTitle
            as="h2"
            text="الــقــطــاعــات الــحــيــويــة الــتــي نــخــدمــهــا"
            className={`h-section ${styles.title}`}
          />
          <Reveal delay={0.1}>
            <span className="divider" />
          </Reveal>
          <Reveal delay={0.16}>
            <p className={styles.sub}>
              نخدم القطاعات الحيوية في المملكة العربية السعودية، ونسهم بفاعلية
              في تمكين مبادراتهم التقنية ومشاريعهم نحو تحقيق مستهدفات رؤية
              المملكة ٢٠٣٠.
            </p>
          </Reveal>
        </header>

        <Reveal
          className={styles.grid}
          childSelector={`.${styles.card}`}
          y={48}
          stagger={0.09}
        >
          {SECTORS.map((s) => (
            <article
              key={s.key}
              className={[
                styles.card,
                styles[s.tone],
                s.wide ? styles.cardWide : "",
              ].join(" ")}
            >
              <span className={styles.chip}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.icon} alt="" className={styles.icon} />
              </span>
              <div className={styles.text}>
                <h3 className={styles.cardTitle}>{s.title}</h3>
                <p className={styles.cardDesc}>{s.desc}</p>
              </div>
            </article>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
