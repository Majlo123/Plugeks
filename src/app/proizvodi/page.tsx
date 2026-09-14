import { Suspense } from "react";
import type { Metadata } from "next";
import { ProizvodiClient } from "./ProizvodiClient";
import { KontaktCTA } from "@/components/sections/KontaktCTA";
import { drustveneSlike } from "@/lib/products";

const OPIS =
  "Uvoz i prodaja poljoprivrednih delova i mašina. Rezervni delovi za plugove, roto drljače, agregate, tanjirače, sejalice i vadilice, poljoprivredne, šumske i građevinske mašine i auto-prikolice od 500 do 3500 kg. Zatražite ponudu.";

export const metadata: Metadata = {
  title: "Proizvodi — Mašine, auto-prikolice i rezervni delovi",
  // Ista prva rečenica kao na početnoj: ova strana se u Google-u često pojavi
  // umesto početne za upit „plugeks", pa i ona mora da kaže čime se firma bavi.
  description: OPIS,
  // Filteri i pretraga žive u query stringu (`?vrsta=delovi&brend=lemken&q=…`),
  // pa jedna te ista strana ima neograničeno mnogo adresa. Bez kanonske oznake
  // Google ih tretira kao zasebne, međusobno duple strane i troši obilazak na
  // njih umesto na `/delovi/…` kategorije, koje su i pisane za pretragu.
  alternates: { canonical: "/proizvodi" },
  /**
   * Baš je OVA strana ono što je Google u pretrazi po nazivu dela prikazivao
   * uz logo („Proizvodi — Mašine i rezervni delovi | plugeks.com"). Katalog se
   * crta u pretraživaču (`ProizvodiClient` je klijentska komponenta), pa u
   * serverskom HTML-u nema nijedne fotografije proizvoda — jedina slika strane
   * bila je `/og.jpg` nasleđen iz layout-a, dakle logo.
   */
  ...drustveneSlike({
    url: "/proizvodi",
    title: "Proizvodi | PlugekS",
    description: OPIS,
    slika: {
      url: "https://plugeks.com/images/kategorije/delovi.jpg",
      width: 900,
      height: 563,
      type: "image/jpeg",
      alt: "Plužna daska, grudi daske i raonik — rezervni delovi iz ponude PlugekS",
    },
  }),
};

export default function ProizvodiPage() {
  return (
    <>
      <section className="section bg-cream pt-28 md:pt-32">
        <div className="container">
          <Suspense fallback={<div className="py-20 text-center text-muted-foreground">Učitavanje…</div>}>
            <ProizvodiClient />
          </Suspense>
        </div>
      </section>

      <KontaktCTA />
    </>
  );
}
