import type { Metadata } from "next";
import Link from "next/link";
import {
  Landmark,
  Banknote,
  FileCheck2,
  PhoneCall,
  Truck,
  ChevronDown,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/Reveal";
import { Button } from "@/components/ui/button";
import { subvencijeFaq } from "@/lib/data";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Subvencije i finansiranje poljoprivredne mehanizacije",
  description:
    "Kako da kupite mašinu uz državne subvencije ili na rate preko kredita i lizinga. Vodimo vas kroz ceo proces — od izbora modela do isporuke.",
};

const steps = [
  {
    icon: PhoneCall,
    title: "1. Izbor mašine i savet",
    text: "Javite nam traktor i posao. Preporučujemo najbolji model i šaljemo ponudu sa cenom.",
  },
  {
    icon: FileCheck2,
    title: "2. Provera prava i dokumentacije",
    text: "Proveravamo da li ispunjavate uslove za subvenciju i koju dokumentaciju treba pripremiti.",
  },
  {
    icon: Banknote,
    title: "3. Način plaćanja",
    text: "Dogovaramo finansiranje — gotovina, subvencija ili rate preko banke/lizinga, prilagođeno sezoni.",
  },
  {
    icon: Truck,
    title: "4. Isporuka i podrška",
    text: "Isporučujemo mašinu širom Srbije i regiona, uz garanciju i obezbeđene rezervne delove.",
  },
];

const benefits = {
  subvencije: [
    "Savetovanje oko prava na podsticaj",
    "Pomoć pri pripremi dokumentacije",
    "Mašine pogodne za subvencionisanu nabavku",
    "Praćenje kroz ceo postupak",
  ],
  finansiranje: [
    "Saradnja sa bankama i lizing kućama",
    "Rate prilagođene poljoprivrednoj sezoni",
    "Mašina odmah — otplata kasnije",
    "Okvirni plan otplate uz ponudu",
  ],
};

export default function SubvencijePage() {
  return (
    <>
      <PageHeader
        breadcrumb="Subvencije i finansiranje"
        title="Do mašine lakše — uz subvencije i finansiranje"
        description="Ne dozvolite da budžet bude prepreka. Pomažemo vam da iskoristite državne podsticaje i plaćate na rate prilagođene vašem gazdinstvu."
        tone="harvest"
        image="/images/galerija-2.jpg"
      />

      {/* Dve glavne opcije */}
      <section className="section bg-cream">
        <div className="container grid gap-6 lg:grid-cols-2">
          <Reveal>
            <div className="flex h-full flex-col rounded-3xl border border-border/90 bg-white p-8 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift md:p-10">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand ring-1 ring-brand/20">
                <Landmark className="h-7 w-7" />
              </div>
              <h2 className="mt-6 font-display text-[1.78rem] font-bold leading-[1.12] tracking-[-0.015em] text-charcoal">Državne subvencije</h2>
              <p className="mt-3 text-[1.02rem] leading-relaxed text-muted-foreground">
                Država kroz podsticaje sufinansira nabavku poljoprivredne mehanizacije.
                Mi vam pomažemo da se snađete u uslovima i papirologiji i izaberete mašinu
                koja ispunjava kriterijume.
              </p>
              <ul className="mt-6 space-y-3">
                {benefits.subvencije.map((b) => (
                  <li key={b} className="flex items-center gap-3 text-[0.97rem] text-foreground/95">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-brand" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="flex h-full flex-col rounded-3xl border border-border/90 bg-white p-8 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift md:p-10">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-accent/15 text-accent-600 ring-1 ring-accent/35">
                <Banknote className="h-7 w-7" />
              </div>
              <h2 className="mt-6 font-display text-[1.78rem] font-bold leading-[1.12] tracking-[-0.015em] text-charcoal">Plaćanje na rate</h2>
              <p className="mt-3 text-[1.02rem] leading-relaxed text-muted-foreground">
                Uz saradnju sa bankama i lizing kućama, mašinu preuzimate odmah, a
                otplaćujete je u ratama koje prate prihode i sezonu — bez čekanja da
                skupite ceo iznos.
              </p>
              <ul className="mt-6 space-y-3">
                {benefits.finansiranje.map((b) => (
                  <li key={b} className="flex items-center gap-3 text-[0.97rem] text-foreground/95">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-accent-600" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Proces — koraci */}
      <section className="section bg-charcoal text-cream">
        <div className="container">
          <SectionHeading
            align="center"
            variant="light"
            eyebrow="Kako funkcioniše"
            title="Od upita do mašine u 4 koraka"
            description="Ceo proces vodimo zajedno — jednostavno i bez stresa."
          />
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => {
              const Icon = s.icon;
              return (
                <Reveal key={s.title} delay={(i % 4) * 0.08}>
                  <div className="h-full rounded-2xl border border-white/15 bg-white/[0.07] p-6 backdrop-blur-[1px]">
                    <div className="grid h-12 w-12 place-items-center rounded-xl bg-brand text-cream">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="mt-5 font-display text-lg font-bold tracking-[-0.012em] text-cream">
                      {s.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-cream/85">{s.text}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section bg-cream">
        <div className="container max-w-3xl">
          <SectionHeading
            align="center"
            eyebrow="Česta pitanja"
            title="Najčešća pitanja o subvencijama i ratama"
          />
          <div className="mt-12 space-y-4">
            {subvencijeFaq.map((f) => (
              <details
                key={f.q}
                className="group rounded-2xl border border-border/90 bg-white p-6 shadow-card transition-colors duration-300 hover:border-brand/25 [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-[1.08rem] font-semibold tracking-[-0.01em] text-charcoal">
                  {f.q}
                  <ChevronDown className="h-5 w-5 shrink-0 text-brand transition-transform duration-300 group-open:rotate-180" />
                </summary>
                <p className="mt-4 text-[0.98rem] leading-relaxed text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>

          <Reveal className="mt-12 text-center">
            <p className="text-muted-foreground">
              Imate konkretno pitanje o vašem slučaju?
            </p>
            <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild variant="accent" size="lg">
                <Link href="/kontakt">
                  Zatraži ponudu i savet <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href={site.telHref}>Pozovi: {site.phoneDisplay}</a>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
