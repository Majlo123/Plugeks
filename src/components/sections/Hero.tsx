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
 * Jedan ulaz u katalog — kartica sa fotografijom onoga što je iza klika.
 *
 * ZAŠTO VELIKI KADAR, A NE PLOČICA: ranije je fotografija stajala u beloj
 * pločici od 96px. Na toj veličini je mogao da stane tačno JEDAN proizvod, pa
 * je „Delovi" sa 4.644 stavke izgledalo kao da se prodaje jedna plužna daska, a
 * ceo red kartica kao tri dugmeta sa sitnim sličicama. Sad kadar uzima oko 48%
 * širine kartice i svu njenu visinu, a u njemu su TRI proizvoda
 * (`scripts/build_category_images.py`) — sa dva metra razdaljine se vidi i šta
 * je iza klika i da je iza klika katalog.
 *
 * Kadar je 5:4 i tačno tog odnosa je i sama slika, pa `object-cover` nema šta
 * da opseče ni na jednom prelomu. Poluprečnik pločice (14px) je poluprečnik
 * kartice (24px) minus njen okvir (10px) — koncentrično, kako uglovi ne bi
 * izgledali kao dva nesložena luka.
 *
 * Broj ispod naziva nije ukras — kaže koliko ponuda ima pre nego što se klikne.
 * Strelica stoji uz taj broj, a ne uz naziv: na najužoj kartici u redu (309px)
 * naziv „Auto-prikolice" i strelica ne staju u isti red, pa bi se naziv lomio.
 *
 * `glavni` nosi akcentnu boju — to je primarni ulaz.
 */
function Ulaz({
  href,
  naziv,
  broj,
  slika,
  alt,
  glavni = false,
}: {
  href: string;
  naziv: string;
  broj: string;
  slika: string;
  alt: string;
  glavni?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex w-full items-center gap-3 rounded-[1.5rem] p-2.5 transition-all duration-300 ease-out hover:-translate-y-0.5",
        glavni
          ? "bg-accent text-charcoal shadow-[0_18px_42px_-16px_rgba(224,161,6,0.85)] hover:bg-accent-400 hover:shadow-[0_28px_56px_-16px_rgba(224,161,6,1)]"
          : "bg-cream text-brand shadow-[0_18px_42px_-18px_rgba(16,20,17,0.8)] ring-1 ring-charcoal/[0.06] hover:bg-white hover:shadow-[0_28px_56px_-18px_rgba(16,20,17,0.95)]",
      )}
    >
      <span className="relative aspect-[5/4] w-[51%] shrink-0 overflow-hidden rounded-[0.875rem] ring-1 ring-charcoal/[0.07]">
        <Image
          src={slika}
          alt={alt}
          fill
          sizes="(min-width: 1024px) 160px, (min-width: 480px) 205px, 46vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
        />
      </span>

      <span className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 pr-1.5">
        <span className="font-display text-[1.0625rem] font-bold leading-tight tracking-[-0.015em]">
          {naziv}
        </span>
        <span className="flex items-center justify-between gap-2">
          <span
            className={cn(
              "min-w-0 truncate text-[0.8rem] font-medium leading-tight",
              glavni ? "text-charcoal/65" : "text-brand/70",
            )}
          >
            {broj}
          </span>
          <span
            className={cn(
              "grid h-7 w-7 shrink-0 place-items-center rounded-full transition-transform duration-300 ease-out group-hover:translate-x-0.5",
              glavni ? "bg-charcoal/10" : "bg-brand/10",
            )}
          >
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

      <div className="container flex min-h-[80vh] flex-col justify-center pt-24 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-5xl"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-cream/20 bg-cream/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-cream backdrop-blur-sm">
            <Star className="h-3.5 w-3.5 text-accent" />
            Uvoz i prodaja poljoprivrednih delova i mašina
          </span>

          <h1 className="mt-6 max-w-3xl font-display text-4xl font-extrabold leading-[1.04] text-cream text-balance sm:text-5xl md:text-6xl lg:text-[4.5rem]">
            Napredna poljoprivreda za{" "}
            <span className="text-accent">modernog poljoprivrednika</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-cream/95 sm:text-xl">
            Veliki izbor delova i mašina za poljoprivredu poznatih svetskih
            proizvođača.
          </p>

          {/* Tri ulaza u katalog — svaki vodi direktno na svoju vrstu, bez
              koraka „šta tražite". Umesto ikonice svaki nosi FOTOGRAFIJE onoga
              što ga čeka iza klika (mašine, delovi, prikolice): sa dva metra
              razdaljine slika kaže šta je gde brže od reči, a i razlikuje tri
              inače identična dugmeta. „Mašine" nose akcentnu boju kao glavni
              ulaz, ostala dva su krem.

              U red staju tek od `lg`. Ispod toga se slažu jedna ispod druge, u
              stubac širok najviše 26rem: tri kartice u redu na tablet širini
              spljoštile bi kadar na jedva 90px, a to je upravo sitna sličica od
              koje se ovde bežalo. Uspravno složene su, naprotiv, najšire — kadar
              tamo ide i preko 180px.

              Telefon stoji ISPOD njih, centriran u odnosu na taj red — ranije je
              posle preloma visio uz levu ivicu i kvario simetriju. */}
          <div className="mt-9">
            <div className="flex w-full max-w-[26rem] flex-col gap-3 lg:max-w-5xl lg:gap-4">
              <div className="grid gap-3 lg:grid-cols-3 lg:gap-4">
                <Ulaz
                  href="/masine"
                  naziv="Mašine"
                  broj={`${brojke.masina} ${uzBroj(brojke.masina, "model", "modela", "modela")}`}
                  slika="/images/ulaz/masine.jpg"
                  alt="Tanjirača, plug i malčer — poljoprivredne mašine iz ponude PlugekS"
                  glavni
                />
                <Ulaz
                  href="/proizvodi?vrsta=delovi"
                  naziv="Delovi"
                  broj={`${brojke.delova.toLocaleString("sr-RS")} ${uzBroj(brojke.delova, "deo", "dela", "delova")}`}
                  slika="/images/ulaz/delovi.jpg"
                  alt="Plužne daske, raonici i grudi daske — rezervni delovi za plugove iz ponude PlugekS"
                />
                <Ulaz
                  href="/prikolice"
                  naziv="Auto-prikolice"
                  broj={`${brojke.prikolica} ${uzBroj(brojke.prikolica, "model", "modela", "modela")}`}
                  slika="/images/ulaz/prikolice.jpg"
                  alt="Auto-prikolice Vesta sa stranicama, ceradom i platformom — iz ponude PlugekS"
                />
              </div>

              {/* Telefon: „staklen" — vidi se na fotografiji, a puna boja ostaje
                  rezervisana za ulaze u katalog. */}
              <a
                href={site.telHref}
                className="inline-flex h-14 w-full items-center justify-center gap-2.5 rounded-full border border-cream/45 bg-charcoal/35 px-7 text-base font-semibold tracking-[-0.01em] text-cream shadow-[0_14px_34px_-14px_rgba(16,20,17,0.6)] backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-cream/70 hover:bg-charcoal/50 sm:h-[3.75rem] sm:text-[1.0625rem] lg:w-auto lg:self-center"
              >
                <Phone className="h-5 w-5 shrink-0 text-accent" />
                Pozovi: {site.phoneDisplay}
              </a>
            </div>
          </div>

          {/* Trust signali */}
          <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-4 text-sm text-cream/90">
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
