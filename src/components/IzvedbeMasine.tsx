"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { ProductThumb } from "@/components/ProductThumb";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Izvedba, PodatakIzvedbe } from "@/lib/products";

/**
 * Izbor izvedbe mašine na stranici proizvoda — kao na izvoru (hofman.at), gde
 * kupac klikne model i vidi baš njegove fotografije.
 *
 * Jedan izbor pokreće tri stvari na stranici koje stoje u različitim kolonama:
 * galeriju (levo), karticu sa podacima te izvedbe i link „Zatraži ponudu"
 * (desno). Zato je stanje u kontekstu, a stranica — koja ostaje serverska —
 * samo slaže delove: `IzvedbeProvider` oko mreže, pa `GalerijaMasine`,
 * `BiracIzvedbe`, `OpisIzvedbe` i `PonudaZaIzvedbu` gde im je mesto.
 *
 * Stanja „bez izbora" nema: prva izvedba je izabrana od prvog kadra, pa i
 * posetilac i Google zatiču stranicu na konkretnom modelu.
 */

type Stanje = {
  izvedbe: Izvedba[];
  /** Indeks izabrane izvedbe; `null` samo kad mašina nema nijednu. */
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
  // PRVA IZVEDBA JE IZABRANA ODMAH. Ranije se kretalo iz stanja „Pregled", u
  // kojem stranica nije pokazivala nijedan konkretan model — ni njegove
  // fotografije ni njegove brojke, nego mašinu uopšte i celu matricu. Kupac
  // ne kupuje „malčer G LINE" nego G 125, pa stranica odmah stoji na jednom
  // modelu; ostali su jedan klik dalje.
  const [izabrana, izaberi] = useState<number | null>(izvedbe.length ? 0 : null);
  const vrednost = useMemo(() => ({ izvedbe, izabrana, izaberi }), [izvedbe, izabrana]);
  return <Kontekst.Provider value={vrednost}>{children}</Kontekst.Provider>;
}

/* --------------------------------- Birač ---------------------------------- */

/**
 * Pločice sa izvedbama. „Pregled" je sklonjen: bio je jedina pločica iza koje
 * ne stoji nijedan model iz cenovnika, a pošto je bio i prvi u redu, stranica
 * je po dolasku stajala na njemu.
 */
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

/* --------------------------- Specifikacija -------------------------------- */

/**
 * Kartica izabrane izvedbe — ono po čemu se BAŠ ona razlikuje od ostalih.
 *
 * ZAŠTO KARTICA, A NE TABELA: fabrička matrica malčera F LINE je 12×4 — pola
 * strane na ekranu, a na telefonu četiri bloka jedan ispod drugog, od kojih su
 * tri tuđi modeli kroz koje se skroluje. Od tih dvanaest redova samo tri-četiri
 * uopšte zavise od toga koja je izvedba izabrana; visina, dužina i prečnik
 * rotora su kod svih isti i opisuju mašinu, ne izbor. Kartica nosi tačno te
 * redove (vidi `podaciIzvedbe`) — kupac u dva reda teksta vidi šta dobija za
 * koji model, i šta se menja kad pređe na sledeći.
 *
 * Podaci se ne pišu ručno nego se vade iz iste fabričke tabele, pa kartica ne
 * može da ode iz koraka sa uvozom.
 */
