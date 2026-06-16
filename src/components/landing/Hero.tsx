import { ArrowRight, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/Button";

export function Hero({ onContactClick }: { onContactClick: () => void }) {
  return (
    <section className="relative overflow-hidden px-6 py-24 text-center sm:px-12 sm:py-32">
      <div
        className="absolute inset-0 -z-10 opacity-[0.05]"
        style={{
          backgroundImage: "radial-gradient(circle, #0f172a 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
        aria-hidden="true"
      />

      <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
        <Sparkles size={14} />
        E-ticaret analitiği
      </span>

      <h1 className="mx-auto mt-6 max-w-2xl text-5xl font-semibold tracking-tight text-slate-900 sm:text-6xl">
        E-ticaret performansınızı daha iyi anlamak mı istiyorsunuz?
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-lg text-slate-600 sm:text-xl">
        NextReach, orta ölçekli e-ticaret firmalarına analitik dashboard sağlar. Ne
        aradığınızı bize anlatın, ekibimiz size en uygun çözümle dönsün.
      </p>

      <Button onClick={onContactClick} className="group mt-8 shadow-brand-glow">
        Bize Ulaşın
        <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
      </Button>
    </section>
  );
}
