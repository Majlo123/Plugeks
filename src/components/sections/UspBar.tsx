import { Banknote, Landmark, ShieldCheck, Truck } from "lucide-react";

/**
 * Kompaktna "trust" traka u stilu modernih web-shopova — odmah ispod hera.
 * Sažima ključne vrednosne poruke (zamena za glomaznu "Zašto" sekciju).
 */

const items = [
  { icon: Banknote, title: "Plaćanje na rate", sub: "Krediti i lizing" },
  { icon: Landmark, title: "Subvencije", sub: "Podrška oko podsticaja" },
  { icon: ShieldCheck, title: "Garancija", sub: "Uz svaki proizvod" },
  { icon: Truck, title: "Brza isporuka", sub: "Srbija i region" },
];

export function UspBar() {
  return (
    <section className="border-b border-border bg-white">
      <div className="container grid grid-cols-2 gap-x-4 gap-y-5 py-7 md:grid-cols-4 md:py-8">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <div key={it.title} className="flex items-center gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="font-display text-[0.95rem] font-bold leading-tight text-charcoal">
                  {it.title}
                </p>
                <p className="text-[0.82rem] text-muted-foreground">{it.sub}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
