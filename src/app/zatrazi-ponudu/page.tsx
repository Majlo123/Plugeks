import type { Metadata } from "next";
import { Phone, PhoneCall } from "lucide-react";
import { QuoteForm } from "@/components/QuoteForm";
import { Reveal } from "@/components/Reveal";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Zatraži ponudu",
  description:
    "Pošaljite upit za ponudu poljoprivredne mehanizacije — recite nam šta vam treba i javljamo se isti dan sa cenom i načinom plaćanja.",
};

export default function ZatraziPonuduPage({
  searchParams,
}: {
  searchParams: { proizvod?: string };
}) {
  const defaultProduct = searchParams?.proizvod ?? "";

  return (
    <>
      <section className="section bg-cream pt-28 md:pt-32">
        <div className="container">
          <div className="mx-auto max-w-2xl">
            <Reveal>
              <div className="rounded-3xl border border-border bg-white p-7 shadow-card md:p-9">
                <h1 className="text-2xl font-bold text-charcoal">Zatraži ponudu</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Popunite formu — javljamo se telefonom ili porukom u najkraćem roku.
                </p>
                <div className="mt-7">
                  <QuoteForm defaultProduct={defaultProduct} />
                </div>

                <div className="mt-7 flex flex-col items-center gap-3 border-t border-border pt-7 sm:flex-row sm:justify-center">
                  <p className="text-sm text-muted-foreground">Ili nas kontaktirajte direktno:</p>
                  <div className="flex gap-2.5">
                    <a
                      href={site.telHref}
                      className="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-cream shadow-soft transition-colors hover:bg-brand-600"
                    >
                      <Phone className="h-4 w-4" /> {site.phoneDisplay}
                    </a>
                    <a
                      href={site.viberHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-full bg-[#7360F2] px-4 py-2 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-[#5F4FD8]"
                    >
                      <PhoneCall className="h-4 w-4" /> Viber
                    </a>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
