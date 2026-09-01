"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { Input, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/**
 * Forma „Zatraži ponudu" — hvata lead-ove (ime, telefon, proizvod, poruka)
 * i šalje ih na `/api/upit`, koji prosleđuje email na adresu firme.
 *
 * „Upit je poslat!" se prikazuje ISKLJUČIVO kad ruta potvrdi da je mail otišao.
 * Ranije je stajala simulacija koja je uvek javljala uspeh, pa su se upiti
 * gubili bez traga — zato se svaka greška ovde prikazuje korisniku.
 */

type Status = "idle" | "loading" | "success" | "error";

export function QuoteForm({
  defaultProduct = "",
  compact = false,
}: {
  defaultProduct?: string;
  compact?: boolean;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = e.currentTarget;
    const data = new FormData(form);
    const ime = String(data.get("ime") ?? "").trim();
    const telefon = String(data.get("telefon") ?? "").trim();

    if (ime.length < 2) {
      setError("Unesite vaše ime.");
      return;
    }
    // Osnovna validacija broja telefona (cifre, +, razmaci, crtice)
    if (!/^[+\d][\d\s\-/()]{6,}$/.test(telefon)) {
      setError("Unesite ispravan broj telefona.");
      return;
    }

    setStatus("loading");
    try {
      const res = await fetch("/api/upit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ime,
          telefon,
          poruka: String(data.get("poruka") ?? "").trim(),
          proizvod: defaultProduct,
          website: String(data.get("website") ?? ""),
        }),
      });
      const odgovor = (await res.json().catch(() => null)) as
        | { ok?: boolean; poruka?: string }
        | null;

      if (!res.ok || !odgovor?.ok) {
        setStatus("idle");
        setError(odgovor?.poruka ?? "Slanje nije uspelo. Pokušajte ponovo ili nas pozovite.");
        return;
      }
    } catch {
      setStatus("idle");
      setError("Nema veze sa serverom. Proverite internet ili nas pozovite.");
      return;
    }

    setStatus("success");
    form.reset();
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-brand/20 bg-brand-50 p-8 text-center">
        <CheckCircle2 className="h-12 w-12 text-brand" />
        <div>
          <p className="text-lg font-semibold text-charcoal">Upit je poslat!</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Hvala vam. Javljamo se u najkraćem roku — obično isti dan.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setStatus("idle")}>
          Pošalji još jedan upit
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* Mamac za botove — skriveno od ljudi i od čitača ekrana. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="hidden"
      />
      <div className={compact ? "space-y-4" : "grid gap-4 sm:grid-cols-2"}>
        <div className="space-y-1.5">
          <label htmlFor="ime" className="text-sm font-medium text-charcoal">
            Ime i prezime <span className="text-accent-600">*</span>
          </label>
          <Input id="ime" name="ime" placeholder="npr. Marko Marković" autoComplete="name" />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="telefon" className="text-sm font-medium text-charcoal">
            Telefon <span className="text-accent-600">*</span>
          </label>
          <Input
            id="telefon"
            name="telefon"
            type="tel"
            placeholder="06x xxx xxxx"
            autoComplete="tel"
            inputMode="tel"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="poruka" className="text-sm font-medium text-charcoal">
          Poruka
        </label>
        <Textarea
          id="poruka"
          name="poruka"
          placeholder="Recite nam koji proizvod vas zanima, koji traktor imate i za koji posao vam treba mašina — preporučićemo najbolji model i poslati cenu."
          defaultValue={defaultProduct ? `Zanima me: ${defaultProduct}. ` : ""}
        />
      </div>

      {error && (
        <p className="text-sm font-medium text-red-600" role="alert">
          {error}
        </p>
      )}

      <Button type="submit" variant="accent" size="lg" className="w-full" disabled={status === "loading"}>
        {status === "loading" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Šaljem…
          </>
        ) : (
          <>
            <Send className="h-4 w-4" /> Pošalji upit
          </>
        )}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Slanjem upita pristajete da vas kontaktiramo povodom ponude. Vaši podaci se ne dele sa trećim licima.
      </p>
    </form>
  );
}
