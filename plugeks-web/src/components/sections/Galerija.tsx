import { Play, Instagram, Facebook } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";
import { MediaPlaceholder } from "@/components/ui/media-placeholder";
import { Reveal } from "@/components/Reveal";
import { Button } from "@/components/ui/button";
import { site } from "@/lib/site";
import type { ImageTone } from "@/lib/data";

/**
 * Galerija / Video — Reels-stil prikaz demonstracija u radu i isporuka.
 *
 * ZAMENA: na svako mesto ubaci <video>/<Image> ili embed sa Instagram/Facebook.
 * Za embed Reels-a: koristi zvanični Instagram/Facebook embed kod ili
 * <iframe> sa permalink-a posta.
 */

const items: { tone: ImageTone; label: string; src: string; video?: boolean }[] = [
  { tone: "field", label: "Malčer u radu — voćnjak", src: "/images/malceri.jpg", video: true },
  { tone: "soil", label: "Freza — priprema zemljišta", src: "/images/freze.jpg", video: true },
  { tone: "steel", label: "Isporuka utovarivača", src: "/images/utovarivaci.jpg" },
  { tone: "harvest", label: "Kompakt traktor 4x4", src: "/images/traktori.jpg", video: true },
  { tone: "field", label: "Mašina u radu — njiva", src: "/images/galerija-1.jpg" },
  { tone: "forest", label: "Košenje i malčiranje — demo", src: "/images/galerija-3.jpg", video: true },
];

export function Galerija() {
  return (
    <section className="section bg-white">
      <div className="container">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading
            eyebrow="Mašine u radu"
            title="Vidite pre nego što kupite"
            description="Naše mašine snimamo i prikazujemo u realnim uslovima. Pogledajte demonstracije i isporuke — najbolji dokaz kvaliteta."
          />
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <a href={site.socials.instagram} target="_blank" rel="noopener noreferrer">
                <Instagram className="h-4 w-4" /> Instagram
              </a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href={site.socials.facebook} target="_blank" rel="noopener noreferrer">
                <Facebook className="h-4 w-4" /> Facebook
              </a>
            </Button>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-3">
          {items.map((it, i) => (
            <Reveal
              key={it.label}
              delay={(i % 3) * 0.06}
              className={i === 0 ? "col-span-2 md:col-span-1 md:row-span-2" : ""}
            >
              <div
                className={`group relative overflow-hidden rounded-2xl ${
                  i === 0 ? "aspect-square md:h-full" : "aspect-[4/5]"
                }`}
              >
                {/* ZAMENI: <video controls> ili embed Reels-a (sada: mockup fotografija) */}
                <MediaPlaceholder
                  tone={it.tone}
                  label={it.label}
                  src={it.src}
                  alt={it.label}
                  sizes="(max-width: 768px) 50vw, 33vw"
                  className="h-full w-full transition-transform duration-500 group-hover:scale-105"
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-charcoal/80 to-transparent p-4 pt-10">
                  <span className="text-sm font-medium text-cream">{it.label}</span>
                </div>
                {it.video && (
                  <div className="absolute inset-0 grid place-items-center">
                    <span className="grid h-16 w-16 place-items-center rounded-full bg-cream/90 text-brand shadow-lift transition-transform duration-300 group-hover:scale-110">
                      <Play className="h-7 w-7 translate-x-0.5 fill-current" />
                    </span>
                  </div>
                )}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
