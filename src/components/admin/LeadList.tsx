"use client";

import { useMemo, useState, useTransition } from "react";
import { Calendar, Flame, Gauge, Inbox, Loader2, MousePointerClick, TrendingUp } from "lucide-react";

import type { LeadModel as Lead } from "@/generated/prisma/models/Lead";
import { LeadStatus, Quality, Urgency } from "@/generated/prisma/enums";
import { updateLeadStatus } from "@/app/admin/actions";
import { Badge } from "@/components/ui/Badge";
import { MessageBubble } from "@/components/ui/MessageBubble";
import { LEAD_TIER_LABEL, LEAD_TIER_STYLES, computeLeadScore, getLeadTier } from "@/lib/leadScore";

const INTENT_LABELS: Record<string, string> = {
  PRICING: "Fiyat bilgisi",
  DEMO: "Demo talebi",
  PRODUCT_INFO: "Ürün hakkında bilgi",
  OTHER: "Diğer",
  UNKNOWN: "Bilinmiyor",
};

const MONTHLY_VISITORS_LABELS: Record<string, string> = {
  UNDER_10K: "0-10K",
  BETWEEN_10K_100K: "10K-100K",
  OVER_100K: "100K+",
  UNKNOWN: "Bilinmiyor",
};

type TranscriptMessage = { role: "user" | "assistant"; content: string };

function parseTranscript(value: Lead["transcript"]): TranscriptMessage[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (m): m is TranscriptMessage =>
      typeof m === "object" &&
      m !== null &&
      "role" in m &&
      "content" in m &&
      typeof (m as Record<string, unknown>).content === "string"
  );
}

const URGENCY_STYLES: Record<Urgency, string> = {
  HIGH: "bg-red-100 text-red-700",
  MEDIUM: "bg-amber-100 text-amber-700",
  LOW: "bg-slate-100 text-slate-600",
  UNKNOWN: "bg-slate-100 text-slate-400",
};

const QUALITY_STYLES: Record<Quality, string> = {
  HIGH: "bg-emerald-100 text-emerald-700",
  MEDIUM: "bg-amber-100 text-amber-700",
  LOW: "bg-slate-100 text-slate-600",
  UNKNOWN: "bg-slate-100 text-slate-400",
};

const STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: "Yeni",
  CONTACTED: "İletişime geçildi",
  CLOSED: "Kapatıldı",
};

