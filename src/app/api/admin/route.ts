import { ADMIN_COOKIE, adminToken, lozinkaTacna } from "@/lib/admin";

/**
 * Prijava i odjava za interni deo (`/admin`).
 *
 * POST   { lozinka }  → postavlja kolačić sa otiskom lozinke
 * DELETE              → briše kolačić
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Gruba brana na pogađanje lozinke — po IP adresi, u memoriji procesa. */
const pokusaji = new Map<string, { broj: number; do: number }>();
const MAX_POKUSAJA = 8;
const PAUZA = 10 * 60 * 1000;

function preblizu(ip: string): boolean {
  const sada = Date.now();
  const zapis = pokusaji.get(ip);
  if (!zapis || zapis.do < sada) return false;
  return zapis.broj >= MAX_POKUSAJA;
}

function zabelezi(ip: string) {
  const sada = Date.now();
  const zapis = pokusaji.get(ip);
  if (!zapis || zapis.do < sada) pokusaji.set(ip, { broj: 1, do: sada + PAUZA });
  else zapis.broj += 1;
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "lokalno";

  if (!adminToken()) {
    return Response.json(
      { ok: false, poruka: "Interni deo nije podešen — nedostaje ADMIN_LOZINKA." },
      { status: 503 },
    );
  }

  if (preblizu(ip)) {
    return Response.json(
      { ok: false, poruka: "Previše pokušaja. Sačekajte deset minuta." },
      { status: 429 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, poruka: "Neispravan zahtev." }, { status: 400 });
  }

  const lozinka = typeof body.lozinka === "string" ? body.lozinka : "";
  if (!lozinkaTacna(lozinka)) {
    zabelezi(ip);
    return Response.json({ ok: false, poruka: "Pogrešna lozinka." }, { status: 401 });
  }

  pokusaji.delete(ip);
  const odgovor = Response.json({ ok: true });
  odgovor.headers.append(
    "Set-Cookie",
    [
      `${ADMIN_COOKIE}=${adminToken()}`,
      "Path=/",
      "HttpOnly",
      "SameSite=Strict",
      // Lokalno (http://localhost) `Secure` bi kolačić odbacio.
      process.env.NODE_ENV === "production" ? "Secure" : "",
      `Max-Age=${60 * 60 * 12}`,
    ]
      .filter(Boolean)
      .join("; "),
  );
  return odgovor;
}

export async function DELETE() {
  const odgovor = Response.json({ ok: true });
  odgovor.headers.append(
    "Set-Cookie",
    `${ADMIN_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`,
  );
  return odgovor;
}
