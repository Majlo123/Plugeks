import type { Metadata } from "next";
import { Phone, Mail, MapPin, Clock, PhoneCall } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Kontakt",
  description:
    "Kontaktirajte PlugekS — telefon, Viber i email. Žabalj 21230, Vojvodina.",
};

// OpenStreetMap embed (bez API ključa) — centriran na Žabalj.
// ZAMENI: tačan bbox/marker kad potvrdiš koordinate firme u src/lib/site.ts
const mapSrc =
  "https://www.openstreetmap.org/export/embed.html?bbox=20.0386%2C45.3522%2C20.0986%2C45.3922&layer=mapnik&marker=45.3722%2C20.0686";

export default function KontaktPage() {
  const channels = [
    {
      icon: Phone,
      label: "Telefon",
      value: site.phoneDisplay,
      href: site.telHref,
      note: "Najbrži odgovor — pozovite nas",
    },
    {
      icon: PhoneCall,
      label: "Viber",
      value: site.phoneDisplay,
      href: site.viberHref,
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
      <section className="section bg-cream pt-28 md:pt-32">
        <div className="container mx-auto max-w-2xl">
          <h1 className="font-display text-2xl font-bold text-charcoal md:text-3xl">
            Javite se — odgovaramo isti dan
          </h1>
          <p className="mt-3 text-sm text-muted-foreground md:text-base">
            Pozovite ili pišite na Viber. Za slanje upita i ponude posetite stranicu Zatraži
            ponudu.
          </p>

          <Reveal className="mt-8">
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
