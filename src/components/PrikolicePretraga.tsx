"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import { Search, X } from "lucide-react";
import {
  trailers,
  brojPrvi,
  filterItems,
  trailersFirst,
} from "@/lib/catalog";
import { TrailerCard } from "@/components/CatalogCard";
import { uzBroj } from "@/lib/brojevi";

/**
 * Opšta pretraga prikolica i opreme — jedno polje iznad pločica na `/prikolice`.
 *
 * Pločice biraju po slici (program → model), ali kupac koji zna šta hoće
 * („light 23", „cerada 2,5", „za čamac", „750 kg") ne treba da pogađa program.
 * Pretražuje se ceo program prikolica i sve opreme odjednom, po istom indeksu
 * koji koristi i katalog (`CatalogItem.search`: naziv, oznaka modela, namena
 * programa, grupa opreme, narodni pojmovi).
 *
 * Dok je polje prazno prikazuju se `children` — pločice sa serverske strane,
 * pa Google i posetilac bez JS-a vide isto što i pre. Čim se kuca, pločice se
 * sklone i umesto njih stoje pogoci: prikolice pre opreme, pa u propisanom
 * redosledu kataloga.
 */
export function PrikolicePretraga({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState("");
  const polje = useRef<HTMLDivElement>(null);

  const upit = query.trim();
  const pogoci = useMemo(() => {
    if (!upit) return [];
    // Prikolice pre opreme, unutar toga po ceni — `trailersFirst` samo deli
    // na dve grupe i čuva redosled iz `trailers`, koji je već po ceni.
    return brojPrvi(trailersFirst(filterItems(trailers, {}, upit)), upit);
  }, [upit]);

  const prikolica = pogoci.filter((p) => p.facets.tip !== "oprema").length;
  const opreme = pogoci.length - prikolica;

  return (
    <div>
      <div ref={polje} className="relative scroll-mt-[4.65rem] md:scroll-mt-[5.2rem]">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            // Na telefonu tastatura pojede pola ekrana — popni polje odmah
            // ispod (fiksnog) headera da ispod njega ostane mesta za pogotke.
            if (typeof window === "undefined" || window.innerWidth >= 768) return;
            polje.current?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
          type="search"
          autoComplete="off"
          aria-label="Pretraga prikolica i opreme"
          placeholder="Pretraži prikolice i opremu — model, nosivost, kataloški broj…"
          // 16px na telefonu: Safari na iOS-u sam zumira stranicu čim se
          // fokusira polje sa sitnijim slovima, pa polje odleti iz kadra.
          className="h-12 w-full rounded-xl border border-input bg-white pl-11 pr-11 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-ring md:text-sm"
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Obriši pretragu"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-charcoal"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {upit ? (
        <div className="mt-6">
          <p className="text-sm text-muted-foreground">
            {pogoci.length === 0 ? (
              <>
                Nema pogodaka za „<span className="font-medium text-charcoal">{upit}</span>”.
              </>
            ) : (
              <>
                Za „<span className="font-medium text-charcoal">{upit}</span>”:{" "}
                <span className="font-semibold text-charcoal">{prikolica}</span>{" "}
                {uzBroj(prikolica, "prikolica", "prikolice", "prikolica")}
                {opreme > 0 ? (
                  <>
                    {" "}
                    i <span className="font-semibold text-charcoal">{opreme}</span>{" "}
                    {uzBroj(opreme, "komad", "komada", "komada")} opreme
                  </>
                ) : null}
              </>
            )}
          </p>

          {pogoci.length > 0 ? (
            <div className="mt-5 grid grid-cols-1 gap-4 min-[360px]:grid-cols-2 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
              {pogoci.map((item) => (
                <TrailerCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-border py-14 text-center">
              <p className="text-muted-foreground">
                Probajte oznaku modela (npr. „light 23”), nosivost („750”) ili namenu
                („čamac”, „motocikl”).
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Ili nas pozovite — katalog je širi od onoga što je ovde prikazano.
              </p>
            </div>
          )}
        </div>
      ) : (
        children
      )}
    </div>
  );
}