function formatDate(date: Date) {
  return new Date(date).toLocaleString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function LeadList({ leads }: { leads: Lead[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(leads[0]?.id ?? null);
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "ALL">("ALL");
  const [hideFlagged, setHideFlagged] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [pendingStatus, setPendingStatus] = useState<LeadStatus | null>(null);

  const filtered = useMemo(
    () =>
      leads
        .filter((lead) => {
          if (statusFilter !== "ALL" && lead.status !== statusFilter) return false;
          if (hideFlagged && lead.flagged) return false;
          return true;
        })
        .sort((a, b) => computeLeadScore(b) - computeLeadScore(a)),
    [leads, statusFilter, hideFlagged]
  );

  const selected = filtered.find((lead) => lead.id === selectedId) ?? filtered[0] ?? null;

  return (
    <div className="flex flex-col gap-4 p-4 md:flex-row md:gap-0 md:p-0">
      <aside className="w-full shrink-0 border-slate-200 md:w-96 md:border-r">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white p-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as LeadStatus | "ALL")}
            className="rounded-md border border-slate-300 px-2 py-1 text-sm"
          >
            <option value="ALL">Tüm durumlar</option>
            {Object.values(LeadStatus).map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-1.5 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={hideFlagged}
              onChange={(e) => setHideFlagged(e.target.checked)}
            />
            Şüpheli talepleri gizle
          </label>
        </div>

        <ul className="max-h-[70vh] divide-y divide-slate-200 overflow-y-auto bg-white">
          {filtered.length === 0 && (
            <li className="flex flex-col items-center gap-2 p-8 text-center text-sm text-slate-500">
              <Inbox size={20} className="text-slate-300" />
              Talep bulunamadı.
            </li>
          )}
          {filtered.map((lead) => {
            const score = computeLeadScore(lead);
            const tier = getLeadTier(score);
            return (
              <li key={lead.id}>
                <button
                  onClick={() => setSelectedId(lead.id)}
                  className={`w-full border-l-2 p-4 text-left transition-colors hover:bg-slate-50 ${
                    selected?.id === lead.id
                      ? "border-l-brand-600 bg-brand-50/50"
                      : "border-l-transparent"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-medium text-slate-900">
                      {lead.name || lead.company || "İsimsiz ziyaretçi"}
                    </span>
                    <span className="shrink-0 text-xs text-slate-400">
                      {formatDate(lead.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-600">{lead.reason}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge className={LEAD_TIER_STYLES[tier]}>
                      {score} · {LEAD_TIER_LABEL[tier]}
                    </Badge>
                    <Badge className={URGENCY_STYLES[lead.urgency]}>
                      {lead.urgency === "UNKNOWN" ? "Aciliyet ?" : lead.urgency}
                    </Badge>
                    <Badge className={QUALITY_STYLES[lead.quality]}>
                      Kalite: {lead.quality === "UNKNOWN" ? "?" : lead.quality}
                    </Badge>
                    {lead.flagged && (
                      <Badge className="bg-purple-100 text-purple-700">Şüpheli</Badge>
                    )}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      <section className="flex-1 bg-white p-6">
        {!selected ? (
          <div className="flex flex-col items-center gap-2 pt-12 text-center text-sm text-slate-500">
            <MousePointerClick size={20} className="text-slate-300" />
            Görüntülemek için bir talep seçin.
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  {selected.name || "İsimsiz ziyaretçi"}
                </h2>
                <p className="text-sm text-slate-500">
                  {[selected.company, selected.email].filter(Boolean).join(" · ") ||
                    "Şirket/e-posta belirtilmedi"}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <Badge className="bg-slate-100 text-slate-600">
                    İlgi: {INTENT_LABELS[selected.intent]}
                  </Badge>
                  <Badge className="bg-slate-100 text-slate-600">
                    Trafik: {MONTHLY_VISITORS_LABELS[selected.monthlyVisitors]}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-2">
                {Object.values(LeadStatus).map((status) => (
                  <button
                    key={status}
                    disabled={isPending || selected.status === status}
                    onClick={() => {
                      setPendingStatus(status);
                      startTransition(() => updateLeadStatus(selected.id, status));
                    }}
                    className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                      selected.status === status
                        ? "border-brand-600 bg-brand-600 text-white"
                        : "border-slate-300 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {isPending && pendingStatus === status && (
                      <Loader2 size={12} className="animate-spin" />
                    )}
                    {STATUS_LABELS[status]}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-4">
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="flex items-center gap-1 text-xs text-slate-500">
                  <TrendingUp size={12} />
                  Lead score
                </p>
                <div className="mt-1">
                  {(() => {
                    const score = computeLeadScore(selected);
                    const tier = getLeadTier(score);
                    return (
                      <Badge className={LEAD_TIER_STYLES[tier]}>
                        {score} · {LEAD_TIER_LABEL[tier]}
                      </Badge>
                    );
                  })()}
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="flex items-center gap-1 text-xs text-slate-500">
                  <Flame size={12} />
                  Aciliyet
                </p>
                <div className="mt-1">
                  <Badge className={URGENCY_STYLES[selected.urgency]}>{selected.urgency}</Badge>
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="flex items-center gap-1 text-xs text-slate-500">
                  <Gauge size={12} />
                  Lead kalitesi
                </p>
                <div className="mt-1">
                  <Badge className={QUALITY_STYLES[selected.quality]}>{selected.quality}</Badge>
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="flex items-center gap-1 text-xs text-slate-500">
                  <Calendar size={12} />
                  Oluşturulma
                </p>
                <p className="mt-1 text-sm text-slate-700">{formatDate(selected.createdAt)}</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium uppercase text-slate-500">AI Özeti</p>
              <p className="mt-1 text-sm text-slate-800">{selected.reason}</p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase text-slate-500">
                Kalite değerlendirmesi (AI)
              </p>
              <p className="mt-1 text-sm text-slate-800">{selected.qualityNote}</p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase text-slate-500">Görüşme dökümü</p>
              <div className="mt-2 max-h-96 space-y-2 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3">
                {parseTranscript(selected.transcript).map((message, i) => (
                  <MessageBubble key={i} role={message.role} size="sm">
                    {message.content}
                  </MessageBubble>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
