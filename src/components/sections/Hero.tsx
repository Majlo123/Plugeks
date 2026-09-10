"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight,
  Phone,
  Tractor,
  Truck,
  ShieldCheck,
  Star,
} from "lucide-react";
import { MediaPlaceholder } from "@/components/ui/media-placeholder";
import { site } from "@/lib/site";
import { uzBroj } from "@/lib/brojevi";
import { cn } from "@/lib/utils";

/**
 * Tonovi kartica — ISTI gradijenti koje pločice za izbor vrste već nose na
 * `/proizvodi` (`TYPE_TONES` → `MediaPlaceholder`): mašine zelene, prikolice
 * amber, delovi čelično sive. Boja je time postala oznaka vrste kroz ceo sajt:
 * ono što je na početnoj zeleno i na stranici proizvoda je zeleno.
 */
const TONOVI = {
  masine:
    "bg-gradient-to-br from-brand-600 via-brand to-charcoal shadow-[0_18px_42px_-18px_rgba(27,94,32,0.85)] hover:shadow-[0_28px_56px_-18px_rgba(27,94,32,1)]",
  delovi:
    "bg-gradient-to-br from-[#374151] via-[#1f2937] to-charcoal shadow-[0_18px_42px_-18px_rgba(16,20,17,0.85)] hover:shadow-[0_28px_56px_-18px_rgba(16,20,17,1)]",
  prikolice:
    "bg-gradient-to-br from-accent-600 via-[#8a6a16] to-charcoal shadow-[0_18px_42px_-18px_rgba(201,139,4,0.85)] hover:shadow-[0_28px_56px_-18px_rgba(201,139,4,1)]",
} as const;

/**
 * Jedan ulaz u katalog — kartica sa fotografijom onoga što je iza klika.
 *
 * ZAŠTO VELIKI KADAR, A NE PLOČICA: ranije je fotografija stajala u beloj
 * pločici od 96px. Na toj veličini je mogao da stane tačno JEDAN proizvod, pa
 * je „Delovi" sa 4.644 stavke izgledalo kao da se prodaje jedna plužna daska, a
 * ceo red kartica kao tri dugmeta sa sitnim sličicama. Sad kadar uzima 42%
 * širine kartice na telefonu (51% od `sm` naviše) i svu njenu visinu, a u njemu
 * su TRI proizvoda (`scripts/build_category_images.py`) — sa dva metra
 * razdaljine se vidi i šta je iza klika i da je iza klika katalog.
 *
 * ZAŠTO JE NA TELEFONU SVE MANJE: uspravno složene kartice sa kadrom od 51%
 * bile su visoke ~155px, pa je treća („Auto-prikolice") padala ispod ivice
 * ekrana — na 390x844 se pri dolasku na sajt videlo dve i po kartice. Uži kadar
 * (42%) i niža stopa (`p-2`) svode karticu na ~130px i sve tri staju u prvi
 * ekran, što je i bila poenta reda: da se vrsta bira bez skrola.
 *
 * ZAŠTO KADAR IMA I `max-w`: kartica prati širinu strane (vidi red ispod), pa
 * na širem telefonu 42% raste sa njom — a sa kadrom raste i visina kartice, jer
 * je kadar 5:4. Na 430px bi tri kartice narasle za ~55px zajedno i opet
 * potisnule telefonsko dugme ispod ivice. Kadar zato staje na 8,75rem (13rem
 * od `sm`) — tačno na širini koju je imao u stupcu od 21rem, pa je i visina
 * kartice ostala ista; dalje se širi samo tekstualni deo, koji visinu ne dira.
 *
 * Kadar je 5:4 i tačno tog odnosa je i sama slika, pa `object-cover` nema šta
 * da opseče ni na jednom prelomu. Poluprečnik pločice je poluprečnik kartice
 * minus njen okvir (20−8 na telefonu, 24−10 dalje) — koncentrično, kako uglovi
 * ne bi izgledali kao dva nesložena luka.
 *
 * Broj ispod naziva nije ukras — kaže koliko ponuda ima pre nego što se klikne.
 * Strelica stoji uz taj broj, a ne uz naziv: na najužoj kartici u redu naziv
 * „Auto-prikolice" i strelica ne staju u isti red, pa bi se naziv lomio.
 */
