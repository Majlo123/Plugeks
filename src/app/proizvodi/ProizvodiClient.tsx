"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { MediaPlaceholder } from "@/components/ui/media-placeholder";
import { ArrowLeft, ArrowRight, Caravan, Cog, Loader2, Search, Wrench, X } from "lucide-react";
import {
  FACETS,
  TYPE_META,
  facetLabel,
  facetOptions,
  filterItems,
  loadParts,
  machines,
  popularFirst,
  popularParts,
  type CatalogItem,
  type CatalogType,
} from "@/lib/catalog";
import { MultiSelect } from "@/components/ui/multi-select";
import { MachineCard, PartCard } from "@/components/CatalogCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 24;
/**
 * Prikolica ovde NEMA: one imaju svoju stranicu sa pločicama (`/prikolice`),
 * gde se bira po slici, pa tek unutar programa po broju osovina. Ovaj katalog
 * ostaje na mašinama i delovima, gde faseta zaista ima smisla.
 */
type KatalogVrsta = Extract<CatalogType, "masine" | "delovi">;
const TYPES: KatalogVrsta[] = ["masine", "delovi"];
const TYPE_ICONS = { masine: Cog, prikolice: Caravan, delovi: Wrench } as const;
const TYPE_TONES = { masine: "field", prikolice: "harvest", delovi: "steel" } as const;
/** Jednina/množina u brojaču rezultata („Prikazano 12 od 21 mašine”). */
const TYPE_COUNT_LABEL = {
  masine: "mašina",
  delovi: "delova",
} as const;

/** Vrednosti fasete se u URL-u čuvaju kao `brend=lemken,rabe-werk`. */
const parseList = (raw: string | null) => (raw ? raw.split(",").filter(Boolean) : []);

