import { HoverTitle } from "@/components/typography/HoverTitle";
import { Reveal } from "@/components/motion/Reveal";
import { Marquee } from "@/components/motion/Marquee";
import styles from "./Clients.module.css";

interface Logo {
  file: string;
  alt: string;
}

/* Slide 06 logo wall — rows 1–2 feed the first belt, rows 3–4 the second. */
const BELT_A: Logo[] = [
  { file: "albenaa.png", alt: "Albenaa" },
  { file: "taraahum.png", alt: "Taraahum" },
  { file: "moccae.png", alt: "MOCCAE" },
  { file: "dasc.png", alt: "DASC" },
  { file: "client-05.png", alt: "Client 05" },
  { file: "darah.png", alt: "Darah" },
  { file: "geosa.png", alt: "GEOSA" },
  { file: "etqaan.png", alt: "Etqaan" },
  { file: "innosoft.png", alt: "Innosoft" },
  { file: "insiyab.png", alt: "Insiyab" },
  { file: "360saudi.png", alt: "360 Saudi" },
  { file: "erpnext.png", alt: "ERPNext" },
  { file: "evolvingweb.png", alt: "Evolving Web" },
  { file: "raydion.png", alt: "Raydion" },
];

const BELT_B: Logo[] = [
  { file: "digitlnext.png", alt: "Digitl Next" },
  { file: "alkhabeer-alsiyahi.png", alt: "Alkhabeer Alsiyahi" },
  { file: "youpal.png", alt: "YouPal" },
  { file: "xtend.png", alt: "Xtend" },
  { file: "tendegrees.png", alt: "Ten Degrees" },
  { file: "procstation.png", alt: "Procstation" },
  { file: "retaj.png", alt: "Retaj" },
  { file: "sac-training.png", alt: "SAC Training" },
  { file: "parmg.png", alt: "PARMG" },
  { file: "ecolor.png", alt: "Ecolor" },
  { file: "elite-stars.png", alt: "Elite Stars" },
  { file: "h2h.png", alt: "H2H" },
  { file: "green-emblem.png", alt: "Green Emblem" },
];

function LogoBelt({ logos, duration }: { logos: Logo[]; duration: number }) {
  return (
    <Marquee duration={duration}>
      {logos.map((logo) => (
        <div key={logo.file} className={styles.tile}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/assets/06-our-clients/${logo.file}`}
            alt={logo.alt}
            loading="lazy"
            className={styles.logo}
          />
        </div>
      ))}
    </Marquee>
  );
}

/* Server component shell; interactivity lives in the imported client islands. */
export function Clients() {
  return (
    <section className={`section ${styles.clients}`} id="clients">
      <div className={`container ${styles.head}`}>
        <p className={styles.bigNum} dir="ltr" aria-hidden="true">
          50+
        </p>
        <Reveal>
          <p className="kicker">
            <span dir="ltr">TRUSTED BY LEADERS</span>
          </p>
        </Reveal>
        <Reveal delay={0.06}>
          <div className="divider" />
        </Reveal>
        <HoverTitle
          as="h2"
          text="شركاء النجاح والريادة"
          className={`h-section ${styles.title}`}
        />
        <Reveal delay={0.15}>
          <p className={styles.desc}>
            نخدم القطاعات الحيوية في المملكة العربية السعودية، ونسهم بفاعلية في
            تمكين مبادراتهم التقنية ومشاريعهم نحو تحقيق مستهدفات رؤية المملكة
            ٢٠٣٠.
          </p>
        </Reveal>
      </div>

      <Reveal className={styles.belts} y={36}>
        <LogoBelt logos={BELT_A} duration={48} />
        <LogoBelt logos={BELT_B} duration={64} />
      </Reveal>
    </section>
  );
}
