import Link from "next/link";
import { ArrowRight, Percent, Landmark, Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/Reveal";
import { site } from "@/lib/site";
import { MediaPlaceholder } from "@/components/ui/media-placeholder";
import { Tractor } from "lucide-react";

/**
 * "Akcije i ponude" — subvencije, finansiranje, popusti do 50% (iz audita).
 */
export function Akcije() {
  return (
    <section className="section bg-cream">
      <div className="container">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Velika kartica: popust */}
          <Reveal className="lg:col-span-2">
            <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-3xl bg-charcoal p-8 text-cream md:p-10">
              <div className="absolute inset-0 -z-10">
                <MediaPlaceholder
                  tone="harvest"
                  icon={Tractor}
                  src="/images/malceri.jpg"
                  sizes="(max-width: 1024px) 100vw, 66vw"
                  className="h-full w-full"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-charcoal/95 via-charcoal/85 to-charcoal/60" />
              </div>
              <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
              <div className="relative">
                <Badge variant="accent">Sezonska akcija</Badge>
                <h3 className="mt-5 max-w-md font-display text-3xl font-bold leading-tight text-balance md:text-4xl">
                  Popusti do <span className="text-accent">50%</span> na odabrane modele
                </h3>
                <p className="mt-4 max-w-md text-cream/70">
                  Sezona je uveliko počela — iskoristite akcijske cene na izabrane
                  malčere, freze i priključke. Količine su ograničene, zato požurite.
                </p>
              </div>
              <div className="relative mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild variant="accent" size="lg">
                  <Link href="/proizvodi">
                    Pogledaj akcijske modele <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild variant="light" size="lg">
                  <a href={site.telHref}>Pozovi za cenu</a>
                </Button>
              </div>
            </div>
          </Reveal>

          {/* Dve manje kartice: subvencije + finansiranje */}
          <div className="grid gap-6">
            <Reveal delay={0.08}>
              <div className="group flex h-full flex-col rounded-3xl border border-border bg-white p-7 shadow-card transition-all hover:shadow-lift">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-brand">
                  <Landmark className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-xl font-bold text-charcoal">Subvencije</h3>
                <p className="mt-2 flex-1 text-sm text-muted-foreground">
                  Pomažemo vam da iskoristite državne podsticaje za nabavku mehanizacije.
                </p>
                <Link
                  href="/subvencije-i-finansiranje"
                  className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand group-hover:gap-2 transition-all"
                >
                  Saznaj više <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </Reveal>

            <Reveal delay={0.16}>
              <div className="group flex h-full flex-col rounded-3xl border border-border bg-white p-7 shadow-card transition-all hover:shadow-lift">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-brand">
                  <Banknote className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-xl font-bold text-charcoal">Plaćanje na rate</h3>
                <p className="mt-2 flex-1 text-sm text-muted-foreground">
                  Finansiranje preko kredita i lizinga — mašina odmah, otplata prilagođena sezoni.
                </p>
                <Link
                  href="/subvencije-i-finansiranje"
                  className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand group-hover:gap-2 transition-all"
                >
                  Saznaj više <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
