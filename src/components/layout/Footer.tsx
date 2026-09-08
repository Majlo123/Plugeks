import Link from "next/link";
import { Phone, Mail, MapPin, Clock, Facebook, Instagram, Globe } from "lucide-react";
import { Logo } from "@/components/Logo";
import { nav, site } from "@/lib/site";
import { categories } from "@/lib/data";
import { catalogHref } from "@/lib/catalog";
import {
  machineCategories,
  trailerCategories,
  trailerAccessoryGroups,
  partBrands,
  partTypes,
  katalogBrojStrana,
} from "@/lib/products";

export function Footer() {
  return (
    <footer className="bg-charcoal text-cream/80">
      <div className="container grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-4">
        {/* Brend + NAP */}
        <div className="lg:col-span-1">
          <Logo full />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-cream/60">
            Uvoz i prodaja poljoprivredne mehanizacije i delova. Stručan savet,
            finansiranje i isporuka širom Srbije i regiona.
          </p>
          <div className="mt-6 flex gap-3">
            <a
              href={site.socials.facebook}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="grid h-10 w-10 place-items-center rounded-full bg-white/5 text-cream/80 transition-colors hover:bg-brand hover:text-cream"
            >
              <Facebook className="h-5 w-5" />
            </a>
            <a
              href={site.socials.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="grid h-10 w-10 place-items-center rounded-full bg-white/5 text-cream/80 transition-colors hover:bg-brand hover:text-cream"
            >
              <Instagram className="h-5 w-5" />
            </a>
            <a
              href={site.socials.website}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Veb sajt"
              className="grid h-10 w-10 place-items-center rounded-full bg-white/5 text-cream/80 transition-colors hover:bg-brand hover:text-cream"
            >
              <Globe className="h-5 w-5" />
            </a>
          </div>
        </div>

        {/* Navigacija */}
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-cream">
            Stranice
          </h3>
          <ul className="mt-5 space-y-3 text-[0.95rem]">
            <li>
              <Link href="/" className="text-cream/60 transition-colors hover:text-cream">
                Početna
              </Link>
            </li>
            {nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-cream/60 transition-colors hover:text-cream">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Kategorije */}
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-cream">
            Asortiman
          </h3>
          <ul className="mt-5 space-y-3 text-[0.95rem]">
            {categories.map((c) => (
              <li key={c.key}>
                <Link
                  href={catalogHref(c.key)}
                  className="text-cream/60 transition-colors hover:text-cream"
                >
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Kontakt */}
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-cream">
            Kontakt
          </h3>
          <ul className="mt-5 space-y-4 text-[0.95rem]">
            <li className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
              <span className="text-cream/70">{site.address.full}</span>
            </li>
            <li className="flex items-center gap-3">
              <Phone className="h-4 w-4 shrink-0 text-brand-400" />
              <a href={site.telHref} className="text-cream/70 hover:text-cream">
                {site.phoneDisplay}
              </a>
            </li>
            <li className="flex items-center gap-3">
              <Mail className="h-4 w-4 shrink-0 text-brand-400" />
              <a href={site.mailHref} className="text-cream/70 hover:text-cream">
                {site.email}
              </a>
            </li>
            <li className="flex items-start gap-3">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
              <span className="text-cream/70">
                {site.hours.map((h) => (
                  <span key={h.day} className="block">
                    {h.day}: {h.time}
                  </span>
                ))}
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/*
        Kategorijske stranice kao obični linkovi, sa svake strane sajta.

        ZAŠTO OVDE: katalog na `/proizvodi` je klijentska komponenta i u
        serverski generisanom HTML-u nema nijedan link ka proizvodu. Ove strane
        su ranije visile na jednom bloku na dnu `/proizvodi`; kad je taj blok
        uklonjen, ostale bi samo u sitemap-u, bez ijednog internog linka — što
        Google po pravilu ostavlja u „Discovered – currently not indexed".
        Iz futera ih sada vidi sa svake strane, što je i jače nego pre.
      */}
      <div className="border-t border-white/10">
        <div className="container py-8 text-[0.8rem]">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <h3 className="font-semibold uppercase tracking-wider text-cream/90">
                Mašine po tipu
              </h3>
              <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5">
                {machineCategories().map((c) => (
                  <li key={c.key}>
                    <Link
                      href={`/masine/${c.key}`}
                      className="text-cream/55 transition-colors hover:text-cream"
                    >
                      {c.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold uppercase tracking-wider text-cream/90">
                Auto-prikolice po programu
              </h3>
              <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5">
                {trailerCategories().map((c) => (
                  <li key={c.key}>
                    <Link
                      href={`/prikolice/${c.key}`}
                      className="text-cream/55 transition-colors hover:text-cream"
                    >
                      {c.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold uppercase tracking-wider text-cream/90">
                Oprema za prikolice
              </h3>
              <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5">
                {trailerAccessoryGroups().map((c) => (
                  <li key={c.key}>
                    <Link
                      href={`/prikolice/${c.key}`}
                      className="text-cream/55 transition-colors hover:text-cream"
                    >
                      {c.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/*
            Delovi po marki i po tipu — ista logika kao mašine i prikolice iznad.
            Bez ovoga bi 64 stranice marki i 30+ stranica tipova ostale samo u
            sitemap-u, bez ijednog internog linka.
          */}
          <div className="mt-8 border-t border-white/10 pt-8">
            <h3 className="font-semibold uppercase tracking-wider text-cream/90">
              Delovi po marki pluga
            </h3>
            <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5">
              {partBrands().map((b) => (
                <li key={b.key}>
                  <Link
                    href={`/delovi/brend/${b.key}`}
                    className="text-cream/55 transition-colors hover:text-cream"
                  >
                    {b.label}
                  </Link>
                </li>
              ))}
            </ul>

            <h3 className="mt-6 font-semibold uppercase tracking-wider text-cream/90">
              Delovi po tipu
            </h3>
            <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5">
              {partTypes().map((t) => (
                <li key={t.key}>
                  <Link
                    href={`/delovi/${t.key}`}
                    className="text-cream/55 transition-colors hover:text-cream"
                  >
                    {t.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <p className="mt-6 text-cream/45">
            Ili prelistajte{" "}
            <Link href="/katalog/1" className="text-cream/70 underline-offset-4 hover:underline">
              kompletan katalog
            </Link>{" "}
            — sve na {katalogBrojStrana()} strana.
          </p>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container flex flex-col items-center justify-between gap-3 py-6 text-xs text-cream/50 sm:flex-row">
          <p>
            © {new Date().getFullYear()} {site.name}. Sva prava zadržana.
          </p>
          <p>{site.slogan}</p>
        </div>
      </div>
    </footer>
  );
}
