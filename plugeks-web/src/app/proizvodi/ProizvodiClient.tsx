"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { products, categories, type CategoryKey } from "@/lib/data";
import { ProductCard } from "@/components/ProductCard";
import { cn } from "@/lib/utils";
import { SlidersHorizontal } from "lucide-react";

type Filter = "sve" | CategoryKey;

export function ProizvodiClient() {
  const params = useSearchParams();
  const initial = (params.get("kategorija") as CategoryKey | null) ?? null;
  const [filter, setFilter] = useState<Filter>(
    initial && categories.some((c) => c.key === initial) ? initial : "sve",
  );

  const filtered = useMemo(
    () => (filter === "sve" ? products : products.filter((p) => p.category === filter)),
    [filter],
  );

  const tabs: { key: Filter; label: string }[] = [
    { key: "sve", label: "Sve" },
    ...categories.map((c) => ({ key: c.key as Filter, label: c.label })),
  ];

  return (
    <div>
      {/* Filter trake */}
      <div className="sticky top-16 z-30 -mx-5 mb-10 border-b border-border bg-cream/90 px-5 py-4 backdrop-blur-md md:top-20">
        <div className="flex items-center gap-3">
          <SlidersHorizontal className="hidden h-4 w-4 shrink-0 text-muted-foreground sm:block" />
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setFilter(t.key)}
                className={cn(
                  "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  filter === t.key
                    ? "bg-brand text-cream shadow-soft"
                    : "border border-border bg-white text-foreground/80 hover:border-brand/40 hover:text-brand",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="mb-6 text-sm text-muted-foreground">
        Prikazano <span className="font-semibold text-charcoal">{filtered.length}</span>{" "}
        {filtered.length === 1 ? "proizvod" : "proizvoda"}
      </p>

      <motion.div layout className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
        {filtered.map((p) => (
          <motion.div
            key={p.id}
            layout
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <ProductCard product={p} />
          </motion.div>
        ))}
      </motion.div>

      {filtered.length === 0 && (
        <p className="py-16 text-center text-muted-foreground">
          Nema proizvoda u ovoj kategoriji. Pozovite nas — verovatno ipak možemo da pomognemo.
        </p>
      )}
    </div>
  );
}
