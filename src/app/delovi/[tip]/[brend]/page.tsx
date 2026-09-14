import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { ArrowRight, Phone } from "lucide-react";
import { ListaProizvoda } from "@/components/ListaProizvoda";
import { KontaktCTA } from "@/components/sections/KontaktCTA";
import { PutanjaJsonLd } from "@/components/PutanjaJsonLd";
import { SpisakJsonLd, PitanjaJsonLd, Pitanja } from "@/components/SpisakJsonLd";
import { Button } from "@/components/ui/button";
import { site } from "@/lib/site";
import {
  partTypes,
  partTypeBrandPairs,
  getPartsByTypeAndBrand,
  brandsForPartType,
  partTypesWithPageForBrand,
  katBrojeva,
  kontekstMasine,
  preovladjujucaGrupa,
  tipZaMasinu,
  uzBroj,
  ogSlikaSpiska,
  drustveneSlike,
  type Product,
  type UkrstenaKategorija,
} from "@/lib/products";

/**
 * Ukrštena stranica: jedan tip dela za jednu marku pluga („Raonik za plugove
 * Lemken").
 *
 * ZAŠTO POSTOJI: kupac retko kuca goli pojam. „Raonik" i „delovi za Lemken" već
 * imaju svoje strane, ali stvarni upit je treći — „raonik za Lemken plug" — i za
 * njega do sada nijedna naša strana nije imala oba pojma u naslovu. Google je
 * tada nudio širu kategoriju, koja gubi od konkurenta sa preciznim naslovom.
 *
 * Generišu se samo kombinacije sa najmanje `MIN_ZA_UKRSTENU` delova (vidi
 * `partTypeBrandPairs`) — ispod toga stranica nema šta da pokaže.
 */

const MAX_NA_STRANI = 300;

const nadji = (tip: string, brend: string): UkrstenaKategorija | undefined =>
  partTypeBrandPairs().find((u) => u.tipKey === tip && u.brendKey === brend);

export function generateStaticParams() {
  return partTypeBrandPairs().map((u) => ({ tip: u.tipKey, brend: u.brendKey }));
}

/* --------------------------------- Tekst ---------------------------------- */

/**
 * „Raonik za plugove Lemken", „Nož roto drljače Maschio" — isti oblik u naslovu,
 * H1 i breadcrumb-u. Mašina dolazi iz grupe koja među tim delovima preovlađuje.
 */
const naslov = (u: UkrstenaKategorija, grupa: string) =>
  `${tipZaMasinu(u.tipLabel, grupa)} ${u.brendLabel}`;

/** Koliko komada nosi oznaku strane ugradnje — „levi i desni" je čest upit. */
function strane(delovi: Product[]) {
  const levi = delovi.filter((p) => p.sideKey === "levi").length;
  const desni = delovi.filter((p) => p.sideKey === "desni").length;
  return levi > 0 && desni > 0 ? { levi, desni } : null;
}

/**
 * Uvodni pasus se sastavlja iz stvarnog sadržaja kataloga za baš tu kombinaciju
 * — bez izmišljanja brojki i bez teksta prepisanog sa kategorije iznad.
 */
function uvod(u: UkrstenaKategorija, delovi: Product[], grupa: string): string {
  const podela = strane(delovi);

  return [
    // Naziv tipa dolazi iz podataka i ostaje u NOMINATIVU — rečenica je zato
    // sastavljena tako da on bude subjekat. Deklinacija po šablonu daje „za
    // daska" umesto „za dasku"; isto pravilo važi i na strani marke.
    `${naslov(u, grupa)} — u katalogu ${katBrojeva(
      u.count,
    )}, na stanju ili po porudžbini.`,
    podela
      ? `Deo je vezan za stranu ugradnje — ${podela.levi} ${uzBroj(
          podela.levi,
          "levi",
          "leva",
          "levih",
        )} i ${podela.desni} ${uzBroj(
          podela.desni,
          "desni",
          "desna",
          "desnih",
        )}, pa nam uz broj javite i da li je levi ili desni.`
      : null,
    "Bira se po kataloškom broju utisnutom na samom komadu; ako je izlizan, dovoljna je oznaka mašine sa pločice na ramu i fotografija dela.",
  ]
    .filter(Boolean)
    .join(" ");
}

