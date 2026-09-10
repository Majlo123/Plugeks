import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { jeAdmin } from "@/lib/admin";
import { getTrailers, getTrailerAccessories, productHref } from "@/lib/products";
import { TRAILER_PROGRAMS } from "@/lib/catalog";
import cenovnik from "@/data/trailer-prices.json";
import { OdjavaDugme } from "./OdjavaDugme";

/**
 * Nabavne cene auto-prikolica — SAMO za vlasnika.
 *
 * Zašto baš ovde, a ne kao red na stranici proizvoda: sve stranice proizvoda su
 * statične (unapred izgenerisan HTML za ~4.800 komada). Cena upisana u takvu
 * stranicu bi završila u javnom HTML-u, u kešu i u Google-ovom indeksu — i to
 * bez ikakvog upozorenja. Ova strana se, nasuprot tome, računa pri svakom
 * zahtevu i vraća prazno svakome ko nije prijavljen.
 *
 * POPUNJAVANJE CENA: `src/data/trailer-prices.json`, oblik
 * `{ "valuta": "EUR", "cene": { "9001": 1180, "9002": 1340 } }` — ključ je
 * kataloški broj iz kolone „Šifra" ispod. Ono što nije upisano stoji kao „—".
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Nabavne cene — interno",
  robots: { index: false, follow: false, nocache: true },
};

type Cenovnik = { valuta: string; cene: Record<string, number> };

export default function CenePage() {
  if (!jeAdmin()) redirect("/admin");

  const { valuta, cene } = cenovnik as Cenovnik;
  const prikolice = getTrailers();
  const oprema = getTrailerAccessories();
  const upisano = [...prikolice, ...oprema].filter((p) => cene[p.id] != null).length;
  const ukupno = prikolice.length + oprema.length;

  return (
    <section className="section bg-cream pt-28 md:pt-32">
      <div className="container">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-charcoal md:text-3xl">
              Nabavne cene — auto-prikolice
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Vidi se samo prijavljenom. Nijedan od ovih iznosa ne postoji na
              javnim stranicama sajta.
            </p>
          </div>
          <OdjavaDugme />
        </div>

        <p className="mt-6 rounded-2xl border border-border bg-white p-5 text-sm text-muted-foreground">
          Upisano <strong className="text-charcoal">{upisano}</strong> od{" "}
          <strong className="text-charcoal">{ukupno}</strong>. Cene se unose u
          fajl{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-charcoal">
            src/data/trailer-prices.json
          </code>{" "}
          — ključ je šifra iz prve kolone, iznos je broj bez oznake valute (
          {valuta}).
        </p>

        <Tabela naslov="Prikolice" stavke={prikolice} cene={cene} valuta={valuta} />
        <Tabela naslov="Dodatna oprema" stavke={oprema} cene={cene} valuta={valuta} />
      </div>
    </section>
  );
}

function Tabela({
  naslov,
  stavke,
  cene,
  valuta,
}: {
  naslov: string;
  stavke: ReturnType<typeof getTrailers>;
  cene: Record<string, number>;
  valuta: string;
}) {
  if (stavke.length === 0) return null;

  return (
    <div className="mt-10">
      <h2 className="font-display text-xl font-bold text-charcoal">
        {naslov}{" "}
        <span className="text-base font-normal text-muted-foreground">
          ({stavke.length})
        </span>
      </h2>

      {/* Tabela je jedini element na sajtu koji sme da bude širi od ekrana —
          zato u svom `overflow-x` okviru, da telefon ne skroluje celu stranu. */}
      <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-white">
        <table className="w-full min-w-[40rem] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3 font-semibold">Šifra</th>
              <th className="px-4 py-3 font-semibold">Naziv</th>
              <th className="px-4 py-3 font-semibold">Program</th>
              <th className="px-4 py-3 text-right font-semibold">
                Nabavna cena ({valuta})
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {stavke.map((p, i) => {
              const cena = cene[p.id];
              return (
                <tr key={p.id} className={i % 2 ? "bg-cream/40" : undefined}>
                  <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs text-muted-foreground">
                    {p.id}
                  </td>
                  <td className="px-4 py-2.5 text-charcoal">{p.name}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-muted-foreground">
                    {TRAILER_PROGRAMS[p.typeKey ?? ""]?.oznaka ?? p.typeLabel ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right font-medium tabular-nums text-charcoal">
                    {cena != null ? cena.toLocaleString("sr-RS") : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <Link
                      href={productHref(p)}
                      className="inline-flex items-center gap-1 text-xs text-brand hover:underline"
                    >
                      Stranica <ExternalLink className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
