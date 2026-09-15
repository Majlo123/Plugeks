import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { jeAdmin } from "@/lib/admin";
import { getTrailers, getTrailerAccessories, productHref } from "@/lib/products";
import { TRAILER_PROGRAMS, normalize } from "@/lib/catalog";
import { OdjavaDugme } from "./OdjavaDugme";
import { CeneTabele, type Red } from "./CeneTabele";
import { CENOVNIK, dinara, datumCenovnika } from "@/lib/cene";

/**
 * Pregled cenovnika auto-prikolica na jednom mestu — za vlasnika.
 *
 * Od 15. 9. 2026. iste cene stoje i javno, na stranici i kartici svake
 * prikolice (vidi `lib/cene.ts` — zašto). Ova strana je ostala kao tabela za
 * brzu proveru: koji modeli imaju cenu, koji su na upit i od kog datuma je
 * stanje. I dalje traži prijavu, jer nije za kupce nego za održavanje.
 *
 * ODAKLE CENE: `src/data/trailer-prices.json`, koji puni
 * `npm run cene` (`scripts/import-trailer-prices.mjs`) sa istog izvora sa kog
 * je uzet i program prikolica. Iznosi su u dinarima, onako kako ih izvor
 * objavljuje. Ručna izmena je i dalje moguća — ključ je kataloški broj iz
 * kolone „Šifra”, ali će je sledeće pokretanje skripte pregaziti.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cenovnik prikolica — interno",
  robots: { index: false, follow: false, nocache: true },
};

export default function CenePage() {
  if (!jeAdmin()) redirect("/admin");

  const { valuta, izvor, cene } = CENOVNIK;

  /* Redovi se sastavljaju ovde da klijentska komponenta ne uvuče ni katalog ni
     cenovnik u bundle — `search` je gotov ključ za pretragu bez dijakritike. */
  const uRed = (p: ReturnType<typeof getTrailers>[number]): Red => {
    const program = TRAILER_PROGRAMS[p.typeKey ?? ""]?.oznaka ?? p.typeLabel ?? "—";
    const cena = cene[p.id] ?? null;
    return {
      id: p.id,
      naziv: p.name,
      program,
      href: productHref(p),
      cena,
      search: normalize(
        [p.id, p.name, program, cena != null ? dinara(cena) : "bez cene"].join(" "),
      ),
    };
  };

  const prikolice = getTrailers().map(uRed);
  const oprema = getTrailerAccessories().map(uRed);
  const ukupno = prikolice.length + oprema.length;
  const upisano = [...prikolice, ...oprema].filter((r) => r.cena != null).length;
  const kada = datumCenovnika();

  return (
    <section className="section bg-cream pt-28 md:pt-32">
      <div className="container">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-charcoal md:text-3xl">
              Cenovnik — auto-prikolice
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Isti iznosi stoje javno na stranici i kartici svake prikolice;
              ovde su svi na jednom mestu radi provere.
            </p>
          </div>
          <OdjavaDugme />
        </div>

        <p className="mt-6 rounded-2xl border border-border bg-white p-5 text-sm text-muted-foreground">
          Upisano <strong className="text-charcoal">{upisano}</strong> od{" "}
          <strong className="text-charcoal">{ukupno}</strong>, u{" "}
          <strong className="text-charcoal">dinarima ({valuta})</strong>.
          {izvor && kada ? (
            <>
              {" "}
              Iznosi su preuzeti sa{" "}
              <a
                href={izvor}
                rel="noopener noreferrer nofollow"
                target="_blank"
                className="text-brand hover:underline"
              >
                {izvor.replace(/^https?:\/\//, "")}
              </a>
              , stanje <strong className="text-charcoal">{kada}</strong>
            </>
          ) : null}{" "}
          Osvežavanje:{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-charcoal">
            npm run cene
          </code>{" "}
          — upisuje{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-charcoal">
            src/data/trailer-prices.json
          </code>
          . Ono što izvor vodi po upitu, ili više ne prodaje, stoji kao „—”.
        </p>

        <CeneTabele prikolice={prikolice} oprema={oprema} valuta={valuta} />
      </div>
    </section>
  );
}