function Ulaz({
  href,
  naziv,
  broj,
  slika,
  alt,
  ton,
}: {
  href: string;
  naziv: string;
  broj: string;
  slika: string;
  alt: string;
  ton: keyof typeof TONOVI;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex w-full items-center gap-2.5 rounded-[1.25rem] p-2 text-cream ring-1 ring-white/10 transition-all duration-300 ease-out hover:-translate-y-0.5 sm:gap-3 sm:rounded-[1.5rem] sm:p-2.5",
        TONOVI[ton],
      )}
    >
      <span className="relative aspect-[5/4] w-[42%] max-w-[8.75rem] shrink-0 overflow-hidden rounded-[0.75rem] ring-1 ring-white/15 sm:w-[51%] sm:max-w-[13rem] sm:rounded-[0.875rem]">
        <Image
          src={slika}
          alt={alt}
          fill
          sizes="(min-width: 1024px) 160px, (min-width: 640px) 208px, 140px"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
        />
      </span>

      <span className="flex min-w-0 flex-1 flex-col justify-center gap-1 pr-1 sm:gap-1.5 sm:pr-1.5">
        <span className="font-display text-[0.95rem] font-bold leading-tight tracking-[-0.015em] sm:text-[1.0625rem]">
          {naziv}
        </span>
        <span className="flex items-center justify-between gap-2">
          <span className="min-w-0 truncate text-[0.75rem] font-medium leading-tight text-cream/75 sm:text-[0.8rem]">
            {broj}
          </span>
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-cream/15 transition-transform duration-300 ease-out group-hover:translate-x-0.5 sm:h-7 sm:w-7">
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </span>
      </span>
    </Link>
  );
}

/** Brojke iz kataloga; računa ih `page.tsx` na serveru. */
export type HeroBrojke = { masina: number; delova: number; prikolica: number };

