"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Search, X } from "lucide-react";
import {
  loadParts,
  machines,
  trailers,
  normalize,
  productPath,
  type CatalogItem,
} from "@/lib/catalog";
import { cn } from "@/lib/utils";

/**
 * Pretraga u headeru — radi sa SVAKE stranice, ne samo iz kataloga.
 *
 * ZAŠTO: do sada je polje za pretragu postojalo jedino na `/proizvodi`. Posetilac
 * koji sa Google-a sleti pravo na stranicu jednog dela (a tako i stiže — 4.644
 * strane delova su glavni ulaz na sajt) nije imao odakle da potraži drugi broj
 * nego da se vrati u katalog i tamo počne iznova.
 *
 * Mašine i prikolice su već u bundle-u (mali fajlovi), pa se traže odmah.
 * `parts.json` (~300 KB) se dovlači tek pri prvom otvaranju polja — isti
 * `loadParts()` koji koristi i katalog, sa istim keširanjem, pa se preuzima
 * najviše jednom po poseti.
 */

/** Iznad ovoga se ne prikazuje lista nego se nudi ceo rezultat u katalogu. */
const MAX_PREDLOGA = 8;

/** Kraće od ovoga daje stotine pogodaka koje ništa ne znače. */
const MIN_SLOVA = 2;

export function HeaderSearch({ className }: { className?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [parts, setParts] = useState<CatalogItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const okvir = useRef<HTMLDivElement>(null);
  const polje = useRef<HTMLInputElement>(null);

  /* ----------------------------- Otvaranje ------------------------------- */

  // Delovi se dovlače pri prvom otvaranju, ne pri montiranju headera — inače bi
  // svaka strana sajta povukla 300 KB koje većina posetilaca nikad ne iskoristi.
  useEffect(() => {
    if (!open || parts || loading) return;
    setLoading(true);
    let otkazano = false;
    loadParts().then((ucitani) => {
      if (otkazano) return;
      setParts(ucitani);
      setLoading(false);
    });
    return () => {
      otkazano = true;
    };
  }, [open, parts, loading]);

  useEffect(() => {
    if (open) polje.current?.focus();
  }, [open]);

  const zatvori = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);

  // Klik izvan i Escape zatvaraju panel.
  useEffect(() => {
    if (!open) return;
    const naKlik = (e: MouseEvent) => {
      if (!okvir.current?.contains(e.target as Node)) zatvori();
    };
    const naTaster = (e: KeyboardEvent) => {
      if (e.key === "Escape") zatvori();
    };
    document.addEventListener("mousedown", naKlik);
    document.addEventListener("keydown", naTaster);
    return () => {
      document.removeEventListener("mousedown", naKlik);
      document.removeEventListener("keydown", naTaster);
    };
  }, [open, zatvori]);

  /* ------------------------------ Rezultati ------------------------------ */

  const pojmovi = useMemo(
    () => normalize(query).split(/\s+/).filter(Boolean),
    [query],
  );

  const pogodci = useMemo(() => {
    if (query.trim().length < MIN_SLOVA) return null;

    const svi: CatalogItem[] = [...machines, ...trailers, ...(parts ?? [])];
    const nadjeni = svi.filter((i) => pojmovi.every((t) => i.search.includes(t)));

    // Tačan kataloški broj ide na vrh — ko ga kuca, traži baš taj komad.
    const tacan = normalize(query).trim();
    nadjeni.sort((a, b) => {
      const aTacan = a.id === tacan ? 0 : 1;
      const bTacan = b.id === tacan ? 0 : 1;
      return aTacan - bTacan || a.name.localeCompare(b.name, "sr");
    });

    return { lista: nadjeni.slice(0, MAX_PREDLOGA), ukupno: nadjeni.length };
  }, [query, pojmovi, parts]);

  /** Enter vodi u katalog sa istim upitom — tamo su filteri i cela lista. */
  const uKatalog = () => {
    const q = query.trim();
    if (!q) return;
    zatvori();
    router.push(`/proizvodi?vrsta=delovi&q=${encodeURIComponent(q)}`);
  };

  /* -------------------------------- Prikaz ------------------------------- */

  return (
    <div ref={okvir} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => (open ? zatvori() : setOpen(true))}
        aria-label={open ? "Zatvori pretragu" : "Pretraži delove i mašine"}
        aria-expanded={open}
        className="grid h-10 w-10 place-items-center rounded-full border border-border bg-white text-charcoal transition-colors hover:border-brand/40 hover:text-brand"
      >
        {open ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
      </button>

      {open ? (
        <div className="absolute right-0 top-12 z-50 w-[min(92vw,30rem)] overflow-hidden rounded-2xl border border-border bg-white shadow-lift">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              uKatalog();
            }}
            className="relative border-b border-border"
          >
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={polje}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              type="search"
              enterKeyHint="search"
              placeholder="Kataloški broj, naziv dela ili marka pluga…"
              className="h-12 w-full bg-transparent pl-11 pr-4 text-sm outline-none placeholder:text-muted-foreground"
            />
          </form>

          <div className="max-h-[min(60vh,24rem)] overflow-y-auto">
            {query.trim().length < MIN_SLOVA ? (
              <p className="px-4 py-4 text-sm text-muted-foreground">
                Ukucajte kataloški broj sa dela (npr. <strong>3374</strong>), naziv
                (<strong>raonik</strong>) ili marku pluga (<strong>Lemken</strong>).
              </p>
            ) : loading && !parts ? (
              <p className="flex items-center gap-2 px-4 py-4 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Učitavanje kataloga…
              </p>
            ) : pogodci && pogodci.lista.length > 0 ? (
              <>
                <ul className="divide-y divide-border">
                  {pogodci.lista.map((i) => (
                    <li key={`${i.type}-${i.id}`}>
                      <Link
                        href={productPath(i)}
                        onClick={zatvori}
                        className="flex items-baseline justify-between gap-3 px-4 py-3 transition-colors hover:bg-cream"
                      >
                        <span className="min-w-0 text-sm text-foreground/90">{i.name}</span>
                        <span className="shrink-0 text-xs font-medium text-muted-foreground">
                          {i.id}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={uKatalog}
                  className="w-full border-t border-border px-4 py-3 text-left text-sm font-medium text-brand hover:bg-cream"
                >
                  {pogodci.ukupno > pogodci.lista.length
                    ? `Prikaži svih ${pogodci.ukupno} rezultata u katalogu`
                    : "Otvori u katalogu sa filterima"}
                </button>
              </>
            ) : (
              <div className="px-4 py-4 text-sm text-muted-foreground">
                <p>Nema pogotka za „{query.trim()}“.</p>
                <p className="mt-2">
                  Katalog je širi od onoga što je na sajtu —{" "}
                  <Link
                    href="/zatrazi-ponudu"
                    onClick={zatvori}
                    className="font-medium text-brand hover:underline"
                  >
                    pošaljite nam broj ili fotografiju dela
                  </Link>{" "}
                  pa proveravamo direktno.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
