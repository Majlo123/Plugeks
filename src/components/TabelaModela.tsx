import { cn } from "@/lib/utils";
import type { TabelaModela as Tabela } from "@/lib/products";

/**
 * Tabela tehničkih podataka mašine.
 *
 * Nije spisak naziv→vrednost nego MATRICA: redovi su osobine, kolone su
 * izvedbe iste mašine (TERA HP 210 / 240 / 280). Kupac tako u jednom pogledu
 * poredi šta dobija za koju veličinu, umesto da otvara tri stranice.
 *
 * NA TELEFONU SE MATRICA RASPADA. Šest kolona u 350px je ili nečitljivo sitno
 * ili traži bočno skrolovanje kroz koje se izgubi naziv reda. Zato ispod `sm`
 * svaki model dobija svoj blok sa punim spiskom osobina — duže je, ali se čita
 * bez zumiranja i bez skrolovanja u stranu.
 *
 * Mašine sa jednom izvedbom (njih trećina) nemaju šta da porede, pa dobijaju
 * običnu tabelu — istu na svim širinama.
 */
export function TabelaModela({ tabela }: { tabela: Tabela }) {
  const { kolone, redovi } = tabela;
  if (redovi.length === 0) return null;

  // Jedna izvedba → nema poređenja, ide obična tabela (i na telefonu i na
  // ekranu), da se stranica ne pravi važna oko jedne kolone.
  if (kolone.length <= 1) {
    return <BlokModela naslov={kolone[0]} redovi={redovi} kolona={0} />;
  }

  return (
    <>
      {/* Desktop — matrica. `overflow-x-auto` je osigurač za šest kolona na
          užem laptopu; tabela je jedini element na sajtu koji sme da bude širi
          od svog okvira, pa skroluje u sopstvenoj kutiji. */}
      <div className="hidden overflow-x-auto rounded-2xl border border-border bg-white shadow-card sm:block">
        <table className="w-full min-w-[36rem] text-sm">
          <caption className="sr-only">
            Tehnički podaci po modelima: {kolone.join(", ")}
          </caption>
          <thead>
            <tr className="bg-brand text-cream">
              <th
                scope="col"
                className="px-4 py-3.5 text-left font-display text-[0.78rem] font-bold uppercase tracking-[0.1em]"
              >
                Model
              </th>
              {kolone.map((model) => (
                <th
                  key={model}
                  scope="col"
                  className="px-4 py-3.5 text-center font-display text-[0.78rem] font-bold uppercase tracking-[0.1em] whitespace-nowrap"
                >
                  {model}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {redovi.map(([naziv, ...vrednosti], i) => (
              <tr
                key={`${naziv}-${i}`}
                className={cn("border-t border-border/70", i % 2 === 1 && "bg-cream/50")}
              >
                <th
                  scope="row"
                  className="px-4 py-3 text-left font-medium text-muted-foreground"
                >
                  {naziv}
                </th>
                {kolone.map((model, j) => (
                  <td
                    key={model}
                    className="whitespace-nowrap px-4 py-3 text-center font-medium tabular-nums text-charcoal"
                  >
                    {vrednosti[j] || "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Telefon — po jedan blok za svaki model. */}
      <div className="space-y-4 sm:hidden">
        {kolone.map((model, j) => (
          <BlokModela key={model} naslov={model} redovi={redovi} kolona={j} />
        ))}
      </div>
    </>
  );
}

/** Jedan model kao spisak osobina — za telefon i za mašine sa jednom izvedbom. */
function BlokModela({
  naslov,
  redovi,
  kolona,
}: {
  naslov?: string;
  redovi: string[][];
  kolona: number;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-card">
      {naslov ? (
        <p className="bg-brand px-4 py-3 font-display text-[0.82rem] font-bold uppercase tracking-[0.1em] text-cream">
          {naslov}
        </p>
      ) : null}
      <dl>
        {redovi.map(([naziv, ...vrednosti], i) => (
          <div
            key={`${naziv}-${i}`}
            className={cn(
              "flex justify-between gap-4 px-4 py-3 text-sm",
              i % 2 === 1 && "bg-cream/50",
              i > 0 && "border-t border-border/70",
            )}
          >
            <dt className="text-muted-foreground">{naziv}</dt>
            <dd className="text-right font-medium tabular-nums text-charcoal">
              {vrednosti[kolona] || "—"}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