function pitanja(u: UkrstenaKategorija, delovi: Product[], grupa: string) {
  const h1 = naslov(u, grupa);
  const podela = strane(delovi);

  // Svako pitanje počinje tačnim nazivom kategorije u nominativu: i zbog padeza
  // (vidi `uvod`) i zato što se baš taj niz reči i kuca u pretragu.
  return [
    {
      q: `${h1} — kako da znam koji komad mi treba?`,
      a: `Najsigurnije po kataloškom broju utisnutom na starom delu. Ako se ne čita, pošaljite oznaku mašine sa pločice na ramu i fotografiju dela sa strane — po obliku i merama ga prepoznajemo${
        podela ? " i potvrđujemo da li je levi ili desni" : ""
      }, pa potvrđujemo pre slanja.`,
    },
    {
      q: `${h1} — original ili zamenski deo?`,
      a: "Imamo i jedno i drugo. Za svaki broj vam pre porudžbine kažemo šta je u pitanju, koja je razlika u ceni i koliko okvirno traje — odluka je vaša, ne prodajemo zamenski deo kao original.",
    },
    {
      q: `${h1} — imate li na stanju i koliko čeka isporuka?`,
      a: "Deo asortimana je na lageru i šalje se odmah, ostalo ide po porudžbini. Javite kataloški broj i istog dana dobijate cenu, stanje i rok. Isporučujemo širom Srbije i u region.",
    },
    {
      q: `${h1} — koliko različitih brojeva imate?`,
      a: `Trenutno ${katBrojeva(
        u.count,
      )} baš za tu kombinaciju, uz preko 4.700 stavki u ukupnom katalogu potrošnih delova. Ako broj koji tražite nije na spisku, pozovite — katalog je širi od onoga što je ovde prikazano.`,
    },
  ];
}

/* -------------------------------- Metadata -------------------------------- */

export function generateMetadata({
  params,
}: {
  params: { tip: string; brend: string };
}): Metadata {
  const u = nadji(params.tip, params.brend);
  if (!u) return {};

  const delovi = getPartsByTypeAndBrand(u.tipKey, u.brendKey);
  const grupa = preovladjujucaGrupa(delovi);
  const h1 = naslov(u, grupa);
  const pojam = u.tipLabel.toLowerCase();
  const kontekst = kontekstMasine(grupa);

  return {
    // Naslov je namerno u obliku u kojem se i pretražuje.
    title: `${h1} — ${katBrojeva(u.count)}`,
    description: `${h1}: ${katBrojeva(
      u.count,
    )} na stanju ili po porudžbini. Pošaljite kataloški broj ili oznaku mašine — cena i rok isporuke isti dan. PlugekS, Žabalj.`,
    alternates: { canonical: `/delovi/${u.tipKey}/${u.brendKey}` },
    keywords: [
      `${pojam} za ${u.brendLabel}`,
      `${pojam} ${u.brendLabel}`,
      `${u.brendLabel} ${pojam}`,
      `${pojam} za ${u.brendLabel} cena`,
      `rezervni delovi za ${kontekst} ${u.brendLabel}`,
      "PlugekS",
    ],
    // Slika je crtež prvog dela baš iz ove kombinacije tipa i marke; bez nje
    // strana Google-u kao svoju sliku nudi logo nasleđen iz layout-a.
    ...drustveneSlike({
      url: `/delovi/${u.tipKey}/${u.brendKey}`,
      title: `${h1} | PlugekS`,
      description: `${katBrojeva(u.count)}. Cena i rok isporuke isti dan.`,
      slika: ogSlikaSpiska(delovi),
    }),
  };
}

/* -------------------------------- Stranica -------------------------------- */

