"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight,
  Caravan,
  Cog,
  Phone,
  Tractor,
  Truck,
  ShieldCheck,
  Star,
  Wrench,
} from "lucide-react";
import { MediaPlaceholder } from "@/components/ui/media-placeholder";
import { site } from "@/lib/site";

export function Hero() {
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
          className="max-w-3xl"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-cream/20 bg-cream/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-cream backdrop-blur-sm">
            <Star className="h-3.5 w-3.5 text-accent" />
            Uvoz i prodaja poljoprivredne mehanizacije
          </span>

          <h1 className="mt-6 font-display text-4xl font-extrabold leading-[1.04] text-cream text-balance sm:text-5xl md:text-6xl lg:text-[4.5rem]">
            Napredna mehanizacija za{" "}
            <span className="text-accent">modernog poljoprivrednika</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-cream/95 sm:text-xl">
            Veliki izbor delova i mašina za poljoprivredu poznatih svetskih
            proizvođača.
          </p>

          {/* Tri ulaza u katalog — svaki vodi direktno na svoju vrstu, bez
              koraka „šta tražite". Uočljivi su punom bojom, većim formatom i
              mekom obojenom senkom, a ne dekoracijom; telefon stoji uz njih u
              istom formatu, samo staklen, da se vidi ali ne konkuriše.
              „Mašine" nose akcentnu boju kao glavni ulaz, ostala dva su krem. */}
          <div className="mt-9">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
              <Link
                href="/proizvodi?vrsta=masine"
                className="group inline-flex h-[3.75rem] w-full items-center justify-between gap-3 rounded-full bg-accent pl-7 pr-3 text-[1.0625rem] font-semibold tracking-[-0.01em] text-charcoal shadow-[0_14px_34px_-14px_rgba(224,161,6,0.8)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent-400 hover:shadow-[0_20px_40px_-14px_rgba(224,161,6,0.95)] sm:w-auto sm:pl-8 sm:text-lg"
              >
                <span className="inline-flex items-center gap-2.5">
                  <Cog className="h-5 w-5 shrink-0" />
                  Mašine
                </span>
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-charcoal/10 transition-transform duration-200 group-hover:translate-x-0.5">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
              <Link
                href="/proizvodi?vrsta=delovi"
                className="group inline-flex h-[3.75rem] w-full items-center justify-between gap-3 rounded-full bg-cream pl-7 pr-3 text-[1.0625rem] font-semibold tracking-[-0.01em] text-brand shadow-[0_14px_34px_-14px_rgba(16,20,17,0.6)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_20px_40px_-14px_rgba(16,20,17,0.75)] sm:w-auto sm:pl-8 sm:text-lg"
              >
                <span className="inline-flex items-center gap-2.5">
                  <Wrench className="h-5 w-5 shrink-0" />
                  Delovi
                </span>
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand/10 transition-transform duration-200 group-hover:translate-x-0.5">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>

              <Link
                href="/proizvodi?vrsta=prikolice"
                className="group inline-flex h-[3.75rem] w-full items-center justify-between gap-3 rounded-full bg-cream pl-7 pr-3 text-[1.0625rem] font-semibold tracking-[-0.01em] text-brand shadow-[0_14px_34px_-14px_rgba(16,20,17,0.6)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_20px_40px_-14px_rgba(16,20,17,0.75)] sm:w-auto sm:pl-8 sm:text-lg"
              >
                <span className="inline-flex items-center gap-2.5">
                  <Caravan className="h-5 w-5 shrink-0" />
                  Auto-prikolice
                </span>
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand/10 transition-transform duration-200 group-hover:translate-x-0.5">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>

              {/* Telefon: isti format, ali „staklen" — vidi se na fotografiji,
                  a puna boja ostaje rezervisana za ulaze u katalog. */}
              <a
                href={site.telHref}
                className="inline-flex h-14 w-full items-center justify-center gap-2.5 rounded-full border border-cream/45 bg-charcoal/35 px-7 text-base font-semibold tracking-[-0.01em] text-cream shadow-[0_14px_34px_-14px_rgba(16,20,17,0.6)] backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-cream/70 hover:bg-charcoal/50 sm:h-[3.75rem] sm:w-auto sm:text-[1.0625rem]"
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
              Garancija na sve mašine
            </span>
            <span className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-brand-400" />
              Isporuka širom Srbije i regiona
            </span>
            <span className="flex items-center gap-2">
              <Tractor className="h-5 w-5 text-brand-400" />
              1.000+ isporučenih mašina
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
