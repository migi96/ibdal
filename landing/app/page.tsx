import { Header } from "@/components/layout/Header";
import { Hero } from "@/sections/hero/Hero";
import { About } from "@/sections/about/About";
import { Stats } from "@/sections/stats/Stats";
import { Services } from "@/sections/services/Services";
import { JumanAI } from "@/sections/juman/JumanAI";
import { Values } from "@/sections/values/Values";
import { Sectors } from "@/sections/sectors/Sectors";
import { Clients } from "@/sections/clients/Clients";
import { Methodology } from "@/sections/methodology/Methodology";
import { Offices } from "@/sections/offices/Offices";
import { ContactCta } from "@/sections/contact/ContactCta";

export default function Page() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <About />
        <Stats />
        <Services />
        <JumanAI />
        <Values />
        <Sectors />
        <Clients />
        <Methodology />
        <Offices />
        <ContactCta />
      </main>
    </>
  );
}