export default function UkrstenaPage({
  params,
}: {
  params: { tip: string; brend: string };
}) {
  const u = nadji(params.tip, params.brend);
  // Kombinacija koja je pala ispod praga (npr. posle podele tipa na dva) ne
  // vraća 404 nego vodi na stranu tipa — te adrese su već bile u Google-u.
  if (!u) {
    if (partTypes().some((t) => t.key === params.tip)) permanentRedirect(`/delovi/${params.tip}`);
    notFound();
  }

  const svi = getPartsByTypeAndBrand(u.tipKey, u.brendKey);
  const prikazani = svi.slice(0, MAX_NA_STRANI);
  const ostali = svi.length - prikazani.length;
  const grupa = preovladjujucaGrupa(svi);
  const kontekst = kontekstMasine(grupa);
  const h1 = naslov(u, grupa);
  const tekst = uvod(u, svi, grupa);
  const pitanjaLista = pitanja(u, svi, grupa);

  // Unakrsni linkovi: ista marka drugi tip, isti tip druga marka. Bez njih bi
  // nove strane visile samo o sitemap-u, bez ijednog internog linka.
  const drugeMarke = brandsForPartType(u.tipKey).filter((b) => b.key !== u.brendKey);
  const drugiTipovi = partTypesWithPageForBrand(u.brendKey).filter(
    (t) => t.key !== u.tipKey,
  );

  return (
    <>
      <PutanjaJsonLd
        stavke={[
          { naziv: "Proizvodi", href: "/proizvodi" },
          { naziv: tipZaMasinu(u.tipLabel, grupa), href: `/delovi/${u.tipKey}` },
          { naziv: h1, href: `/delovi/${u.tipKey}/${u.brendKey}` },
        ]}
      />
      <SpisakJsonLd naziv={h1} opis={tekst} stavke={prikazani} ukupno={svi.length} />
      <PitanjaJsonLd pitanja={pitanjaLista} />

      <section className="section bg-cream pt-28 md:pt-32">
        <div className="container">
          <h1 className="font-display text-2xl font-bold text-charcoal md:text-3xl">
            {h1}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground md:text-base">
            {tekst}
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="primary" size="md">
              <Link href={`/zatrazi-ponudu?proizvod=${encodeURIComponent(h1)}`}>
                Pošalji kataloški broj
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="md">
              <a href={site.telHref}>
                <Phone className="h-4 w-4" />
                {site.phoneDisplay}
              </a>
            </Button>
          </div>

          <div className="mt-10">
            <h2 className="text-sm font-semibold text-charcoal">
              Svi kataloški brojevi — {h1}
            </h2>
            <div className="mt-4">
              <ListaProizvoda items={prikazani} saSlikama />
            </div>
          </div>

          {ostali > 0 && (
            <p className="mt-10 border-t border-border pt-6 text-sm text-muted-foreground">
              Prikazano prvih {prikazani.length} od {svi.length}. Ostatak je u{" "}
              <Link href="/katalog/1" className="font-medium text-brand hover:underline">
                kompletnom katalogu
              </Link>
              .
            </p>
          )}

          <Pitanja pitanja={pitanjaLista} />

          {drugeMarke.length > 0 && (
            <nav className="mt-12 border-t border-border pt-6">
              <p className="text-sm font-semibold text-charcoal">
                {u.tipLabel} za druge marke
              </p>
              <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                {drugeMarke.map((b) => (
                  <li key={b.key}>
                    <Link
                      href={`/delovi/${u.tipKey}/${b.key}`}
                      className="text-brand hover:underline"
                    >
                      {u.tipLabel} {b.label}
                    </Link>{" "}
                    <span className="text-muted-foreground">({b.count})</span>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          {drugiTipovi.length > 0 && (
            <nav className="mt-8 border-t border-border pt-6">
              <p className="text-sm font-semibold text-charcoal">
                Ostali delovi za {kontekst} {u.brendLabel}
              </p>
              <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                {drugiTipovi.map((t) => (
                  <li key={t.key}>
                    <Link
                      href={`/delovi/${t.key}/${u.brendKey}`}
                      className="text-brand hover:underline"
                    >
                      {t.label} {u.brendLabel}
                    </Link>{" "}
                    <span className="text-muted-foreground">({t.count})</span>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          <p className="mt-8 border-t border-border pt-6 text-sm text-muted-foreground">
            Ili pogledajte{" "}
            <Link
              href={`/delovi/brend/${u.brendKey}`}
              className="font-medium text-brand hover:underline"
            >
              sve delove za mašine {u.brendLabel}
            </Link>{" "}
            i{" "}
            <Link
              href={`/delovi/${u.tipKey}`}
              className="font-medium text-brand hover:underline"
            >
              {u.tipLabel.toLowerCase()} za sve marke
            </Link>
            .
          </p>
        </div>
      </section>

      <KontaktCTA />
    </>
  );
}
