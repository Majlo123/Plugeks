/**
 * Slaganje imenice uz broj na srpskom — „1 model”, „2 modela”, „5 modela”.
 *
 * Živi u zasebnom modulu (a ne u `products.ts`) da bi ga smele koristiti i
 * klijentske komponente: `products.ts` statički uvozi `parts.json` (~300 KB) i
 * namenjen je isključivo serveru.
 */
export function uzBroj(
  n: number,
  jednina: string,
  paucal: string,
  mnozina: string,
): string {
  const poslednja = n % 10;
  const poslednje_dve = n % 100;
  if (poslednje_dve >= 11 && poslednje_dve <= 14) return mnozina;
  if (poslednja === 1) return jednina;
  if (poslednja >= 2 && poslednja <= 4) return paucal;
  return mnozina;
}
