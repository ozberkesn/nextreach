import { Button } from "@/components/ui/Button";

export function Nav({ onContactClick }: { onContactClick: () => void }) {
  return (
    <nav className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200/80 bg-white/80 px-6 py-4 backdrop-blur-sm sm:px-12">
      <span className="text-lg font-semibold tracking-tight text-slate-900">
        Next<span className="text-brand-600">Reach</span>
      </span>
      <Button onClick={onContactClick} size="sm">
        Bize Ulaşın
      </Button>
    </nav>
  );
}
