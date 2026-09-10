"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Jedno polje za lozinku — prijava na interni deo. */
export function PrijavaForm() {
  const router = useRouter();
  const [lozinka, setLozinka] = useState("");
  const [greska, setGreska] = useState<string | null>(null);
  const [salje, setSalje] = useState(false);

  async function posalji(e: React.FormEvent) {
    e.preventDefault();
    setSalje(true);
    setGreska(null);
    try {
      const odgovor = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lozinka }),
      });
      const podaci = await odgovor.json();
      if (!odgovor.ok || !podaci.ok) {
        setGreska(podaci.poruka ?? "Prijava nije uspela.");
        return;
      }
      router.replace("/admin/cene");
      router.refresh();
    } catch {
      setGreska("Nema veze sa serverom.");
    } finally {
      setSalje(false);
    }
  }

  return (
    <form
      onSubmit={posalji}
      className="mt-6 rounded-2xl border border-border bg-white p-5 shadow-card"
    >
      <label
        htmlFor="lozinka"
        className="block text-sm font-medium text-charcoal"
      >
        Lozinka
      </label>
      <input
        id="lozinka"
        type="password"
        autoComplete="current-password"
        value={lozinka}
        onChange={(e) => setLozinka(e.target.value)}
        className="mt-2 h-12 w-full rounded-xl border border-input bg-white px-4 text-sm outline-none transition-colors focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-ring"
      />

      {greska ? <p className="mt-3 text-sm text-red-700">{greska}</p> : null}

      <Button type="submit" variant="primary" className="mt-4 w-full" disabled={salje}>
        {salje ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Prijavi se
      </Button>
    </form>
  );
}
