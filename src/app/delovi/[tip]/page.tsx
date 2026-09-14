import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ListaProizvoda } from "@/components/ListaProizvoda";
import { KontaktCTA } from "@/components/sections/KontaktCTA";
import {
  partTypes,
  getPartsByType,
  partBrands,
  brandsForPartType,
  katBrojeva,
  kontekstMasine,
  preovladjujucaGrupa,
  tipZaMasinu,
  uzBroj,
  ogSlikaSpiska,
  drustveneSlike,
} from "@/lib/products";
import { PutanjaJsonLd } from "@/components/PutanjaJsonLd";
import { SpisakJsonLd } from "@/components/SpisakJsonLd";

/**
 * Stranica po tipu dela (raonik, daska, plaz…). Ovo su pojmovi koje
 * ljudi zaista kucaju, a do sada su postojali samo kao filter u URL-u
 * (`/proizvodi?vrsta=delovi&tip=lemes`), što Google ne indeksira kao zasebnu
 * stranicu.
 */

/** Duže liste seče `/katalog`, koji ionako pokriva baš sve. */
const MAX_NA_STRANI = 300;

const nadjiTip = (kljuc: string) => partTypes().find((t) => t.key === kljuc);

/**
 * Naslov strane: „Raonik za plugove", „Traka elevatora za vadilice krompira",
 * „Nož roto drljače". Mašina se čita iz samih delova tog tipa, a ne piše
 * fiksno „za plugove" — katalog nosi i delove za sejalice, vadilice, tanjirače
 * i roto drljače, i svaki od tih tipova je ranije tvrdio da je za plug.
 */
function naslovTipa(tip: { key: string; label: string }) {
  const delovi = getPartsByType(tip.key);
  const grupa = preovladjujucaGrupa(delovi);
  return { h1: tipZaMasinu(tip.label, grupa), kontekst: kontekstMasine(grupa), grupa };
}

export function generateStaticParams() {
  return partTypes().map((t) => ({ tip: t.key }));
}

export function generateMetadata({ params }: { params: { tip: string } }): Metadata {
  const tip = nadjiTip(params.tip);
  if (!tip) return {};
  const { h1, kontekst } = naslovTipa(tip);
  const opis = `${h1} svih vodećih proizvođača. ${katBrojeva(tip.count)} na stanju ili po porudžbini. Zatražite ponudu, javljamo se isti dan.`;

  return {
    title: `${h1} — ${tip.count} ${uzBroj(tip.count, "deo", "dela", "delova")}`,
    description: opis,
    alternates: { canonical: `/delovi/${tip.key}` },
    keywords: [tip.label, h1, `rezervni delovi za ${kontekst}`, "PlugekS"],
    // Slika strane je crtež prvog dela iz same kategorije, a ne logo iz layout-a.
    ...drustveneSlike({
      url: `/delovi/${tip.key}`,
      title: `${h1} | PlugekS`,
      description: opis,
      slika: ogSlikaSpiska(getPartsByType(tip.key)),
    }),
  };
}

export default function TipDelaPage({ params }: { params: { tip: string } }) {
  const tip = nadjiTip(params.tip);
  if (!tip) notFound();

  const svi = getPartsByType(tip.key);
  const prikazani = svi.slice(0, MAX_NA_STRANI);
  const ostali = svi.length - prikazani.length;
  const { h1, kontekst } = naslovTipa(tip);
  // Marke za koje baš ovaj tip ima svoju ukrštenu stranu.
  const ukrstene = brandsForPartType(tip.key);

  return (
    <>
      <PutanjaJsonLd
        stavke={[
          { naziv: "Proizvodi", href: "/proizvodi" },
          { naziv: h1, href: `/delovi/${tip.key}` },
        ]}
      />
      <SpisakJsonLd naziv={h1} stavke={prikazani} ukupno={svi.length} />
      <section className="section bg-cream pt-28 md:pt-32">
        <div className="container">
          <h1 className="font-display text-2xl font-bold text-charcoal md:text-3xl">
            {h1}
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">
            {katBrojeva(tip.count)} za {kontekst} svih vodećih proizvođača. Recite nam
            marku i model mašine — pronaći ćemo odgovarajući deo i poslati cenu isti dan.
          </p>

          <div className="mt-8">
            <ListaProizvoda items={prikazani} />
          </div>

          {ostali > 0 && (
            <p className="mt-10 border-t border-border pt-6 text-sm text-muted-foreground">
              Prikazano prvih {prikazani.length} od {svi.length}. Ostatak je u{" "}
              <Link href="/katalog/1" className="font-medium text-brand hover:underline">
                kompletnom katalogu
              </Link>{" "}
              ili nam javite kataloški broj pa proveravamo direktno.
            </p>
          )}

          <nav className="mt-12 border-t border-border pt-6">
            {/* Marke su ovde zato što se „raonik" i „raonik za Lemken" traže kao
                dva različita upita — svaka strana mora da vodi na onu drugu.
                Link ide na ukrštenu stranu kad ona postoji (`/delovi/tip/marka`):
                natpis obećava baš tu kombinaciju, pa mora i da je isporuči —
                ranije je vodio na spisak SVIH delova te marke. */}
            {ukrstene.length > 0 ? (
              <>
                <p className="text-sm font-semibold text-charcoal">
                  {tip.label} po marki mašine
                </p>
                <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                  {ukrstene.map((b) => (
                    <li key={b.key}>
                      <Link
                        href={`/delovi/${tip.key}/${b.key}`}
                        className="text-brand hover:underline"
                      >
                        {tip.label} {b.label}
                      </Link>{" "}
                      <span className="text-muted-foreground">({b.count})</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}

            <p className="mt-8 text-sm font-semibold text-charcoal">Svi delovi po marki mašine</p>
            <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
              {partBrands().map((b) => (
                <li key={b.key}>
                  <Link href={`/delovi/brend/${b.key}`} className="text-brand hover:underline">
                    {b.label}
                  </Link>
                </li>
              ))}
            </ul>

            <p className="mt-8 text-sm font-semibold text-charcoal">Ostali tipovi delova</p>
            <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
              {partTypes()
                .filter((t) => t.key !== tip.key)
                .map((t) => (
                  <li key={t.key}>
                    <Link href={`/delovi/${t.key}`} className="text-brand hover:underline">
                      {t.label}{" "}
                      <span className="text-muted-foreground">({t.count})</span>
                    </Link>
                  </li>
                ))}
            </ul>
          </nav>
        </div>
      </section>

      <KontaktCTA />
    </>
  );
}
