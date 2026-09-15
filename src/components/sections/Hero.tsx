"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Phone, Tractor, Truck, ShieldCheck, Star } from "lucide-react";
import { MediaPlaceholder } from "@/components/ui/media-placeholder";
import { site } from "@/lib/site";

/**
 * Jedan ulaz u katalog — kartica KOJA JE fotografija.
 *
 * ŠTA JE OVDE PROMENJENO I ZAŠTO: ranije je kartica bila obojen panel (zelen,
 * čeličan, amber) sa fotografijom umetnutom u levi ugao. Boja je bila oznaka
 * vrste, ali je time i kartica bila dugme sa slikom — dve stvari zalepljene
 * jedna do druge, sa vidljivim šavom između njih. Sad je kartica samo slika,
 * od ivice do ivice: `public/images/ulaz/*.jpg` (vidi
 * `scripts/build_category_images.py`) nosi i proizvode i podlogu na kojoj
 * stoje — svetlu metalnu ploču, ISTU za sve tri. Tri kartice su time jedan
 * materijal, a razlikuje ih samo ono što na njima stoji. Nema više šava jer
 * nema više dva sloja.
 *
 * ZAŠTO SVETLA PLOČA, A NE TAMNA: hero je tamna fotografija njive pod tamnim
 * velom. Tri svetle ploče na njoj su jedina svetla stvar ispod naslova, pa red
 * uzima pogled bez ijedne boje i bez ijednog okvira koji viče. Tamne kartice
 * bi se na toj pozadini izgubile.
 *
 * ZAŠTO 14:5: kadar i kartica moraju biti istog odnosa, inače `object-cover`
 * opseca — ili proizvod desno, ili prazninu levo u kojoj stoji tekst. 14:5 je
 * izabrano tako da kartica na telefonu ostane visoka ~125px: sve tri plus
 * dugme za poziv i dalje staju u prvi ekran na 390x844, što je i bila poenta
 * reda (da se vrsta bira bez skrola).
 *
 * TEKST STOJI PREKO SLIKE, levo, u pojasu koji je u kadru namerno ostavljen
 * prazan (`TEKST_DO` u skripti). Vela preko njega NEMA i ne treba mu: ploča je
 * tamo ionako svetla, pa ugljeni tekst na njoj ima pun kontrast, a uvećanje od
 * 3,5% na hover pomera proizvode za jedva 6px — i dalje daleko od teksta. Veo
 * je probno stajao i samo je isprao dva manja proizvoda iza sebe.
 *
 * Opis ispod naziva je kratak OPIS onoga što je iza klika („500–3500 kg, sa
 * opremom"), a ne broj stavki: brojka („4.800 delova") je izgledala kao
 * statistika, a kupcu ne kaže da li je njegova mašina među njima — opis kaže.
 * Strelica stoji uz taj red, a ne uz naziv: naziv „Rezervni delovi" i strelica
 * ne staju u isti red u pojasu za tekst, pa bi se naziv lomio.
 */