export function ProizvodiClient() {
  const router = useRouter();
  const params = useSearchParams();

  const izabrana = params.get("vrsta") as KatalogVrsta | null;
  const type = izabrana && TYPES.includes(izabrana) ? izabrana : null;
  const selection = useMemo(() => {
    if (!type) return {};
    return Object.fromEntries(
      FACETS[type].map((f) => [f.key, parseList(params.get(f.key))]),
    ) as Record<string, string[]>;
  }, [type, params]);

  /* ------------------------------ URL kao state ----------------------------- */

  // `router.replace` ne menja URL odmah, pa dva brza klika oba pročitaju isti
  // stari `params` i drugi pregazi prvi. Zato se izmene skupljaju ovde dok se
  // navigacija ne izvrši.
  const pending = useRef<URLSearchParams | null>(null);
  useEffect(() => {
    pending.current = null;
  }, [params]);

  const setParams = useCallback(
    (changes: Record<string, string | string[] | null>) => {
      const next = pending.current ?? new URLSearchParams(params.toString());
      for (const [key, value] of Object.entries(changes)) {
        const serialized = Array.isArray(value) ? value.join(",") : value;
        if (serialized) next.set(key, serialized);
        else next.delete(key);
      }
      pending.current = next;
      const qs = next.toString();
      router.replace(qs ? `/proizvodi?${qs}` : "/proizvodi", { scroll: false });
    },
    [params, router],
  );

  /* -------------------------------- Pretraga -------------------------------- */

  // Filtrira se odmah po otkucanom tekstu (sve je u memoriji), a URL se osvežava
  // sa odlaganjem — inače bi svaki taster pokretao navigaciju.
  const urlQuery = params.get("q") ?? "";
  const [query, setQuery] = useState(urlQuery);
  const searchRowRef = useRef<HTMLDivElement>(null);

  useEffect(() => setQuery(urlQuery), [urlQuery]);

  useEffect(() => {
    if (query === urlQuery) return;
    const timer = setTimeout(() => setParams({ q: query || null }), 250);
    return () => clearTimeout(timer);
  }, [query, urlQuery, setParams]);

  /**
   * Dodaje/uklanja jednu vrednost fasete. Trenutni izbor se čita iz `pending`
   * (ili URL-a), nikad iz props-a komponente — vidi komentar uz `pending`.
   */
  const toggleFacet = (facetKey: string, value: string) => {
    const current = pending.current ?? new URLSearchParams(params.toString());
    const values = parseList(current.get(facetKey));
    setParams({
      [facetKey]: values.includes(value)
        ? values.filter((v) => v !== value)
        : [...values, value],
    });
  };

  const chooseType = (next: CatalogType) =>
    // Filteri jedne vrste ne znače ništa u drugoj, pa se brišu svi osim pretrage.
    setParams({
      vrsta: next,
      ...Object.fromEntries(
        Object.values(FACETS)
          .flat()
          .map((f) => [f.key, null]),
      ),
    });

  /* ------------------------------- Podaci ---------------------------------- */

  const [parts, setParts] = useState<CatalogItem[] | null>(null);
  const [loadingParts, setLoadingParts] = useState(false);

  useEffect(() => {
    if (type !== "delovi" || parts) return;
    let cancelled = false;
    setLoadingParts(true);
    loadParts().then((loaded) => {
      if (cancelled) return;
      setParts(loaded);
      setLoadingParts(false);
    });
    return () => {
      cancelled = true;
    };
  }, [type, parts]);

  const items = useMemo(() => {
    if (type === "delovi") return parts ?? [];
    return machines;
  }, [type, parts]);
  const results = useMemo(() => {
    const found = filterItems(items, selection, query);
    if (query) return found;
    // Katalog delova otvara najtraženijim komadima (isti oni sa početne strane)
    // — inače bi prvih 24 rezultata bili prosto delovi sa najvećim id-em, bez
    // fotografije. Kad korisnik kuca u pretragu, ne diramo red.
    if (type === "delovi") return popularFirst(found);
    return found;
  }, [items, selection, query, type]);

  const [visible, setVisible] = useState(PAGE_SIZE);
  useEffect(() => setVisible(PAGE_SIZE), [type, selection, query]);

  if (!type) return <TypePicker onChoose={chooseType} />;

  const activeCount = Object.values(selection).flat().length + (query ? 1 : 0);
  const isReady = type !== "delovi" || parts !== null;

  return (
    <div>
      {/* Filteri */}
      <div className="rounded-2xl border border-border bg-white p-4 shadow-card sm:p-5">
        {/* Vrsta proizvoda — prekidač i povratak na izbor */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setParams({ vrsta: null, q: null })}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-brand"
          >
            <ArrowLeft className="h-4 w-4" />
            Nazad na izbor
          </button>

          <div className="ml-auto flex gap-2 rounded-full border border-border bg-white p-1">
            {TYPES.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => chooseType(key)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                  key === type
                    ? "bg-brand text-cream"
                    : "text-foreground/70 hover:text-brand",
                )}
              >
                {TYPE_META[key].label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 grid gap-4 border-t border-border pt-4 sm:grid-cols-2 lg:grid-cols-4">
          {FACETS[type].map((facet) => (
            <MultiSelect
              key={facet.key}
              label={facet.label}
              placeholder={facet.placeholder}
              options={facetOptions(items, type, facet.key, selection, query)}
              selected={selection[facet.key] ?? []}
              onToggle={(value) => toggleFacet(facet.key, value)}
              onClear={() => setParams({ [facet.key]: null })}
            />
          ))}
        </div>

        <div
          ref={searchRowRef}
          className="mt-4 flex scroll-mt-[4.65rem] flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center md:scroll-mt-[5.2rem]"
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => {
                // Na telefonu tastatura pojede pola ekrana — popni red sa
                // pretragom odmah ispod (fiksnog) headera da filteri iznad
                // odu van ekrana i ostane mesta da se dole vide rezultati.
                if (typeof window === "undefined" || window.innerWidth >= 768) return;
                searchRowRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              placeholder={
                type === "delovi"
                  ? "Pretraga po nazivu, brendu ili kataloškom broju…"
                  : "Pretraga po nazivu mašine…"
              }
              className="h-12 w-full rounded-xl border border-input bg-white pl-11 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {activeCount > 0 ? (
            <button
              type="button"
              onClick={() =>
                setParams({
                  q: null,
                  ...Object.fromEntries(FACETS[type].map((f) => [f.key, null])),
                })
              }
              className="inline-flex h-12 shrink-0 items-center gap-1.5 rounded-xl px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-charcoal"
            >
              <X className="h-4 w-4" />
              Poništi filtere ({activeCount})
            </button>
          ) : null}
        </div>
      </div>

      {/* Rezultati */}
      {!isReady ? (
        <p className="flex items-center justify-center gap-2 py-20 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {loadingParts ? "Učitavanje kataloga delova…" : "Učitavanje…"}
        </p>
      ) : (
        <>
          <p className="my-6 text-sm text-muted-foreground">
            Prikazano{" "}
            <span className="font-semibold text-charcoal">
              {Math.min(visible, results.length)}
            </span>{" "}
            od <span className="font-semibold text-charcoal">{results.length}</span>{" "}
            {TYPE_COUNT_LABEL[type]}
          </p>

          <Results type={type} items={results.slice(0, visible)} selection={selection} />

          {visible < results.length ? (
            <div className="mt-8 flex justify-center">
              <Button variant="outline" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
                Prikaži još {Math.min(PAGE_SIZE, results.length - visible)}
              </Button>
            </div>
          ) : null}

          {results.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border py-16 text-center">
              <p className="text-muted-foreground">
                Nema proizvoda za izabrane filtere.
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Pozovite nas — katalog je širi od onoga što je ovde prikazano.
              </p>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                            Korak 1 — izbor vrste                           */
/* -------------------------------------------------------------------------- */

/** Prikolice su i dalje ovde na izboru, ali vode na svoju stranicu sa pločicama. */
const PICKER: { key: CatalogType; href?: string }[] = [
  { key: "masine" },
  { key: "prikolice", href: "/prikolice" },
  { key: "delovi" },
];

function TypePicker({ onChoose }: { onChoose: (type: CatalogType) => void }) {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-charcoal md:text-3xl">
        Šta tražite?
      </h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Izaberite da li vam treba kompletna mašina, auto-prikolica ili rezervni
        deo — dalje vas vodi samo ono što je za taj izbor bitno.
      </p>

      <div className="mt-8 grid grid-cols-3 gap-2.5 sm:gap-5">
        {PICKER.map(({ key, href }) => {
          const meta = TYPE_META[key];
          const Icon = TYPE_ICONS[key];
          // Sve tri kartice nose isti vizual — obojen gradijent sa ikonicom
          // vrste; fotografija bi jednu izdvojila iz reda.
          const sadrzaj = (
            <>
              {/* Telefon — kompaktna pločica: sve tri staju u jedan red, pa
                  ostaje samo ono što nosi izbor (ikonica i naziv). Opis bi se u
                  trećini širine prelomio u pet redova i pojeo ekran. */}
              <span className="flex flex-1 flex-col sm:hidden">
                <span className="relative block aspect-[4/3] overflow-hidden">
                  <MediaPlaceholder
                    tone={TYPE_TONES[key]}
                    icon={Icon}
                    iconClassName="h-7 w-7"
                    sizes="33vw"
                    className="h-full w-full"
                  />
                </span>
                <span className="flex flex-1 items-center justify-center px-1.5 py-2 text-center font-display text-[0.72rem] font-bold leading-tight text-charcoal">
                  {meta.label}
                </span>
              </span>

              {/* Tablet i desktop — pun vizual sa opisom. */}
              <span className="hidden sm:block">
                <span className="relative block aspect-[16/9] overflow-hidden">
                  <MediaPlaceholder
                    tone={TYPE_TONES[key]}
                    icon={Icon}
                    sizes="(max-width: 1024px) 50vw, 33vw"
                    className="h-full w-full transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/20 to-transparent" />
                  <span className="absolute bottom-4 left-5 flex items-center gap-2.5 text-cream">
                    <Icon className="h-6 w-6" strokeWidth={1.6} aria-hidden />
                    <span className="font-display text-xl font-bold">{meta.label}</span>
                  </span>
                </span>
                <span className="block p-5 text-sm text-muted-foreground">
                  {meta.description}
                </span>
              </span>
            </>
          );
          const stil =
            "group relative flex flex-col overflow-hidden rounded-xl border border-border bg-white text-left shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-lift sm:rounded-2xl";

          return href ? (
            <Link key={key} href={href} aria-label={`Otvori ${meta.label}`} className={stil}>
              {sadrzaj}
            </Link>
          ) : (
            <button
              key={key}
              type="button"
              onClick={() => onChoose(key)}
              aria-label={`Prikaži katalog — ${meta.label}`}
              className={stil}
            >
              {sadrzaj}
            </button>
          );
        })}
      </div>

      <PopularParts />
    </div>
  );
}

/**
 * Vitrina najtraženijih delova za plugove — vidi se odmah, pre bilo kakvog
 * filtriranja. Podaci dolaze iz `popular.json` (mala lista), pa se prikazuju i
 * dok se veliki katalog delova još nije učitao.
 */
function PopularParts() {
  const featured = popularParts.slice(0, 12);
  if (featured.length === 0) return null;

  return (
    <div className="mt-14">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <span className="eyebrow">
            <span className="h-px w-6 bg-current" />
            Delovi za plugove
          </span>
          <h3 className="mt-3 font-display text-2xl font-bold text-charcoal">
            Najtraženiji delovi
          </h3>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Komadi koji najčešće izlaze sa lagera — Kverneland, Lemken, Kuhn, Överum,
            Vogel &amp; Noot, Regent, Rabe i Pöttinger.
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="shrink-0">
          <Link href="/proizvodi?vrsta=delovi&grupa=delovi-plugovi">
            Svi delovi za plugove
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
        {featured.map((part) => (
          <PartCard key={part.id} item={part} tags={part.tags} />
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Korak 3 — rezultati                           */
/* -------------------------------------------------------------------------- */

function Results({
  type,
  items,
  selection,
}: {
  type: CatalogType;
  items: CatalogItem[];
  selection: Record<string, string[]>;
}) {
  // Oznake na kartici izostavljaju fasete po kojima je već filtrirano — te
  // vrednosti su iste na svim rezultatima i samo bi zauzimale mesto.
  const shownFacets = FACETS[type].filter((f) => (selection[f.key] ?? []).length !== 1);

  const labelsFor = (item: CatalogItem) =>
    shownFacets
      .map((f) => {
        const value = item.facets[f.key];
        return value ? facetLabel(type, f.key, value) : null;
      })
      .filter((v): v is string => Boolean(v));

  // Mašine i delovi dele istu mrežu kartica — da katalog izgleda jedinstveno.
  return (
    <motion.div
      layout
      className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4"
    >
      {items.map((item) => (
        <motion.div
          key={item.id}
          layout
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          {type === "masine" ? (
            <MachineCard item={item} typeLabel={labelsFor(item)[0] ?? "Mašina"} />
          ) : (
            <PartCard item={item} tags={labelsFor(item)} />
          )}
        </motion.div>
      ))}
    </motion.div>
  );
}