export function Hero({ brojke }: { brojke: HeroBrojke }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  // Suptilni parallax na pozadini
  const y = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);

  return (
    <section ref={ref} className="relative isolate min-h-[80vh] overflow-hidden">
      {/* Pozadina (ZAMENI: video/fotografija mašine u radu) */}
      <motion.div style={{ y, scale }} className="absolute inset-0 -z-10">
        <MediaPlaceholder
          tone="field"
          icon={Tractor}
          src="/images/hero.jpg"
          alt="Moderan traktor u radu na njivi — PlugekS"
          priority
          sizes="100vw"
          className="h-[110%] w-full"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-charcoal/90 via-charcoal/68 to-charcoal/36" />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/76 to-transparent" />
      </motion.div>

      <div className="container flex min-h-[80vh] flex-col justify-center pt-[5.5rem] pb-14 sm:pt-24 sm:pb-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-5xl"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-cream/20 bg-cream/10 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-cream backdrop-blur-sm sm:px-4 sm:py-1.5 sm:text-xs sm:tracking-[0.16em]">
            <Star className="h-3.5 w-3.5 text-accent" />
            Uvoz i prodaja poljoprivrednih delova i mašina
          </span>

          <h1 className="mt-5 max-w-3xl font-display text-[2rem] font-extrabold leading-[1.04] text-cream text-balance sm:mt-6 sm:text-5xl md:text-6xl lg:text-[4.5rem]">
            Napredna poljoprivreda za{" "}
            <span className="text-accent">modernog poljoprivrednika</span>
          </h1>

          <p className="mt-4 max-w-xl text-base leading-relaxed text-cream/95 sm:mt-6 sm:text-lg md:text-xl">
            Veliki izbor delova i mašina za poljoprivredu poznatih svetskih
            proizvođača.
          </p>

          {/* Tri ulaza u katalog — svaki vodi direktno na svoju vrstu, bez
              koraka „šta tražite". Umesto ikonice svaki nosi FOTOGRAFIJE onoga
              što ga čeka iza klika (mašine, delovi, prikolice): sa dva metra
              razdaljine slika kaže šta je gde brže od reči, a i razlikuje tri
              inače identična dugmeta. Boju svaka nosi svoju — istu koju ta
              vrsta već ima na `/proizvodi` (zelena, čelična, amber), pa je
              boja postala oznaka vrste, a ne ukras jedne kartice.

              U red staju tek od `lg`; tri kartice u redu na tablet širini
              spljoštile bi kadar na jedva 90px, a to je upravo sitna sličica od
              koje se ovde bežalo. Do tada se slažu jedna ispod druge i PRATE
              ŠIRINU STRANE — ranije su stajale u stupcu od 21rem, pa je na
              telefonu od 430px desno ostajalo 55px praznine i red je izgledao
              kao da mu je neko odsekao ivicu, dok su naslov i tekst iznad išli
              do kraja. Visinu to ne pomera: kadar ima svoj `max-w` (vidi
              `Ulaz`), pa se sa širinom razvlači samo tekstualni deo.

              Telefon stoji ISPOD njih, centriran u odnosu na taj red — ranije je
              posle preloma visio uz levu ivicu i kvario simetriju. Na telefonu
              je niži (h-12): kartice su ispred njega po važnosti, a plutajuće
              dugme za poziv ionako stoji u uglu ekrana. */}
          <div className="mt-6 sm:mt-9">
            <div className="flex w-full flex-col gap-2.5 sm:gap-3 lg:max-w-5xl lg:gap-4">
              <div className="grid gap-2.5 sm:gap-3 lg:grid-cols-3 lg:gap-4">
                <Ulaz
                  href="/masine"
                  naziv="Mašine"
                  broj={`${brojke.masina} ${uzBroj(brojke.masina, "model", "modela", "modela")}`}
                  slika="/images/ulaz/masine.jpg"
                  alt="Tanjirača, plug i malčer — poljoprivredne mašine iz ponude PlugekS"
                  ton="masine"
                />
                <Ulaz
                  href="/proizvodi?vrsta=delovi"
                  naziv="Delovi"
                  broj={`${brojke.delova.toLocaleString("sr-RS")} ${uzBroj(brojke.delova, "deo", "dela", "delova")}`}
                  slika="/images/ulaz/delovi.jpg"
                  alt="Plužne daske, raonici i grudi daske — rezervni delovi za plugove iz ponude PlugekS"
                  ton="delovi"
                />
                <Ulaz
                  href="/prikolice"
                  naziv="Auto-prikolice"
                  broj={`${brojke.prikolica} ${uzBroj(brojke.prikolica, "model", "modela", "modela")}`}
                  slika="/images/ulaz/prikolice.jpg"
                  alt="Auto-prikolice Vesta sa stranicama, ceradom i platformom — iz ponude PlugekS"
                  ton="prikolice"
                />
              </div>

              {/* Telefon: „staklen" — vidi se na fotografiji, a puna boja ostaje
                  rezervisana za ulaze u katalog. */}
              <a
                href={site.telHref}
                className="inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-full border border-cream/45 bg-charcoal/35 px-7 text-[0.95rem] font-semibold tracking-[-0.01em] text-cream shadow-[0_14px_34px_-14px_rgba(16,20,17,0.6)] backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-cream/70 hover:bg-charcoal/50 sm:h-[3.75rem] sm:text-[1.0625rem] lg:w-auto lg:self-center"
              >
                <Phone className="h-5 w-5 shrink-0 text-accent" />
                Pozovi: {site.phoneDisplay}
              </a>
            </div>
          </div>

          {/* Trust signali */}
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-cream/90 sm:mt-12 sm:gap-x-8 sm:gap-y-4">
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-brand-400" />
              Garancija
            </span>
            <span className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-brand-400" />
              Isporuka širom Srbije i regiona
            </span>
            <span className="flex items-center gap-2">
              <Tractor className="h-5 w-5 text-brand-400" />
              Dostava na adresu
            </span>
          </div>
        </motion.div>
      </div>

      {/* Indikator skrola */}
      <div className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 md:block">
        <div className="flex h-10 w-6 items-start justify-center rounded-full border-2 border-cream/30 p-1.5">
          <motion.span
            className="h-2 w-1 rounded-full bg-cream/60"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </div>
    </section>
  );
}
