import type { Metadata } from "next";
import { Phone, Mail, MapPin, Clock, MessageCircle } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { QuoteForm } from "@/components/QuoteForm";
import { Reveal } from "@/components/Reveal";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Kontakt — Zatraži ponudu",
  description:
    "Kontaktirajte PlugekS — telefon, WhatsApp, Viber i email. Pošaljite upit za ponudu poljoprivredne mehanizacije. Žabalj 21230, Vojvodina.",
};

// OpenStreetMap embed (bez API ključa) — centriran na Žabalj.
// ZAMENI: tačan bbox/marker kad potvrdiš koordinate firme u src/lib/site.ts
const mapSrc =
  "https://www.openstreetmap.org/export/embed.html?bbox=20.0386%2C45.3522%2C20.0986%2C45.3922&layer=mapnik&marker=45.3722%2C20.0686";

export default function KontaktPage({
  searchParams,
}: {
  searchParams: { proizvod?: string };
}) {
  const defaultProduct = searchParams?.proizvod ?? "";

  const channels = [
    {
      icon: Phone,
      label: "Telefon",
      value: site.phoneDisplay,
      href: site.telHref,
      note: "Najbrži odgovor — pozovite nas",
    },
    {
      icon: MessageCircle,
      label: "WhatsApp / Viber",
      value: site.phoneDisplay,
      href: site.whatsappHref,
      external: true,
      note: "Pišite nam u svako doba",
    },
    {
      icon: Mail,
      label: "Email",
      value: site.email,
      href: site.mailHref,
      note: "Za ponude i upite",
    },
  ];

  return (
    <>
      <PageHeader
        breadcrumb="Kontakt"
        title="Javite se — odgovaramo isti dan"
        description="Pozovite, pišite na WhatsApp/Viber ili pošaljite upit. Recite nam šta vam treba i poslaćemo ponudu sa cenom i načinom plaćanja."
        tone="steel"
        image="/images/galerija-1.jpg"
      />

      <section className="section bg-cream">
        <div className="container grid gap-10 lg:grid-cols-5">
          {/* Leva strana — kanali + detalji */}
          <div className="lg:col-span-2">
            <Reveal>
              <div className="space-y-4">
                {channels.map((c) => {
                  const Icon = c.icon;
                  return (
                    <a
                      key={c.label}
                      href={c.href}
                      {...(c.external
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                      className="group flex items-center gap-4 rounded-2xl border border-border bg-white p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lift"
                    >
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand transition-colors group-hover:bg-brand group-hover:text-cream">
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {c.label}
                        </p>
                        <p className="truncate font-semibold text-charcoal">{c.value}</p>
                        <p className="truncate text-xs text-muted-foreground">{c.note}</p>
                      </div>
                    </a>
                  );
                })}
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="mt-4 rounded-2xl border border-border bg-white p-6 shadow-card">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
                  <div>
                    <p className="font-semibold text-charcoal">Adresa</p>
                    <p className="text-sm text-muted-foreground">{site.address.full}</p>
                  </div>
                </div>
                <div className="mt-5 flex items-start gap-3 border-t border-border pt-5">
                  <Clock className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
                  <div>
                    <p className="font-semibold text-charcoal">Radno vreme</p>
                    <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
                      {site.hours.map((h) => (
                        <li key={h.day} className="flex justify-between gap-4">
                          <span>{h.day}</span>
                          <span className="font-medium text-foreground/80">{h.time}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>

          {/* Desna strana — forma */}
          <div className="lg:col-span-3">
            <Reveal delay={0.05}>
              <div className="rounded-3xl border border-border bg-white p-7 shadow-card md:p-9">
                <h2 className="text-2xl font-bold text-charcoal">Zatraži ponudu</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Popunite formu — javljamo se telefonom ili porukom u najkraćem roku.
                </p>
                <div className="mt-7">
                  <QuoteForm defaultProduct={defaultProduct} />
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Mapa */}
      <section className="bg-white pb-20">
        <div className="container">
          <div className="overflow-hidden rounded-3xl border border-border shadow-card">
            <iframe
              title="Lokacija PlugekS — Žabalj"
              src={mapSrc}
              loading="lazy"
              className="h-[360px] w-full md:h-[440px]"
              style={{ border: 0 }}
            />
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            {/* ZAMENI: tačan pin/koordinate u src/lib/site.ts (address.lat / address.lng). */}
            Mapa je informativna — za tačnu lokaciju i dolazak pozovite nas.
          </p>
        </div>
      </section>
    </>
  );
}
