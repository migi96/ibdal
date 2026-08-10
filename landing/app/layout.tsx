import type { Metadata, Viewport } from "next";
import { Alexandria } from "next/font/google";
import { GsapProvider } from "@/components/motion/GsapProvider";
import "./globals.css";

const alexandria = Alexandria({
  subsets: ["arabic", "latin"],
  variable: "--font-alexandria",
  display: "swap",
});

export const metadata: Metadata = {
  title: "إبداع الفكر للاستشارات — الاستشارات الهندسية والتحول الرقمي",
  description:
    "شركة إبداع الفكر للاستشارات والحلول الهندسية المتقدمة — الشريك الاستراتيجي للتحول الرقمي، الذكاء الاصطناعي السيادي، والأمن السيبراني في المملكة العربية السعودية.",
};

export const viewport: Viewport = {
  themeColor: "#0d1b3e",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" className={alexandria.variable}>
      <body>
        <GsapProvider>{children}</GsapProvider>
      </body>
    </html>
  );
}
