import { HoverTitle } from "@/components/typography/HoverTitle";
import { FxCanvas } from "@/components/three/FxCanvas";
import { Reveal } from "@/components/motion/Reveal";
import styles from "./Offices.module.css";

interface Office {
  title: string;
  desc: string;
  email: string;
  phone?: string;
  tel?: string;
}

const OFFICES: Office[] = [
  {
    title: "المملكة العربية السعودية - الرياض",
    desc: "محور عملياتنا الاستراتيجية ومركز حلول الذكاء الاصطناعي السيادي والحوكمة المتطورة.",
    email: "riyadh@ibdai.sa",
    phone: "+966 11 000 0000",
    tel: "+966110000000",
  },
  {
    title: "الإمارات العربية المتحدة - دبي",
    desc: "تطوير وإدارة الشراكات الإقليمية ونقل المعرفة والحلول الرقمية.",
    email: "dubai@ibdai.sa",
  },
  {
    title: "إسبانيا - مدريد",
    desc: "بوابة الشراكة الأوروبية والتعاون التكنولوجي الدولي.",
    email: "madrid@ibdai.sa",
  },
];

/* Server component shell; motion lives in the imported client islands. */
export function Offices() {
  return (
    <section className={`section ${styles.offices}`} id="offices">
      {/* soft blurred halo, top inline-start (top-right in RTL) — like the deck */}
      <div className={styles.decor} aria-hidden="true" />

      {/* live vector world map — a reading head lights Saudi Arabia, Spain and
          the UAE and draws arcs from Riyadh to Madrid and Dubai */}
      <div className={styles.mapLayer}>
        <FxCanvas
          effect="sovereignGrid"
          className={styles.mapCanvas}
          opts={{ speed: 1, intensity: 1, pointerFollow: true }}
          fallbackSrc="/assets/28-global-offices/world-map-3d.png"
        />
      </div>

      <div className={`container ${styles.inner}`}>
        <header className={styles.header}>
          <HoverTitle
            as="h2"
            text="مكاتبنـا العالميـة"
            className={`h-section ${styles.title}`}
            entrance="scroll"
          />
          <span className={`kicker ${styles.headerEn}`} dir="ltr">
            GLOBAL OFFICES
          </span>
        </header>

        <Reveal
          className={styles.cards}
          childSelector={`.${styles.card}`}
          stagger={0.14}
        >
          {OFFICES.map((office) => (
            <article key={office.email} className={styles.card}>
              <span className={styles.pin} aria-hidden="true" />
              <h3 className={styles.cardTitle}>{office.title}</h3>
              <p className={styles.cardDesc}>{office.desc}</p>
              <p className={styles.cardContact} dir="ltr">
                <a className={styles.contactLink} href={`mailto:${office.email}`}>
                  {office.email}
                </a>
                {office.phone && office.tel ? (
                  <>
                    <span className={styles.contactSep}> | </span>
                    <a className={styles.contactLink} href={`tel:${office.tel}`}>
                      {office.phone}
                    </a>
                  </>
                ) : null}
              </p>
            </article>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
