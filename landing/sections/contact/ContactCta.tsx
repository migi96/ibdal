import { FxCanvas } from "@/components/three/FxCanvas";
import { HoverTitle } from "@/components/typography/HoverTitle";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { Reveal } from "@/components/motion/Reveal";
import styles from "./ContactCta.module.css";

const CONTACTS = [
  { label: "البريد الإلكتروني", value: "info@ibdai.sa", href: "mailto:info@ibdai.sa", dir: "ltr" },
  { label: "الهاتف", value: "+966 11 000 0000", href: "tel:+966110000000", dir: "ltr" },
  { label: "المقر الرئيسي", value: "الرياض، حي الملقا، طريق الملك فهد", href: undefined, dir: "rtl" },
] as const;

/* Server component shell; interactivity lives in the imported client islands. */
export function ContactCta() {
  return (
    <section className={styles.cta} id="contact">
      <FxCanvas
        effect="streamWave"
        className={styles.stream}
        opts={{ speed: 1, intensity: 0.75, pointerFollow: false, transparent: true }}
      />

      <div className={`container ${styles.inner}`}>
        <Reveal>
          <p className="kicker">CONTACT US</p>
        </Reveal>
        <HoverTitle
          as="h2"
          text="هل مؤسستـك جاهـزة للتحـول الرقمـي الحقيقـي؟"
          className={`h-section ${styles.title}`}
        />
        <Reveal delay={0.15}>
          <p className={styles.sub}>
            دعنا نترجم تحدياتك التشغيلية إلى أنظمة ذكية، آمنة، وقابلة للتوسع.
            فريقنا من الخبراء جاهز لبناء خارطة الطريق الخاصة بك.
          </p>
        </Reveal>
        <Reveal delay={0.25}>
          <MagneticButton href="mailto:info@ibdai.sa" className={styles.button}>
            احجز استشارة تقنية
            <span aria-hidden="true">↗</span>
          </MagneticButton>
        </Reveal>

        <Reveal className={styles.contacts} childSelector={`.${styles.contact}`}>
          {CONTACTS.map((c) => (
            <div key={c.label} className={styles.contact}>
              <span className={styles.contactLabel}>{c.label}</span>
              {c.href ? (
                <a href={c.href} dir={c.dir} className={styles.contactValue}>
                  {c.value}
                </a>
              ) : (
                <span dir={c.dir} className={styles.contactValue}>
                  {c.value}
                </span>
              )}
            </div>
          ))}
        </Reveal>
      </div>

      <footer className={styles.footer}>
        <div className={`container ${styles.footerRow}`}>
          <span>© 2026 إبداع الفكر للاستشارات والحلول الهندسية المتقدمة</span>
          <span dir="ltr">IBDAI AL-FAKR CONSULTING</span>
        </div>
      </footer>
    </section>
  );
}
