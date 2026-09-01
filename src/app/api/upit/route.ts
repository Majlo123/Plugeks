import { Resend } from "resend";
import { site } from "@/lib/site";

/**
 * Prijem upita sa forme „Zatraži ponudu" → email na adresu firme.
 *
 * Podešavanje (Vercel → Settings → Environment Variables):
 *   RESEND_API_KEY  — obavezno, sa resend.com
 *   UPIT_TO         — opciono, gde stiže upit (podrazumevano: site.email)
 *   UPIT_FROM       — opciono, pošiljalac. Dok domen nije verifikovan na
 *                     Resend-u ostaje onboarding@resend.dev, koji ume da šalje
 *                     samo na adresu vlasnika Resend naloga.
 *
 * Ruta NIKAD ne sme da vrati uspeh ako mail nije otišao — forma je ranije
 * prikazivala „Upit je poslat!" bez slanja, pa su se upiti tiho gubili.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LIMITS = { ime: 120, telefon: 40, poruka: 4000, proizvod: 200 } as const;

const clean = (v: unknown, max: number) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

const esc = (s: string) =>
  s.replace(/[<>&"']/g, (c) =>
    c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === "&" ? "&amp;" : c === '"' ? "&quot;" : "&#39;",
  );

const fail = (status: number, poruka: string) =>
  Response.json({ ok: false, poruka }, { status });

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return fail(400, "Neispravan zahtev.");
  }

  // Honeypot: pravo polje je skriveno, pa ga popunjavaju samo botovi. Njima
  // vraćamo uspeh da ne pokušavaju ponovo, ali mail ne šaljemo.
  if (clean(body.website, 200)) return Response.json({ ok: true });

  const ime = clean(body.ime, LIMITS.ime);
  const telefon = clean(body.telefon, LIMITS.telefon);
  const poruka = clean(body.poruka, LIMITS.poruka);
  const proizvod = clean(body.proizvod, LIMITS.proizvod);

  if (ime.length < 2) return fail(422, "Unesite vaše ime.");
  if (!/^[+\d][\d\s\-/()]{6,}$/.test(telefon)) return fail(422, "Unesite ispravan broj telefona.");

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[upit] RESEND_API_KEY nije podešen — upit nije poslat:", { ime, telefon });
    return fail(500, "Slanje trenutno nije dostupno. Pozovite nas na " + site.phoneDisplay + ".");
  }

  const kada = new Date().toLocaleString("sr-RS", { timeZone: "Europe/Belgrade" });
  const redovi: Array<[string, string]> = [
    ["Ime", ime],
    ["Telefon", telefon],
    ...(proizvod ? ([["Proizvod", proizvod]] as Array<[string, string]>) : []),
    ["Poruka", poruka || "(bez poruke)"],
    ["Primljeno", kada],
  ];

  try {
    const { error } = await new Resend(apiKey).emails.send({
      from: process.env.UPIT_FROM ?? "PlugekS sajt <onboarding@resend.dev>",
      to: process.env.UPIT_TO ?? site.email,
      subject: `Novi upit sa sajta — ${ime} (${telefon})`,
      text: redovi.map(([k, v]) => `${k}: ${v}`).join("\n"),
      html: `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.6">
  <h2 style="margin:0 0 16px">Novi upit sa sajta</h2>
  <table cellpadding="6" style="border-collapse:collapse">
    ${redovi
      .map(
        ([k, v]) =>
          `<tr><td style="color:#5f695f;vertical-align:top"><strong>${esc(k)}</strong></td><td>${esc(v).replace(/\n/g, "<br>")}</td></tr>`,
      )
      .join("")}
  </table>
  <p style="margin-top:20px"><a href="tel:${esc(telefon)}">Pozovi ${esc(ime)}</a></p>
</div>`,
    });

    if (error) {
      console.error("[upit] Resend greska:", error);
      return fail(502, "Slanje nije uspelo. Pozovite nas na " + site.phoneDisplay + ".");
    }
  } catch (e) {
    console.error("[upit] neocekivana greska:", e);
    return fail(502, "Slanje nije uspelo. Pozovite nas na " + site.phoneDisplay + ".");
  }

  return Response.json({ ok: true });
}
