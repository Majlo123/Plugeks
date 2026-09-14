import Link from "next/link";
import { productHref, type Product } from "@/lib/products";

/**
 * Spisak proizvoda kao obični linkovi — za kategorijske i kataloške stranice.
 * Cilj je da svaki proizvod ima dohvatljiv `<a href>` u serverski generisanom
 * HTML-u, bez filtera i bez klijentskog koda.
 *
 * `saSlikama` uz naziv dodaje i sličicu (56px).
 *
 * ZAŠTO NIJE UVEK UKLJUČENO: na `/katalog/[strana]` stoji 120 stavki po strani,
 * a ta ruta postoji samo da bi Googlebot imao put do svakog proizvoda — nju
 * čovek praktično ne otvara, pa tamo slika nosi 120 dodatnih zahteva bez koristi.
 *
 * ZAŠTO JE UKLJUČENO NA `/delovi/…`: to su strane pisane za pretragu („delovi
 * za plugove Lemken") i baš njih je Google vraćao na upit po nazivu dela — a u
 * njihovom HTML-u nije bilo nijedne slike, pa mu je kao slika te strane ostajao
 * jedino logo iz headera. Sličica daje pravi par strana↔slika: isti fajl koji
 * strana proizvoda prikazuje kao glavnu sliku i koji se prijavljuje u
 * `image-sitemap.xml`.
 */
export function ListaProizvoda({
  items,
  saSlikama = false,
}: {
  items: Product[];
  saSlikama?: boolean;
}) {
  if (!saSlikama) {
    return (
      <ul className="grid gap-x-8 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((p) => (
          <li key={p.id}>
            <Link
              href={productHref(p)}
              className="block py-1.5 text-sm text-foreground/85 underline-offset-4 transition-colors hover:text-brand hover:underline"
            >
              {p.name}
            </Link>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className="grid gap-x-6 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((p) => (
        <li key={p.id}>
          <Link
            href={productHref(p)}
            className="group flex items-center gap-3 rounded-xl py-1.5 pr-2 text-sm text-foreground/85 transition-colors hover:bg-bone hover:text-brand"
          >
            {p.image ? (
              /* Namerno običan `<img>`, a ne `next/image`: u HTML-u tako stoji
                 tačno ona putanja (`/images/plugovi/2719.jpg`) koja se
                 prijavljuje u image sitemap-u i navodi u `ImageObject` na
                 strani proizvoda. Kroz optimizer bi stajalo
                 `/_next/image?url=…`, pa bi se par strana↔slika raspao.
                 Fotografije delova su ionako ~15 KB, bez koristi od optimizera. */
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={p.image}
                alt={`${p.name}, kat. br. ${p.id} — PlugekS`}
                width={56}
                height={56}
                loading="lazy"
                decoding="async"
                className="h-14 w-14 shrink-0 rounded-lg bg-bone object-contain mix-blend-multiply"
              />
            ) : (
              <span
                aria-hidden
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-muted/50 text-[0.6rem] font-semibold text-muted-foreground"
              >
                {p.id}
              </span>
            )}
            <span className="min-w-0 underline-offset-4 group-hover:underline">
              {p.name}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
