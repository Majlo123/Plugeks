import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Logo PlugekS — pravi logotip klijenta.
 * `full` (footer i sl.) uključuje i podnaslov "Napredna poljoprivreda";
 * podrazumevano se koristi samo kompaktan wordmark (npr. u headeru).
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
      priority
      className={cn("h-14 w-auto md:h-16", className)}
    />
  ) : (
    <Image
      src="/images/logo-mark.png"
      alt="PlugekS"
      width={960}
      height={203}
      priority
      className={cn("h-11 w-auto md:h-14", className)}
    />
  );
}
