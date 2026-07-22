import { advantages } from "@/lib/data";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/Reveal";

/**
 * "Zašto PlugekS" — rešava nedostatak iz audita: jasna vrednosna ponuda.
 * Tamna sekcija radi premium kontrasta.
 */
export function ZastoMi() {
  return (
    <section className="section relative overflow-hidden bg-charcoal text-cream">
      {/* dekorativni gradijent */}
      <div className="pointer-events-none absolute -right-40 top-0 h-96 w-96 rounded-full bg-brand/20 blur-3xl" />
      <div className="pointer-events-none absolute -left-40 bottom-0 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />

      <div className="container relative">
        <SectionHeading
          eyebrow="Zašto baš PlugekS"
          title="Više od prodaje — partner za vaše gazdinstvo"
          description="Ne nudimo samo mašine, već i sve što vam treba da do njih lako dođete: finansiranje, podršku oko subvencija, garanciju i stručan savet."
          variant="light"
        />

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {advantages.map((a, i) => {
            const Icon = a.icon;
            return (
              <Reveal key={a.title} delay={(i % 3) * 0.08}>
                <div className="group h-full rounded-2xl border border-white/10 bg-white/[0.04] p-7 transition-all duration-300 hover:border-brand-400/40 hover:bg-white/[0.07]">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-brand text-cream transition-transform duration-300 group-hover:scale-110">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-cream">{a.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-cream/65">
                    {a.description}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
