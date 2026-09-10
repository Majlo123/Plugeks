/**
 * „85040” → „85.040”.
 *
 * Ručno, a ne `toLocaleString("sr-RS")`, iz dva razloga: server (Node ICU) i
 * pregledač ne moraju da grupišu hiljade istim znakom, pa bi se React žalio na
 * neslaganje pri hidraciji; i cenovnik se ovako ispisuje isto na svakoj mašini.
 *
 * Živi u svom fajlu (bez `"use client"`) da ga smeju uvesti i serverska strana
 * `page.tsx` i klijentska `CeneTabele.tsx` — funkcija izvezena iz klijentskog
 * modula na serveru nije funkcija nego referenca na klijentski modul.
 */
export const dinara = (n: number) =>
  String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
