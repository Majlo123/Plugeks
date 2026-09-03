import Link from "next/link";
import { Phone, PhoneCall, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/Reveal";
import { site } from "@/lib/site";
import { MediaPlaceholder } from "@/components/ui/media-placeholder";
import { Tractor } from "lucide-react";

/**
 * Završna CTA traka — snažan poziv na akciju pre footera.
 */
export function KontaktCTA() {
  return (
    <section className="section bg-white">
      <div className="container">
        <Reveal>
          <div className="relative isolate overflow-hidden rounded-3xl px-6 py-16 text-center md:px-12 md:py-20">
            {/* pozadina */}
            <div className="absolute inset-0 -z-10">
              <MediaPlaceholder
                tone="field"
                icon={Tractor}
                src="/images/cta.jpg"
                sizes="100vw"
                className="h-full w-full"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-brand/90 via-brand-600/85 to-charcoal/92" />
            </div>

            <span className="inline-flex items-center gap-2 rounded-full border border-cream/20 bg-cream/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-cream backdrop-blur-sm">
              Spremni za sezonu?
            </span>
            <h2 className="mx-auto mt-6 max-w-2xl font-display text-3xl font-bold leading-tight text-cream text-balance sm:text-4xl md:text-5xl">
              Recite nam šta vam treba — mi šaljemo ponudu isti dan
            </h2>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild variant="accent" size="lg">
                <Link href="/zatrazi-ponudu">
                  Zatraži ponudu <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="light" size="lg">
                <a href={site.telHref}>
                  <Phone className="h-5 w-5" /> {site.phoneDisplay}
                </a>
              </Button>
              <Button asChild size="lg" className="bg-[#7360F2] text-white shadow-soft hover:bg-[#5F4FD8] hover:shadow-lift">
                <a href={site.viberHref} target="_blank" rel="noopener noreferrer">
                  <PhoneCall className="h-5 w-5" /> Viber
                </a>
              </Button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
