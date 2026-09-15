"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle, Phone, X } from "lucide-react";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * Plutajuće dugme za brz kontakt — uvek vidljivo (posebno na mobilnom).
 * Otvara WhatsApp, Viber i direktan poziv. Smanjuje trenje do konverzije.
 *
 * OSIM U INTERNOM DELU (`/admin`): tamo je jedini posetilac vlasnik sajta, pa
 * dugme nema kome da ponudi poziv — a na telefonu je stajalo tačno preko
 * desne, cenovne kolone u tabeli cenovnika.
 */
export function FloatingContact() {
  const putanja = usePathname();
  const [open, setOpen] = useState(false);

  if (putanja?.startsWith("/admin")) return null;

  const actions = [
    {
      label: "WhatsApp",
      href: site.whatsappHref,
      external: true,
      className: "bg-[#25D366] text-white",
      icon: MessageCircle,
    },
    {
      label: "Viber",
      href: site.viberHref,
      external: false,
      className: "bg-[#7360F2] text-white",
      icon: MessageCircle,
    },
    {
      label: site.phoneDisplay,
      href: site.telHref,
      external: false,
      className: "bg-brand text-cream",
      icon: Phone,
    },
  ];

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {/* Akcije */}
      <div
        className={cn(
          "flex flex-col items-end gap-3 transition-all duration-300",
          open
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none translate-y-2 opacity-0",
        )}
      >
        {actions.map((a) => {
          const Icon = a.icon;
          return (
            <a
              key={a.label}
              href={a.href}
              {...(a.external
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
              className={cn(
                "flex items-center gap-2.5 rounded-full py-2.5 pl-3 pr-4 text-sm font-semibold shadow-lift transition-transform hover:scale-105",
                a.className,
              )}
            >
              <Icon className="h-5 w-5" />
              {a.label}
            </a>
          );
        })}
      </div>

      {/* Glavno dugme */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Zatvori kontakt" : "Brz kontakt"}
        aria-expanded={open}
        className={cn(
          "grid h-14 w-14 place-items-center rounded-full text-cream shadow-lift transition-all duration-300 hover:scale-105",
          open ? "bg-charcoal rotate-90" : "bg-brand",
        )}
      >
        {open ? <X className="h-6 w-6" /> : <Phone className="h-6 w-6" />}
        {!open && (
          <span className="absolute inline-flex h-14 w-14 animate-ping rounded-full bg-brand/40 [animation-duration:2.5s]" />
        )}
      </button>
    </div>
  );
}
