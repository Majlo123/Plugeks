"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { normalize } from "@/lib/catalog";
import { dinara } from "./dinara";

/**
 * Tabele nabavnih cena sa pretragom.
 *
 * Klijentska komponenta samo zbog polja za pretragu — 181 red je premalo da bi
 * filtriranje išlo na server; strana je i tako `force-dynamic`, pa bi svaki
 * ukucani znak bio nov zahtev.
 *
 * Redove sastavlja `page.tsx` (serverski), zajedno sa `search` ključem — ovde
 * ne ulazi ni katalog ni cenovnik, samo ono što se prikazuje.
 */

export type Red = {
  id: string;
  naziv: string;
  program: string;
  href: string;
  cena: number | null;
  search: string;
};

export function CeneTabele({
  prikolice,
  oprema,
  valuta,
}: {
  prikolice: Red[];
  oprema: Red[];
  valuta: string;
}) {
  const [upit, setUpit] = useState("");

  /* Reč po reč, svaka mora da se nađe — isto pravilo kao pretraga kataloga. */
  const { trazi, nadjenePrikolice, nadjenaOprema } = useMemo(() => {
    const termini = normalize(upit).split(/\s+/).filter(Boolean);
    const filtriraj = (redovi: Red[]) =>
      termini.length === 0
        ? redovi
        : redovi.filter((r) => termini.every((t) => r.search.includes(t)));

    return {
      trazi: termini.length > 0,
      nadjenePrikolice: filtriraj(prikolice),
      nadjenaOprema: filtriraj(oprema),
    };
  }, [upit, prikolice, oprema]);

  const nadjeno = nadjenePrikolice.length + nadjenaOprema.length;

  return (
    <>
      <div className="mt-8">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={upit}
            onChange={(e) => setUpit(e.target.value)}
            placeholder="Pretraga — naziv, šifra ili program (npr. „light 25”, „9012”, „cerada”)"
            aria-label="Pretraga cenovnika"
            className="pl-11 pr-11"
          />
          {upit && (
            <button
              type="button"
              onClick={() => setUpit("")}
              aria-label="Očisti pretragu"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-charcoal"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {trazi && (
          <p className="mt-2 text-sm text-muted-foreground" aria-live="polite">
            {nadjeno === 0 ? (
              <>Nema rezultata za „{upit}”.</>
            ) : (
              <>
                Nađeno <strong className="text-charcoal">{nadjeno}</strong> od{" "}
                {prikolice.length + oprema.length}.
              </>
            )}
          </p>
        )}
      </div>

      <Tabela
        naslov="Prikolice"
        redovi={nadjenePrikolice}
        ukupno={prikolice.length}
        trazi={trazi}
        valuta={valuta}
      />
      <Tabela
        naslov="Dodatna oprema"
        redovi={nadjenaOprema}
        ukupno={oprema.length}
        trazi={trazi}
        valuta={valuta}
      />
    </>
  );
}

function Tabela({
  naslov,
  redovi,
  ukupno,
  trazi,
  valuta,
}: {
  naslov: string;
  redovi: Red[];
  ukupno: number;
  trazi: boolean;
  valuta: string;
}) {
  // U pretrazi se prazna tabela sklanja — inače bi pola ekrana bio prazan okvir.
  if (redovi.length === 0) return null;

  return (
    <div className="mt-10">
      <h2 className="font-display text-xl font-bold text-charcoal">
        {naslov}{" "}
        <span className="text-base font-normal text-muted-foreground">
          ({trazi ? `${redovi.length} od ${ukupno}` : ukupno})
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
            {redovi.map((r, i) => (
              <tr key={r.id} className={i % 2 ? "bg-cream/40" : undefined}>
                <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs text-muted-foreground">
                  {r.id}
                </td>
                <td className="px-4 py-2.5 text-charcoal">{r.naziv}</td>
                <td className="whitespace-nowrap px-4 py-2.5 text-muted-foreground">
                  {r.program}
                </td>
                <td className="whitespace-nowrap px-4 py-2.5 text-right font-medium tabular-nums text-charcoal">
                  {r.cena != null ? dinara(r.cena) : "—"}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <Link
                    href={r.href}
                    className="inline-flex items-center gap-1 text-xs text-brand hover:underline"
                  >
                    Stranica <ExternalLink className="h-3 w-3" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
