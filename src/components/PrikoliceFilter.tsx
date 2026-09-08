"use client";

import { useMemo, useState } from "react";
import { trailers, trailerBadge, facetLabel, type CatalogItem } from "@/lib/catalog";
import { TrailerCard } from "@/components/CatalogCard";
import { uzBroj } from "@/lib/brojevi";
import { cn } from "@/lib/utils";

/**
 * Spisak prikolica jednog programa (LIGHT, MARINE…) sa filterima u obliku
 * čipova.
 *
 * Kupac je vrstu prikolice već izabrao po slici na `/prikolice`, pa mu ovde
 * trebaju samo dva pitanja: jedno- ili dvoosovinska i koliko sme da vuče.
 * Zato nema kombo-polja i nema pretrage — filter je vidljiv u jednom redu, a
 * kad program nema izbora (npr. sva oprema, ili MOTO koji je sav
 * jednoosovinski) čipovi se ni ne prikazuju.
 *
 * Prikolice se čitaju iz `trailers` (isti podaci koje već nosi katalog), pa se
 * kroz props ne prenosi ništa osim ključa programa. Komponenta se renderuje i
 * na serveru, tako da svaka kartica ima `<a href>` u HTML-u i pre JS-a.
 */

/** Faseta se nudi samo ako u programu zaista postoji izbor (bar dve vrednosti). */
const FILTERI = [
  { key: "osovine", label: "Broj osovina" },
  { key: "masa", label: "Najveća masa" },
] as const;

/**
 * Redosled čipova: mase su brojevi u stringu („750”, „1300”) pa idu brojčano,
 * osovine po broju osovina (prvo jedna, pa dve) — abecedno bi dalo obrnuto.
 */
const RED_OSOVINA = ["jednoosovinske", "dvoosovinske"];

const poVrednosti = (key: string) => (a: string, b: string) => {
  if (key === "masa") return Number(a) - Number(b);
  if (key === "osovine") return RED_OSOVINA.indexOf(a) - RED_OSOVINA.indexOf(b);
  return a.localeCompare(b, "sr");
};

export function PrikoliceFilter({ program }: { program: string }) {
  const items = useMemo(
    () => trailers.filter((t) => t.facets.program === program),
    [program],
  );

  /** Po jedna izabrana vrednost po fasti; prazno = „Sve”. */
  const [izbor, setIzbor] = useState<Record<string, string>>({});

  /** Rezultat uz sve fasete osim jedne — za brojeve na čipovima te fasete. */
  const filtriraj = (bezKljuca?: string) =>
    items.filter((t) =>
      Object.entries(izbor).every(
        ([key, value]) => key === bezKljuca || t.facets[key] === value,
      ),
    );

  const rezultati = filtriraj();

  const redovi = FILTERI.map(({ key, label }) => {
    const pool = filtriraj(key);
    const vrednosti = [...new Set(items.map((t) => t.facets[key]).filter(Boolean))].sort(
      poVrednosti(key),
    );
    return {
      key,
      label,
      // Opcija koja bi dala prazan spisak se ne nudi (npr. „3500 kg" pošto je
      // izabrano „Jednoosovinske") — osim ako je baš ona izabrana.
      opcije: vrednosti
        .map((value) => ({
          value,
          label: facetLabel("prikolice", key, value),
          count: pool.filter((t) => t.facets[key] === value).length,
        }))
        .filter((o) => o.count > 0 || izbor[key] === o.value),
    };
  }).filter((red) => red.opcije.length > 1);

  const aktivnih = Object.keys(izbor).length;
  // Prikolice se broje u modelima, dodatna oprema u komadima.
  const jeOprema = items[0]?.facets.tip === "oprema";

  return (
    <div>
      {redovi.length > 0 ? (
        <div className="rounded-2xl border border-border bg-white p-4 shadow-card sm:p-5">
          {redovi.map((red, i) => (
            <div
              key={red.key}
              className={cn(
                "flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4",
                i > 0 && "mt-4 border-t border-border pt-4",
              )}
            >
              <span className="shrink-0 text-sm font-semibold text-charcoal sm:w-40">
                {red.label}
              </span>
              <div className="flex flex-wrap gap-2">
                <Cip
                  aktivan={!izbor[red.key]}
                  onClick={() =>
                    setIzbor(({ [red.key]: _, ...ostalo }) => ostalo)
                  }
                >
                  Sve
                </Cip>
                {red.opcije.map((o) => (
                  <Cip
                    key={o.value}
                    aktivan={izbor[red.key] === o.value}
                    // Ponovni klik na izabran čip ga isključuje — kraće nego
                    // ciljati „Sve” na telefonu.
                    onClick={() =>
                      setIzbor((prethodni) =>
                        prethodni[red.key] === o.value
                          ? Object.fromEntries(
                              Object.entries(prethodni).filter(([k]) => k !== red.key),
                            )
                          : { ...prethodni, [red.key]: o.value },
                      )
                    }
                  >
                    {o.label}
                    <span
                      className={cn(
                        "ml-1.5 text-[0.78em]",
                        izbor[red.key] === o.value ? "text-cream/70" : "text-muted-foreground",
                      )}
                    >
                      {o.count}
                    </span>
                  </Cip>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <p className="my-6 text-sm text-muted-foreground">
        {aktivnih > 0 ? "Odgovara vam " : "U ponudi "}
        <span className="font-semibold text-charcoal">{rezultati.length}</span>{" "}
        {jeOprema
          ? uzBroj(rezultati.length, "komad", "komada", "komada")
          : uzBroj(rezultati.length, "model", "modela", "modela")}
        {aktivnih > 0 ? (
          <>
            {" · "}
            <button
              type="button"
              onClick={() => setIzbor({})}
              className="font-medium text-brand underline-offset-4 hover:underline"
            >
              Poništi filtere
            </button>
          </>
        ) : null}
      </p>

      {rezultati.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 min-[360px]:grid-cols-2 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {rezultati.map((item: CatalogItem) => (
            <TrailerCard key={item.id} item={item} typeLabel={trailerBadge(item)} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border py-14 text-center">
          <p className="text-muted-foreground">
            Nema modela sa tom kombinacijom u ovom programu.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Pozovite nas — često se nađe rešenje u susednom programu.
          </p>
        </div>
      )}
    </div>
  );
}

function Cip({
  aktivan,
  onClick,
  children,
}: {
  aktivan: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={aktivan}
      className={cn(
        "inline-flex h-10 items-center rounded-full border px-4 text-sm font-medium transition-colors",
        aktivan
          ? "border-brand bg-brand text-cream"
          : "border-border bg-white text-foreground/80 hover:border-brand/40 hover:text-brand",
      )}
    >
      {children}
    </button>
  );
}
