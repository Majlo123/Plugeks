import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { jeAdmin, adminToken } from "@/lib/admin";
import { PrijavaForm } from "./PrijavaForm";

/**
 * Ulaz u interni deo. Nema navigacije ka njemu sa sajta — adresa se zna ili se
 * ne zna.
 */

export const dynamic = "force-dynamic";

// Interni deo ne sme u indeks ni u deljene linkove.
export const metadata: Metadata = {
  title: "Interni pristup",
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminPage() {
  if (jeAdmin()) redirect("/admin/cene");

  return (
    <section className="section bg-cream pt-28 md:pt-32">
      <div className="container max-w-md">
        <h1 className="font-display text-2xl font-bold text-charcoal">
          Interni pristup
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Pregled cenovnika prikolica i drugi podaci za održavanje sajta.
        </p>

        {adminToken() ? (
          <PrijavaForm />
        ) : (
          <p className="mt-6 rounded-2xl border border-border bg-white p-5 text-sm text-muted-foreground">
            Interni deo još nije podešen. Unesite promenljivu{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-charcoal">
              ADMIN_LOZINKA
            </code>{" "}
            u okruženje sajta (Vercel → Settings → Environment Variables, a
            lokalno u <code className="font-mono text-xs">.env.local</code>) i
            objavite ponovo.
          </p>
        )}
      </div>
    </section>
  );
}
