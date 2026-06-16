export function Footer({ onContactClick }: { onContactClick: () => void }) {
  return (
    <footer className="border-t border-slate-200 px-6 py-8 text-center text-sm text-slate-500 sm:px-12">
      © {new Date().getFullYear()} NextReach. Sorularınız için{" "}
      <button
        onClick={onContactClick}
        className="cursor-pointer text-brand-600 underline underline-offset-4 transition-colors hover:text-brand-700"
      >
        bize ulaşın
      </button>
      .
    </footer>
  );
}
