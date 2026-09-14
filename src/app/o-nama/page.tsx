import type { Metadata } from "next";
import { MapPin, Target, HeartHandshake, Sprout } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/Reveal";
import { MediaPlaceholder } from "@/components/ui/media-placeholder";
import { TrustStats } from "@/components/sections/TrustStats";
import { KontaktCTA } from "@/components/sections/KontaktCTA";
import { Tractor } from "lucide-react";
import { FirmaJsonLd } from "@/components/FirmaJsonLd";

export const metadata: Metadata = {
  title: "O nama — PlugekS iz Žablja",
  description:
    "PlugekS je porodična firma iz Žablja specijalizovana za uvoz i prodaju poljoprivredne mehanizacije. Stručan savet, provereni kvalitet i podrška kupcima.",
  // Bez ovoga strana nasledi canonical početne i sama sebe izbaci iz indeksa.
  alternates: { canonical: "/o-nama" },
};

const values = [
  {
    icon: Target,
    title: "Pravi savet, ne prodaja po svaku cenu",
    text: "Preporučujemo mašinu koja vam najviše vredi za novac — za vaš traktor i vaš posao.",
  },
  {
    icon: HeartHandshake,
    title: "Podrška i posle kupovine",
    text: "Garancija, rezervni delovi i pomoć oko podešavanja. Tu smo i kad mašina krene u rad.",
  },
  {
    icon: Sprout,
    title: "Napredna poljoprivreda",
    text: "Donosimo proverenu, modernu mehanizaciju koja olakšava rad i podiže prinose.",
  },
];

export default function ONamaPage() {
  return (
    <>
      {/* Firma je ovde tema strane, pa ide pun `Store` node. */}
      <FirmaJsonLd />
      {/* Priča + slika */}
      <section className="section bg-cream pt-28 md:pt-32">
        <div className="container grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <span className="eyebrow">
              <span className="h-px w-6 bg-current" />
              Naša priča
            </span>
            <h1 className="mt-4 text-3xl font-bold text-charcoal text-balance sm:text-4xl">
              Od poljoprivrednika — za poljoprivrednike
            </h1>
            <div className="mt-5 space-y-4 text-muted-foreground">
              <p>
                PlugekS je nastao iz jednostavne ideje: poljoprivrednicima u Srbiji
                ponuditi kvalitetnu mehanizaciju po poštenoj ceni, uz savet kome mogu
                da veruju. Bavimo se uvozom i prodajom rezervnih delova za plugove i
                roto drljače, poljoprivrednih, šumskih i građevinskih mašina i
                auto-prikolica.
              </p>
              <p>
                Svaku mašinu biramo, prikazujemo i testiramo u realnim uslovima — zato
                naši kupci znaju šta kupuju pre nego što plate. Uz to, pomažemo oko
                subvencija i finansiranja, da do prave mašine dođete lakše.
              </p>
              <p>
                Sedište nam je u Žablju, ali isporučujemo širom Srbije i u region —
                Bosnu i Hercegovinu i Crnu Goru. Hiljade isporučenih mašina i velika
                zajednica zadovoljnih domaćina najbolja su nam preporuka.
              </p>
            </div>
            <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-2 text-sm font-semibold text-brand">
              <MapPin className="h-4 w-4" /> Žabalj 21230, Vojvodina, Srbija
            </p>
          </Reveal>

          <Reveal delay={0.1}>
            {/* ZAMENI: prava fotografija tima / poslovnog prostora / mašina */}
            <MediaPlaceholder
              tone="field"
              icon={Tractor}
              src="/images/galerija-3.jpg"
              alt="Mašina PlugekS u radu na njivi"
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="aspect-[4/5] w-full rounded-3xl shadow-lift"
            />
          </Reveal>
        </div>
      </section>

      <TrustStats />

      {/* Vrednosti */}
      <section className="section bg-white">
        <div className="container">
          <SectionHeading
            align="center"
            eyebrow="U šta verujemo"
            title="Vrednosti koje stoje iza svake isporuke"
          />
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {values.map((v, i) => {
              const Icon = v.icon;
              return (
                <Reveal key={v.title} delay={(i % 3) * 0.08}>
                  <div className="h-full rounded-2xl border border-border bg-cream p-7 shadow-card">
                    <div className="grid h-12 w-12 place-items-center rounded-xl bg-brand text-cream">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="mt-5 text-lg font-bold text-charcoal">{v.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {v.text}
                    </p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <KontaktCTA />
    </>
  );
}