function Ulaz({
  href,
  naziv,
  opis,
  slika,
  alt,
  kasnjenje,
}: {
  href: string;
  naziv: string;
  opis: string;
  slika: string;
  alt: string;
  /** Razmak u ulasku, da tri kartice ne uskoče u isti kadar (sekunde). */
  kasnjenje: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: kasnjenje, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link
        href={href}
        className="group relative block overflow-hidden rounded-[1.15rem] bg-[#FBFBF9] shadow-[0_1px_2px_rgba(16,20,17,0.10),0_18px_40px_-18px_rgba(16,20,17,0.75)] ring-1 ring-charcoal/10 transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_4px_10px_rgba(16,20,17,0.14),0_34px_64px_-22px_rgba(16,20,17,0.9)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream focus-visible:ring-offset-2 focus-visible:ring-offset-charcoal sm:rounded-[1.35rem]"
      >
        <span className="relative block aspect-[14/5] w-full">
          <Image
            src={slika}
            alt={alt}
            fill
            sizes="(min-width: 1024px) 460px, 100vw"
            className="object-cover transition-transform duration-[700ms] ease-out group-hover:scale-[1.035]"
          />
        </span>

        {/* Faseta — svetla nit gore, tanka senka dole: ploča ima debljinu. */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-1px_0_rgba(16,20,17,0.07)]"
        />

        <span className="absolute inset-y-0 left-0 flex w-[46%] flex-col justify-center gap-1 pl-4 pr-1 sm:gap-1.5 xl:pl-5">
          <span className="relative w-fit max-w-full font-display text-[1rem] font-bold leading-tight tracking-[-0.02em] text-charcoal xl:text-[1.15rem]">
            {naziv}
            <span
              aria-hidden
              className="absolute -bottom-[3px] left-0 h-px w-full origin-left scale-x-0 bg-charcoal/45 transition-transform duration-300 ease-out group-hover:scale-x-100"
            />
          </span>
          <span className="flex items-center justify-between gap-2">
            <span className="line-clamp-2 min-w-0 text-[0.72rem] font-medium leading-snug text-charcoal/60 xl:text-[0.8rem]">
              {opis}
            </span>
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-charcoal text-cream shadow-[0_6px_14px_-6px_rgba(16,20,17,0.9)] transition-transform duration-300 ease-out group-hover:scale-110 sm:h-8 sm:w-8">
              <ArrowRight
                className="h-4 w-4 transition-transform duration-300 ease-out group-hover:translate-x-0.5"
                strokeWidth={2.4}
              />
            </span>
          </span>
        </span>
      </Link>
    </motion.div>
  );
}

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

      <div className="container flex min-h-[80vh] flex-col justify-center pt-[5.5rem] pb-14 sm:pt-24 sm:pb-20">
        {/* Naslovni blok ima svoje `max-w` po elementu (h1 3xl, tekst xl), pa
            sam omotač ide preko cele širine — red kartica ispod time dobija
            punu širinu strane, a naslov ostaje tamo gde je i bio. */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="w-full"
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
              koraka „šta tražite". Svaki je JEDNA fotografija preko cele
              kartice: proizvodi desno, prazna ploča levo za tekst (vidi
              `Ulaz`). Sa dva metra razdaljine slika kaže šta je gde brže od
              reči, a tri kartice se razlikuju po sadržaju, ne po boji.

              U red staju tek od `lg`; tri kartice u redu na tablet širini
              spljoštile bi kadar ispod 240px i proizvodi bi opet bili sličice.
              Do tada se slažu jedna ispod druge.

              ZAŠTO STUB OD 27rem NA TABLETU: kartica je sad slika i visina joj
              je vezana za širinu (14:5). Na telefonu je to ono što treba —
              350px široko, 125px visoko, sve tri i telefon staju u prvi ekran.
              Ali na tabletu od 768px kartica preko cele širine postaje visoka
              260px, tri takve su 780px i hero naraste za trećinu ekrana. Stub
              od 27rem drži karticu na ~154px, tačno u rangu u kojem je bila i
              pre; na telefonu se ne oseća (tamo je strana ionako uža), a od
              `lg` ga nema jer tada kartice ionako idu u red.

              Ulaze u kadar jedna za drugom (`kasnjenje`), pa oko krene levo-
              desno preko reda umesto da ga zatekne gotovog: na telefonu, gde
              hover ne postoji, to je jedino što red pokreće.

              Telefon stoji ISPOD njih, centriran u odnosu na taj red — ranije
              je posle preloma visio uz levu ivicu i kvario simetriju. Na
              telefonu je niži (h-12): kartice su ispred njega po važnosti, a
              plutajuće dugme za poziv ionako stoji u uglu ekrana. */}
          <div className="mt-6 sm:mt-9">
            <div className="flex w-full flex-col gap-2.5 sm:max-w-[27rem] sm:gap-3 lg:max-w-none lg:gap-4">
              <div className="grid gap-2.5 sm:gap-3 lg:grid-cols-3 lg:gap-4">
                <Ulaz
                  href="/masine"
                  naziv="Mašine"
                  opis="Za njivu, šumu i gradilište"
                  slika="/images/ulaz/masine.jpg"
                  alt="Malčer, plug i tanjirača Hofman — poljoprivredne mašine iz ponude PlugekS"
                  kasnjenje={0.3}
                />
                <Ulaz
                  href="/proizvodi?vrsta=delovi"
                  naziv="Rezervni delovi"
                  opis="Plugovi, roto drljače, sejalice"
                  slika="/images/ulaz/delovi.jpg"
                  alt="Plužne daske, raonici i grudi daske — rezervni delovi za plugove iz ponude PlugekS"
                  kasnjenje={0.4}
                />
                <Ulaz
                  href="/prikolice"
                  naziv="Auto-prikolice"
                  opis="500–3500 kg, sa opremom"
                  slika="/images/ulaz/prikolice.jpg"
                  alt="Auto-prikolice Vesta sa stranicama, ceradom i platformom — iz ponude PlugekS"
                  kasnjenje={0.5}
                />
              </div>

              {/* Telefon: „staklen" — vidi se na fotografiji, a puna svetlina
                  ostaje rezervisana za ulaze u katalog. */}
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
