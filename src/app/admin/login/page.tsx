import { AlertCircle, Lock } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { login } from "./actions";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <form
        action={login}
        className="w-full max-w-sm space-y-4 rounded-2xl border border-slate-200 bg-white p-8 shadow-lg shadow-slate-200/50"
      >
        <div>
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <Lock size={18} />
          </span>
          <h1 className="mt-4 text-lg font-semibold text-slate-900">Admin Girişi</h1>
          <p className="mt-1 text-sm text-slate-500">
            Gelen iletişim taleplerini görmek için parolayı girin.
          </p>
        </div>

        <input
          type="password"
          name="password"
          placeholder="Parola"
          required
          autoFocus
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />

        {error && (
          <p className="flex items-center gap-1.5 text-sm text-red-600">
            <AlertCircle size={14} />
            Parola yanlış, tekrar deneyin.
          </p>
        )}

        <Button type="submit" variant="primary" className="w-full">
          Giriş yap
        </Button>
      </form>
    </main>
  );
}
