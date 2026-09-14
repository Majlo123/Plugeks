"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductThumb } from "@/components/ProductThumb";
import { TabelaModela } from "@/components/TabelaModela";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Izvedba, TabelaModela as Tabela } from "@/lib/products";

/**
 * Izbor izvedbe mašine na stranici proizvoda — kao na izvoru (hofman.at), gde
 * kupac klikne model i vidi baš njegove fotografije.
 *
 * Jedan izbor pokreće tri stvari na stranici koje stoje u različitim kolonama:
 * galeriju (levo), istaknutu kolonu tabele i link „Zatraži ponudu" (desno).
 * Zato je stanje u kontekstu, a stranica — koja ostaje serverska — samo slaže
 * delove: `IzvedbeProvider` oko mreže, pa `GalerijaMasine`, `BiracIzvedbe`,
 * `TabelaIzvedbi` i `PonudaZaIzvedbu` gde im je mesto.
 *
 * Bez izbora (početno stanje, i ono što Google vidi) stranica je ista kao
 * ranije: naslovna fotografija, cela tabela, ponuda za mašinu.
 */

type Stanje = {
  izvedbe: Izvedba[];
  /** Indeks izabrane izvedbe; `null` = pregled cele mašine. */
  izabrana: number | null;
  izaberi: (i: number | null) => void;
};

const Kontekst = createContext<Stanje | null>(null);

function useIzvedbe(): Stanje {
  const s = useContext(Kontekst);
  if (!s) throw new Error("IzvedbeProvider nedostaje iznad komponente izvedbe.");
  return s;
}

export function IzvedbeProvider({
  izvedbe,
  children,
}: {
  izvedbe: Izvedba[];
  children: ReactNode;
}) {
  const [izabrana, izaberi] = useState<number | null>(null);
  const vrednost = useMemo(() => ({ izvedbe, izabrana, izaberi }), [izvedbe, izabrana]);
  return <Kontekst.Provider value={vrednost}>{children}</Kontekst.Provider>;
}

/* --------------------------------- Birač ---------------------------------- */

/** Pločice sa izvedbama; „Pregled" vraća na celu mašinu. */
export function BiracIzvedbe() {
  const { izvedbe, izabrana, izaberi } = useIzvedbe();
  if (izvedbe.length === 0) return null;

  const plocica = (aktivna: boolean) =>
    cn(
      "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
      aktivna
        ? "border-brand bg-brand text-cream"
        : "border-border bg-white text-charcoal hover:border-brand/60 hover:text-brand",
    );

  return (
    <div className="mt-5">
      <p className="eyebrow">
        <span className="h-px w-6 bg-current" />
        Izvedba
      </p>
      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Izbor izvedbe">
        <button
          type="button"
          onClick={() => izaberi(null)}
          aria-pressed={izabrana === null}
          className={plocica(izabrana === null)}
        >
          Pregled
        </button>
        {izvedbe.map((i, n) => (
          <button
            key={i.naziv}
            type="button"
            onClick={() => izaberi(n)}
            aria-pressed={izabrana === n}
            className={plocica(izabrana === n)}
          >
            {i.naziv}
          </button>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------- Galerija -------------------------------- */

/**
 * Fotografije mašine: naslovna + galerija cele mašine u pregledu, a posle
 * izbora fotografije te izvedbe. Izvedba bez sopstvenih fotografija (izvor ih
 * nema za svaki model) pokazuje iste slike kao pregled — ne prazninu.
 */
export function GalerijaMasine({
  slika,
  galerija,
  name,
  code,
  metaLabel,
  natpis,
  natpisi,
}: {
  slika?: string;
  galerija: string[];
  name: string;
  code: string;
  metaLabel?: string;
  /** Potpis ispod slike u pregledu. */
  natpis: string;
  /** Potpisi po izvedbi, istim redom kao `izvedbe`. */
  natpisi: string[];
}) {
  const { izvedbe, izabrana } = useIzvedbe();
  const [aktivna, postaviAktivnu] = useState(0);

  const osnovne = useMemo(
    () => [...(slika ? [slika] : []), ...galerija.filter((g) => g !== slika)],
    [slika, galerija],
  );
  const izvedba = izabrana === null ? null : izvedbe[izabrana];
  const slike = izvedba?.slike.length ? izvedba.slike : osnovne;

  // Promena izvedbe vraća na prvu sliku; indeks iz prethodnog skupa ne znači ništa.
  const [prethodna, postaviPrethodnu] = useState(izabrana);
  if (prethodna !== izabrana) {
    postaviPrethodnu(izabrana);
    postaviAktivnu(0);
  }

  const glavna = slike[Math.min(aktivna, Math.max(slike.length - 1, 0))];
  const naslovIzvedbe = izvedba ? `${name} — ${izvedba.naziv}` : name;

  return (
    <figure>
      <div className="overflow-hidden rounded-3xl border border-border bg-bone shadow-card">
        <ProductThumb
          key={glavna ?? "bez-slike"}
          src={glavna}
          name={naslovIzvedbe}
          kind="masina"
          code={code}
          podloga="bg-bone"
          metaLabel={metaLabel}
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority
          className="aspect-[16/10] w-full"
        />
      </div>

      {slike.length > 1 ? (
        <ul className="mt-3 flex gap-2 overflow-x-auto pb-1" aria-label="Fotografije">
          {slike.map((s, n) => (
            <li key={s} className="shrink-0">
              <button
                type="button"
                onClick={() => postaviAktivnu(n)}
                aria-pressed={n === aktivna}
                aria-label={`Fotografija ${n + 1} od ${slike.length}`}
                className={cn(
                  "block overflow-hidden rounded-xl border-2 bg-bone transition-colors",
                  n === aktivna ? "border-brand" : "border-transparent hover:border-brand/50",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s}
                  alt=""
                  loading="lazy"
                  className="h-16 w-[6.4rem] object-cover mix-blend-multiply"
                />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <figcaption className="mt-3 text-sm text-muted-foreground">
        {naslovIzvedbe} — {izabrana === null ? natpis : natpisi[izabrana]}
      </figcaption>
    </figure>
  );
}

/* --------------------------------- Tabela --------------------------------- */

/** Tabela modela sa istaknutom kolonom izabrane izvedbe. */
export function TabelaIzvedbi({ tabela }: { tabela: Tabela }) {
  const { izvedbe, izabrana } = useIzvedbe();
  // Kolona se traži po nazivu, ne po indeksu: kad izvedbe dolaze iz galerija
  // (CASTA C300/8 ECO uz jedinu kolonu „CASTA"), redosled im nije isti.
  const istaknuta =
    izabrana === null ? undefined : tabela.kolone.indexOf(izvedbe[izabrana].naziv);
  return <TabelaModela tabela={tabela} istaknuta={istaknuta} />;
}

/* --------------------------------- Ponuda --------------------------------- */

/** „Zatraži ponudu" koje nosi i izabranu izvedbu u upit. */
export function PonudaZaIzvedbu({ name }: { name: string }) {
  const { izvedbe, izabrana } = useIzvedbe();
  const proizvod = izabrana === null ? name : `${name} — ${izvedbe[izabrana].naziv}`;
  return (
    <Button asChild variant="primary" size="lg" className="sm:flex-1">
      <Link href={`/zatrazi-ponudu?proizvod=${encodeURIComponent(proizvod)}`}>
        Zatraži ponudu
        <ArrowRight className="h-4 w-4" />
      </Link>
    </Button>
  );
}
