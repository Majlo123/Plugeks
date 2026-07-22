import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Product } from "@/lib/data";
import { categories, categoryLabel } from "@/lib/data";
import { MediaPlaceholder } from "@/components/ui/media-placeholder";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function ProductCard({ product }: { product: Product }) {
  const category = categories.find((c) => c.key === product.category);
  const Icon = category?.icon;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
      {/* Slika */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <MediaPlaceholder
          tone={product.tone}
          icon={Icon}
          label={product.name}
          src={category?.image}
          alt={`${product.name} — ${categoryLabel(product.category)}`}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="h-full w-full transition-transform duration-500 group-hover:scale-105"
        />
        {product.badge ? (
          <div className="absolute left-3 top-3">
            <Badge variant={product.badge === "Akcija" ? "accent" : "default"}>
              {product.badge}
            </Badge>
          </div>
        ) : null}
        <span className="absolute right-3 top-3 rounded-full bg-black/45 px-2.5 py-1 text-[0.72rem] font-medium text-cream backdrop-blur-sm">
          {categoryLabel(product.category)}
        </span>
      </div>

      {/* Sadržaj */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-display text-[1.05rem] font-bold leading-tight text-charcoal">
          {product.name}
        </h3>
        <p className="mt-1 line-clamp-1 text-[0.85rem] text-muted-foreground">
          {product.tagline}
        </p>

        {/* 2 ključne specifikacije kao kompaktni čipovi */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {product.specs.slice(0, 2).map((s) => (
            <span
              key={s.label}
              className="rounded-md bg-muted px-2 py-1 text-[0.72rem] text-foreground/85"
            >
              <span className="text-muted-foreground">{s.label}:</span>{" "}
              <span className="font-semibold text-charcoal">{s.value}</span>
            </span>
          ))}
        </div>

        <div className="flex-1" />
        <Button asChild variant="primary" size="sm" className="mt-4 w-full">
          <Link href={`/kontakt?proizvod=${encodeURIComponent(product.name)}`}>
            Zatraži ponudu
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </article>
  );
}
