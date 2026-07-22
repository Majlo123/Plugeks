import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { MediaPlaceholder } from "@/components/ui/media-placeholder";
import type { ImageTone } from "@/lib/data";
import { Tractor } from "lucide-react";

/**
 * Zaglavlje unutrašnjih stranica — kompaktni "hero" sa breadcrumb-om.
 */
export function PageHeader({
  title,
  description,
  breadcrumb,
  tone = "field",
  image,
}: {
  title: string;
  description?: string;
  breadcrumb: string;
  tone?: ImageTone;
  image?: string;
}) {
  return (
    <section className="relative isolate overflow-hidden pt-28 pb-16 md:pt-36 md:pb-20">
      <div className="absolute inset-0 -z-10">
        <MediaPlaceholder tone={tone} icon={Tractor} src={image} priority sizes="100vw" className="h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-r from-charcoal/95 via-charcoal/86 to-charcoal/70" />
      </div>

      <div className="container">
        <nav className="flex items-center gap-1.5 text-[0.95rem] text-cream/80">
          <Link href="/" className="font-medium hover:text-cream">
            Početna
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="font-semibold text-cream">{breadcrumb}</span>
        </nav>
        <h1 className="mt-4 max-w-3xl font-display text-4xl font-bold leading-[1.08] tracking-[-0.02em] text-cream text-balance md:text-5xl lg:text-[3.4rem]">
          {title}
        </h1>
        {description ? (
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-cream/90">{description}</p>
        ) : null}
      </div>
    </section>
  );
}
