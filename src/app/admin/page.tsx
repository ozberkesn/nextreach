import { Inbox, LogOut } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { LeadList } from "@/components/admin/LeadList";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { logout } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const leads = await prisma.lead.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <Inbox size={18} />
          </span>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Gelen Talepler</h1>
            <div className="mt-1">
              <Badge className="bg-brand-50 text-brand-700">{leads.length} talep</Badge>
            </div>
          </div>
        </div>
        <form action={logout}>
          <Button type="submit" variant="ghost" size="sm">
            <LogOut size={16} />
            Çıkış yap
          </Button>
        </form>
      </header>

      <LeadList leads={leads} />
    </main>
  );
}
