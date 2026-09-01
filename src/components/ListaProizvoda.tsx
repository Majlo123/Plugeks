import Link from "next/link";
import { productHref, type Product } from "@/lib/products";

/**
 * Gola lista proizvoda kao obični linkovi — za kategorijske i kataloške
 * stranice. Namerno bez slika i filtera: cilj je da svaki proizvod ima
 * dohvatljiv `<a href>` u serverski generisanom HTML-u.
 */
export function ListaProizvoda({ items }: { items: Product[] }) {
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
