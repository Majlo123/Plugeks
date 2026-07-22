import { Quote, Star, MapPin } from "lucide-react";
import { testimonials } from "@/lib/data";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/Reveal";

/**
 * Reference / utisci kupaca — pretvara "fotografije isporuke" u testimonijale
 * (direktna preporuka iz audita: ovog sadržaja nedostaje).
 */
export function Reference() {
  return (
    <section className="section bg-cream">
      <div className="container">
        <SectionHeading
          align="center"
          eyebrow="Utisci kupaca"
          title="Zadovoljni domaćini iz cele regije"
          description="Hiljade isporučenih mašina i mnogo zadovoljnih poljoprivrednika u Srbiji i regionu. Evo šta kažu."
        />

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-2">
          {testimonials.map((t, i) => (
            <Reveal key={t.name} delay={(i % 2) * 0.1}>
              <figure className="flex h-full flex-col rounded-2xl border border-border bg-white p-7 shadow-card">
                <div className="flex items-center justify-between">
                  <Quote className="h-8 w-8 text-brand/20" />
                  <div className="flex gap-0.5 text-accent">
                    {Array.from({ length: 5 }).map((_, k) => (
                      <Star key={k} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                </div>
                <blockquote className="mt-4 flex-1 text-foreground/85">
                  „{t.quote}“
                </blockquote>
                <figcaption className="mt-6 flex items-center justify-between border-t border-border pt-5">
                  <div>
                    <p className="font-semibold text-charcoal">{t.name}</p>
                    <p className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" /> {t.location}
                    </p>
                  </div>
                  <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand">
                    {t.machine}
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            {/* ZAMENI: pravi utisci kupaca — npr. sa fotografija isporuka koje već imate. */}
            Postanite naša sledeća referenca — javite nam se za ponudu.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
