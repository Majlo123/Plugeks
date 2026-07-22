import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, Phone } from "lucide-react";
import { site } from "@/lib/site";

export default function NotFound() {
  return (
    <section className="grid min-h-[70vh] place-items-center bg-cream px-5 pt-20">
      <div className="text-center">
        <p className="font-display text-7xl font-bold text-brand md:text-8xl">404</p>
        <h1 className="mt-4 text-2xl font-bold text-charcoal md:text-3xl">
          Stranica nije pronađena
        </h1>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">
          Tražena stranica ne postoji ili je premeštena. Vratite se na početnu ili nas pozovite.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild variant="primary" size="lg">
            <Link href="/">
              <Home className="h-5 w-5" /> Početna
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <a href={site.telHref}>
              <Phone className="h-5 w-5" /> {site.phoneDisplay}
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
