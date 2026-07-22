import { stats } from "@/lib/data";
import { Reveal } from "@/components/Reveal";

export function TrustStats() {
  return (
    <section className="border-y border-border bg-white">
      <div className="container grid grid-cols-2 gap-8 py-12 md:grid-cols-4 md:py-14">
        {stats.map((s, i) => (
          <Reveal key={s.label} delay={i * 0.08} className="text-center">
            <p className="font-display text-4xl font-bold text-brand md:text-5xl">
              {s.value}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">{s.label}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
