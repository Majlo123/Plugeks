"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Phone, Menu, X, PhoneCall } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { nav, site } from "@/lib/site";
import { cn } from "@/lib/utils";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Zatvori mobilni meni pri promeni stranice
  useEffect(() => setOpen(false), [pathname]);

  // Header je uvek "glass" sa borderom radi konzistentnog premium izgleda i čitljivosti.
  const light = false;

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        "glass border-b border-border",
        scrolled && "shadow-soft",
      )}
    >
      <div className="container flex h-[4.65rem] items-center justify-between md:h-[5.2rem]">
        <Link href="/" aria-label="PlugekS — početna" className="shrink-0">
          <Logo />
        </Link>

        {/* Desktop navigacija */}
        <nav className="hidden items-center gap-1.5 xl:flex">
          {nav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "whitespace-nowrap rounded-full px-3.5 py-2.5 font-display text-[1.03rem] font-semibold tracking-[-0.012em] transition-colors 2xl:px-4 2xl:text-[1.08rem]",
                  light
                    ? active
                      ? "bg-cream/20 text-cream"
                      : "text-cream/95 hover:bg-cream/10 hover:text-cream"
                    : active
                      ? "bg-brand-50 font-semibold text-brand"
                      : "text-foreground/95 hover:bg-muted hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-2 xl:flex">
          <Button
            asChild
            size="md"
            className="bg-[#7360F2] text-white text-[0.98rem] font-semibold shadow-soft hover:bg-[#5F4FD8] hover:shadow-lift"
          >
            <a href={site.viberHref} target="_blank" rel="noopener noreferrer">
              <PhoneCall className="h-[1.15rem] w-[1.15rem]" />
              Viber
            </a>
          </Button>
          <Button asChild variant="accent" size="md" className="text-[0.98rem] font-semibold">
            <a href={site.telHref}>
              <Phone className="h-[1.15rem] w-[1.15rem]" />
              {site.phoneDisplay}
            </a>
          </Button>
        </div>

        {/* Mobilni / tablet: brzi poziv + hamburger */}
        <div className="flex items-center gap-2 xl:hidden">
          <Button asChild variant="accent" size="sm" className="px-3">
            <a href={site.telHref} aria-label="Pozovi">
              <Phone className="h-4 w-4" />
              <span className="hidden sm:inline">Pozovi</span>
            </a>
          </Button>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Zatvori meni" : "Otvori meni"}
            aria-expanded={open}
            className={cn(
              "grid h-10 w-10 place-items-center rounded-full border transition-colors",
              light
                ? "border-cream/30 bg-cream/10 text-cream"
                : "border-border bg-white text-charcoal",
            )}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobilni / tablet meni */}
      <div
        className={cn(
          "xl:hidden overflow-hidden border-t border-border bg-cream transition-[max-height,opacity] duration-300",
          open ? "max-h-[420px] opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <nav className="container flex flex-col gap-1 py-4">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-xl px-4 py-3 text-base font-medium",
                pathname === item.href
                  ? "bg-brand-50 text-brand"
                  : "text-foreground hover:bg-muted",
              )}
            >
              {item.label}
            </Link>
          ))}
          <a
            href={site.viberHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-[#7360F2] px-4 py-3 font-medium text-white"
          >
            <PhoneCall className="h-4 w-4" /> Piši nam na Viber
          </a>
        </nav>
      </div>
    </header>
  );
}