export function OpisIzvedbe({ podaci }: { podaci: PodatakIzvedbe[][] }) {
  const { izvedbe, izabrana } = useIzvedbe();
  if (izabrana === null) return null;

  const stavke = podaci[izabrana] ?? [];
  if (stavke.length === 0) return null;

  return (
    <div className="rounded-2xl border border-brand/25 bg-brand-50/60 p-4 sm:p-5">
      <p className="font-display text-base font-bold text-charcoal">
        {izvedbe[izabrana].naziv}
      </p>
      <dl className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
        {stavke.map((s) => (
          <div
            key={s.naziv}
            className="flex items-baseline justify-between gap-3 border-b border-brand/15 pb-1.5 last:border-b-0 sm:last:border-b"
          >
            <dt className="min-w-0 text-sm text-muted-foreground">{s.naziv}</dt>
            <dd className="shrink-0 whitespace-nowrap text-sm font-semibold tabular-nums text-charcoal">
              {s.vrednost}
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-xs text-muted-foreground">
        Ostali podaci su isti za sve izvedbe — pitajte nas za punu specifikaciju.
      </p>
    </div>
  );
}

/* -------------------------------- Galerija -------------------------------- */

/**
 * Izvedba čije se fotografije prikazuju kad izabrana svoje nema — najbliža u
 * spisku (izvedbe su poređane po veličini, pa je susedna i najsličnija).
 * `null` znači da ih nema nijedna, pa se pada na fotografije cele mašine.
 */
function saFotografijama(izvedbe: Izvedba[], izabrana: number): number | null {
  if (izvedbe[izabrana]?.slike.length) return izabrana;
  let najbliza: number | null = null;
  izvedbe.forEach((iz, n) => {
    if (!iz.slike.length) return;
    if (najbliza === null || Math.abs(n - izabrana) < Math.abs(najbliza - izabrana))
      najbliza = n;
  });
  return najbliza;
}

/**
 * Fotografije mašine: naslovna + galerija cele mašine u pregledu, a posle
 * izbora fotografije te izvedbe.
 *
 * IZVEDBA BEZ SOPSTVENIH FOTOGRAFIJA (izvor ih ima samo za neke modele) uzima
 * fotografije najbliže izvedbe koja ih ima, a POTPIS kaže koja je to. Ranije je
 * u tom slučaju stajala naslovna fotografija sa potpisom „izvedba G LINE G 105"
 * — potpis je tvrdio da je na slici model koji na njoj nije. Bolje je pokazati
 * susednu izvedbu i reći koju, nego pogrešno potpisati sliku.
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
  const traka = useRef<HTMLUListElement>(null);

  const osnovne = useMemo(
    () => [...(slika ? [slika] : []), ...galerija.filter((g) => g !== slika)],
    [slika, galerija],
  );
  const izvedba = izabrana === null ? null : izvedbe[izabrana];
  // Koja izvedba je STVARNO na fotografijama — ne mora biti izabrana.
  const naSlici = izabrana === null ? null : saFotografijama(izvedbe, izabrana);
  const slike = naSlici === null ? osnovne : izvedbe[naSlici].slike;

  // Promena izvedbe vraća na prvu sliku; indeks iz prethodnog skupa ne znači ništa.
  const [prethodna, postaviPrethodnu] = useState(izabrana);
  if (prethodna !== izabrana) {
    postaviPrethodnu(izabrana);
    postaviAktivnu(0);
  }

  // Indeks se drži u granicama i kad se skup slika promeni ispod njega —
  // izvedba sa pet fotografija pa izvedba sa dve.
  const poslednja = Math.max(slike.length - 1, 0);
  const trenutna = Math.min(aktivna, poslednja);
  const glavna = slike[trenutna];
  const naslovIzvedbe = izvedba ? `${name} — ${izvedba.naziv}` : name;

  const pomeri = (smer: -1 | 1) =>
    postaviAktivnu(Math.min(Math.max(trenutna + smer, 0), poslednja));

  // Strelicama se stigne i do sličice koja je van vidnog polja trake (osam
  // fotografija, a u red ih stane tri) — traka ide za izborom.
  useEffect(() => {
    traka.current?.children[trenutna]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "nearest",
    });
  }, [trenutna]);

  /**
   * Potpis govori o onome što se VIDI. Tri slučaja: pregled (cela mašina),
   * izvedba sa svojim fotografijama i izvedba koja ih nema — kod nje potpis
   * imenuje izvedbu sa slike, da se fotografija ne pripiše pogrešnom modelu.
   */
  const potpis =
    izabrana === null
      ? `${name} — ${natpis}`
      : naSlici === izabrana
        ? `${naslovIzvedbe} — ${natpisi[izabrana]}`
        : naSlici === null
          ? `${naslovIzvedbe} — na fotografiji je mašina bez oznake izvedbe, ${natpis}`
          : `${naslovIzvedbe} — na fotografiji je izvedba ${izvedbe[naSlici].naziv}, ${natpis}`;

  return (
    <figure>
      <div className="relative overflow-hidden rounded-3xl border border-border bg-bone shadow-card">
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

        {/* Strelice preko same fotografije. Sličice ispod i dalje postoje —
            one kažu KOLIKO ih ima i koja je koja, a strelice su za listanje bez
            ciljanja: na telefonu je sličica široka 6,4rem, strelica je pola
            visine slike. Na krajevima se gase umesto da se vrte u krug: kad
            dugme radi i na poslednjoj slici, ne vidi se da je kraj. */}
        {slike.length > 1 ? (
          <>
            <Strelica smer={-1} onClick={() => pomeri(-1)} ugasena={trenutna === 0} />
            <Strelica
              smer={1}
              onClick={() => pomeri(1)}
              ugasena={trenutna === poslednja}
            />
          </>
        ) : null}
      </div>

      {slike.length > 1 ? (
        <ul
          ref={traka}
          className="mt-3 flex gap-2 overflow-x-auto pb-1"
          aria-label="Fotografije"
        >
          {slike.map((s, n) => (
            <li key={s} className="shrink-0">
              <button
                type="button"
                onClick={() => postaviAktivnu(n)}
                aria-pressed={n === trenutna}
                aria-label={`Fotografija ${n + 1} od ${slike.length}`}
                className={cn(
                  "block overflow-hidden rounded-xl border-2 bg-bone transition-colors",
                  n === trenutna ? "border-brand" : "border-transparent hover:border-brand/50",
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

      <figcaption className="mt-3 text-sm text-muted-foreground">{potpis}</figcaption>
    </figure>
  );
}

/** Jedno dugme za listanje fotografija; na kraju niza je ugašeno, ne skriveno. */
function Strelica({
  smer,
  onClick,
  ugasena,
}: {
  smer: -1 | 1;
  onClick: () => void;
  ugasena: boolean;
}) {
  const Ikona = smer < 0 ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={ugasena}
      aria-label={smer < 0 ? "Prethodna fotografija" : "Sledeća fotografija"}
      className={cn(
        "absolute top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-border bg-white/90 text-charcoal shadow-soft backdrop-blur transition-colors",
        smer < 0 ? "left-3" : "right-3",
        ugasena
          ? "cursor-not-allowed opacity-35"
          : "hover:border-brand/40 hover:bg-white hover:text-brand",
      )}
    >
      <Ikona className="h-5 w-5" strokeWidth={2.2} />
    </button>
  );
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
