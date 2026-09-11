"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { normalize, type FacetOption } from "@/lib/catalog";

type MultiSelectProps = {
  label: string;
  placeholder: string;
  options: FacetOption[];
  selected: string[];
  /**
   * Šalje se samo promenjena vrednost, ne ceo novi niz — roditelj drži stanje
   * u URL-u, a URL se ne osveži odmah, pa bi niz izračunat iz `selected` bio
   * zastareo već pri drugom brzom kliku.
   */
  onToggle: (value: string) => void;
  onClear: () => void;
  /** Ispod ovog broja opcija polje za pretragu se ne prikazuje. */
  searchThreshold?: number;
};

/**
 * Padajuće polje sa više izbora i pretragom — jedan „filter” u katalogu.
 *
 * Zatvara se klikom van polja ili tasterom Esc. Lista se ne virtualizuje jer
 * najduža faseta (brendovi) ima ~70 opcija.
 */
export function MultiSelect({
  label,
  placeholder,
  options,
  selected,
  onToggle,
  onClear,
  searchThreshold = 8,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapper = useRef<HTMLDivElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: PointerEvent) => {
      if (!wrapper.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (open) searchInput.current?.focus();
    else setQuery("");
  }, [open]);

  const visible = useMemo(() => {
    const q = normalize(query.trim());
    return q ? options.filter((o) => normalize(o.label).includes(q)) : options;
  }, [options, query]);

  const summary =
    selected.length === 0
      ? placeholder
      : selected.length === 1
        ? (options.find((o) => o.value === selected[0])?.label ?? placeholder)
        : `${selected.length} izabrano`;

  return (
    <div ref={wrapper} className="relative">
      <span className="mb-1.5 block text-[0.78rem] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>

      {/* Dugme za brisanje izbora stoji pored, a ne unutar okidača — dugme u
          dugmetu nije validan HTML i čitači ekrana ga ne pročitaju. */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={listId}
          aria-label={`${label}: ${summary}`}
          className={cn(
            "flex h-12 w-full items-center rounded-xl border bg-white pl-4 text-left text-sm transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            selected.length > 0
              ? "border-brand/50 pr-16 text-charcoal"
              : "border-input pr-10 text-muted-foreground hover:border-brand/40",
          )}
        >
          <span className="flex-1 truncate">{summary}</span>
        </button>

        <ChevronDown
          aria-hidden
          className={cn(
            "pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />

        {selected.length > 0 ? (
          <button
            type="button"
            onClick={onClear}
            aria-label={`Poništi filter „${label}”`}
            className="absolute right-9 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      {open ? (
        <div
          id={listId}
          className="absolute left-0 right-0 top-full z-40 mt-2 overflow-hidden rounded-xl border border-border bg-white shadow-lift"
        >
          {options.length >= searchThreshold ? (
            <div className="relative border-b border-border">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={searchInput}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Pretraži — ${label.toLowerCase()}`}
                // 16px na telefonu: Safari na iOS-u sam zumira stranicu čim se
                // fokusira polje sa slovima manjim od toga, pa je kucanje po
                // brendu ili tipu dela izbacivalo padajuću listu iz kadra.
                // Na širem ekranu ostaje sitnije, kao i ostatak filtera.
                className="h-11 w-full bg-transparent pl-9 pr-3 text-base outline-none placeholder:text-muted-foreground md:text-sm"
              />
            </div>
          ) : null}

          <ul
            role="listbox"
            aria-multiselectable
            aria-label={label}
            className="max-h-64 overflow-y-auto py-1"
          >
            {visible.map((option) => {
              const isSelected = selected.includes(option.value);
              return (
                <li key={option.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    aria-label={`${option.label} (${option.count})`}
                    onClick={() => onToggle(option.value)}
                    disabled={option.count === 0 && !isSelected}
                    className={cn(
                      "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors",
                      "hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent",
                      isSelected && "bg-brand-50",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                        isSelected ? "border-brand bg-brand text-cream" : "border-input",
                      )}
                    >
                      {isSelected ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
                    </span>
                    <span className="flex-1 truncate text-charcoal">{option.label}</span>
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {option.count}
                    </span>
                  </button>
                </li>
              );
            })}

            {visible.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-muted-foreground">
                Nema rezultata za „{query}”
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
