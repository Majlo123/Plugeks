import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { categories } from "@/lib/data";
import { catalogHref } from "@/lib/catalog";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/Reveal";
import { MediaPlaceholder } from "@/components/ui/media-placeholder";

export function Kategorije() {
  return (
    // Sekcija ispod (Akcije) je takođe krem — tanka linija ih razdvaja.
    <section className="section border-b border-border bg-cream">
      <div className="container">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading
            eyebrow="Asortiman"
            title="Sve za obradu zemljišta i održavanje"
            description="Od malčera i freza do utovarivača i kompakt traktora — izaberite kategoriju i pošaljite upit za tačnu ponudu."
          />
          <Link
            href="/proizvodi"
            className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-brand hover:gap-2 transition-all md:inline-flex"
          >
            Sve kategorije <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c, i) => {
            const Icon = c.icon;
            return (
              <Reveal key={c.key} delay={(i % 3) * 0.07}>
                <Link
                  href={catalogHref(c.key)}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-brand/30 hover:shadow-lift"
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <MediaPlaceholder
                      tone={c.tone}
                      icon={Icon}
                      src={c.image}
                      alt={c.label}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="h-full w-full transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-charcoal/45 to-transparent" />
                    <div className="absolute left-4 top-4 grid h-11 w-11 place-items-center rounded-xl bg-cream/90 text-brand shadow-soft backdrop-blur">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-display text-[1.3rem] font-bold tracking-[-0.012em] text-charcoal">{c.label}</h3>
                      <ArrowUpRight className="h-5 w-5 shrink-0 text-foreground/70 transition-all duration-300 group-hover:text-brand group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </div>
                    <p className="mt-2 text-[0.96rem] leading-relaxed text-muted-foreground">
                      {c.description}
                    </p>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
