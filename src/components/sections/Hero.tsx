"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { Cog, Phone, Tractor, Truck, ShieldCheck, Star, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
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
            Malčeri, freze, prednji utovarivači i kompakt traktori — provereni
            kvalitet uz finansiranje, podršku oko subvencija i isporuku širom
            Srbije i regiona.
          </p>

          {/* Dva ulaza u katalog — svaki vodi direktno na svoju vrstu, bez koraka „šta tražite". */}
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <div className="flex gap-3">
              <Button asChild variant="accent" size="lg">
                <Link href="/proizvodi?vrsta=masine">
                  <Cog className="h-5 w-5" />
                  Mašine
                </Link>
              </Button>
              <Button asChild variant="light" size="lg">
                <Link href="/proizvodi?vrsta=delovi">
                  <Wrench className="h-5 w-5" />
                  Delovi
                </Link>
              </Button>
            </div>
            <Button
              asChild
              variant="light"
              size="lg"
              className="border border-cream/30 bg-cream/10 text-cream backdrop-blur-sm hover:bg-cream/20 hover:text-cream"
            >
              <a href={site.telHref}>
                <Phone className="h-5 w-5" />
                Pozovi: {site.phoneDisplay}
              </a>
            </Button>
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
