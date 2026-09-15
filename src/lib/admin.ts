import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Interni pristup — samo za vlasnika sajta.
 *
 * Postoji zbog pregleda cenovnika prikolica (`/admin/cene`) — strane za
 * održavanje, ne za kupce. Zato NIJE nikakav korisnički sistem nego jedna
 * lozinka iz okruženja.
 *
 * PODEŠAVANJE (Vercel → Settings → Environment Variables, i lokalno u
 * `.env.local`):
 *
 *   ADMIN_LOZINKA=nekaDugackaLozinka
 *
 * Bez te promenljive interni deo je ZAKLJUČAN za sve — nema podrazumevane
 * lozinke, da se sajt slučajno ne objavi sa poznatom.
 *
 * U kolačić se ne upisuje lozinka nego njen otisak, pa ni ukraden kolačić ne
 * odaje samu lozinku. Kolačić je `httpOnly` (JavaScript na stranici ga ne vidi)
 * i `sameSite: strict` (ne šalje se sa tuđih sajtova).
 */

export const ADMIN_COOKIE = "plugeks_admin";

const otisak = (v: string) => createHash("sha256").update(v).digest("hex");

/** Poređenje otporno na merenje vremena — obe strane su isti heks otisak. */
function isti(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Otisak koji se upisuje u kolačić; `null` kad lozinka nije podešena. */
export function adminToken(): string | null {
  const lozinka = process.env.ADMIN_LOZINKA;
  return lozinka ? otisak(lozinka) : null;
}

/** Da li je poslata lozinka tačna. */
export function lozinkaTacna(unos: string): boolean {
  const token = adminToken();
  return Boolean(token) && isti(otisak(unos), token!);
}

/**
 * Da li trenutni zahtev dolazi od prijavljenog vlasnika.
 *
 * Poziv čita kolačiće, pa stranica koja ovo koristi PRESTAJE da bude statična —
 * zato se koristi samo pod `/admin`, nikad na javnim stranicama proizvoda.
 */
export function jeAdmin(): boolean {
  const token = adminToken();
  if (!token) return false;
  const kolacic = cookies().get(ADMIN_COOKIE)?.value;
  return Boolean(kolacic) && isti(kolacic!, token);
}
