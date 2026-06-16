import { Activity, LayoutDashboard, Users2 } from "lucide-react";

const FEATURES = [
  {
    title: "Tek ekranda tüm metrikler",
    description:
      "Satış, stok ve kampanya verilerini farklı sekmeler arasında geçmeden tek bir dashboard'da görün.",
    icon: LayoutDashboard,
  },
  {
    title: "Gerçek zamanlı veri",
    description: "Mağazanızdaki değişiklikler dakikalar içinde dashboard'a yansır.",
    icon: Activity,
  },
  {
    title: "Ekip bazlı görünüm",
    description: "Pazarlama, operasyon ve yönetim için ayrı, sade görünümler tanımlayın.",
    icon: Users2,
  },
];

export function Features() {
  return (
    <section className="border-t border-slate-200 bg-slate-50 px-6 py-24 sm:px-12 sm:py-32">
      <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-3">
        {FEATURES.map((feature) => (
          <div
            key={feature.title}
            className="rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <feature.icon size={20} />
            </span>
            <h3 className="mt-4 font-semibold text-slate-900">{feature.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
