import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Logo PlugekS — pravi logotip klijenta.
 * `full` (footer i sl.) uključuje i podnaslov "Napredna poljoprivreda";
 * podrazumevano se koristi samo kompaktan wordmark (npr. u headeru).
 *
 * BEZ `priority`. Ranije su ga imale obe varijante, pa je na SVAKOJ strani —
 * i na strani proizvoda — u HTML-u prvo stajalo
 * `<link rel="preload" as="image" … logo-mark.png" fetchPriority="high">`, ispred
 * fotografije samog proizvoda. Logo od 44px nikad nije LCP element, a bio je
 * jedina slika na sajtu koju smo izričito proglašavali najvažnijom.
 *
 * `sizes` je tu da Next ne pravi srcSet do 1920px za slot od ~230px.
 */

export function Logo({
  className,
  full = false,
}: {
  className?: string;
  full?: boolean;
}) {
  return full ? (
    <Image
      src="/images/logo-full.png"
      alt="PlugekS — napredna poljoprivreda"
      width={960}
      height={249}
      sizes="260px"
      loading="lazy"
      className={cn("h-14 w-auto md:h-16", className)}
    />
  ) : (
    <Image
      src="/images/logo-mark.png"
      alt="PlugekS"
      width={960}
      height={203}
      sizes="230px"
      className={cn("h-11 w-auto md:h-14", className)}
    />
  );
}
