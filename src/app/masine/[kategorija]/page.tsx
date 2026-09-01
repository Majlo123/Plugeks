import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { ListaProizvoda } from "@/components/ListaProizvoda";
import { KontaktCTA } from "@/components/sections/KontaktCTA";
import { machineCategories, getMachinesByCategory } from "@/lib/products";
import { categories } from "@/lib/data";
import { PutanjaJsonLd } from "@/components/PutanjaJsonLd";

/**
 * Stranica po podgrupi mašina (tanjirače, agregati, podrivači, valjci).
 * Opis se preuzima iz `categories` da bi tekst bio isti kao na početnoj.
 */

const nadji = (kljuc: string) => machineCategories().find((c) => c.key === kljuc);
const opis = (kljuc: string) => categories.find((c) => c.key === kljuc)?.description;

export function generateStaticParams() {
  return machineCategories().map((c) => ({ kategorija: c.key }));
}

export function generateMetadata({ params }: { params: { kategorija: string } }): Metadata {
  const kat = nadji(params.kategorija);
  if (!kat) return {};

  return {
    title: `${kat.label} — mašine iz PlugekS ponude`,
    description:
      opis(kat.key) ??
      `${kat.label} za pripremu i obradu zemljišta. Finansiranje, podrška oko subvencija i isporuka širom Srbije.`,
    alternates: { canonical: `/masine/${kat.key}` },
    keywords: [kat.label, "poljoprivredna mehanizacija", "PlugekS"],
  };
}

export default function KategorijaMasinaPage({ params }: { params: { kategorija: string } }) {
  const kat = nadji(params.kategorija);
  if (!kat) notFound();

  return (
    <>
      <PutanjaJsonLd
        stavke={[
          { naziv: "Proizvodi", href: "/proizvodi" },
          { naziv: kat.label, href: `/masine/${kat.key}` },
        ]}
      />
      <PageHeader
        breadcrumb={kat.label}
        title={kat.label}
        description={opis(kat.key)}
        tone="field"
      />

      <section className="section bg-cream">
        <div className="container">
          <ListaProizvoda items={getMachinesByCategory(kat.key)} />

          <nav className="mt-12 border-t border-border pt-6">
            <p className="text-sm font-semibold text-charcoal">Ostale mašine</p>
            <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
              {machineCategories()
                .filter((c) => c.key !== kat.key)
                .map((c) => (
                  <li key={c.key}>
                    <Link href={`/masine/${c.key}`} className="text-brand hover:underline">
                      {c.label} <span className="text-muted-foreground">({c.count})</span>
                    </Link>
                  </li>
                ))}
            </ul>
          </nav>
        </div>
      </section>

      <KontaktCTA />
    </>
  );
}
