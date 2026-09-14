"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FacetOption } from "@/lib/catalog";

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
};

/**
 * Padajuće polje sa više izbora — jedan „filter” u katalogu.
 *
 * NAMERNO BEZ POLJA ZA PRETRAGU unutar liste: ono je na telefonu pri svakom
 * otvaranju filtera dizalo tastaturu i pojedalo pola ekrana, a lista se bira
 * klikom, ne kucanjem. Ko hoće da kuca ima opštu pretragu ispod filtera.
 * Najduža faseta (brendovi) ima ~85 opcija — lista se skroluje.
 *
 * Zatvara se klikom van polja ili tasterom Esc.
 */
export function MultiSelect({
  label,
  placeholder,
  options,
  selected,
  onToggle,
  onClear,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);
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
          <ul
            role="listbox"
            aria-multiselectable
            aria-label={label}
            className="max-h-72 overflow-y-auto overscroll-contain py-1"
          >
            {options.map((option) => {
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
                      "flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-colors",
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

            {options.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-muted-foreground">
                Nema opcija za trenutni izbor
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
