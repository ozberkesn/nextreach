// Pure scoring logic, safe to import from client components -- no Anthropic
// SDK, no Prisma client, just plain TS. See Intent/MonthlyVisitors/Quality
// enums in @/generated/prisma/enums for the literal values used here.

const FREE_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "icloud.com",
  "live.com",
  "aol.com",
  "protonmail.com",
]);

export function isFreeEmailDomain(email: string | null | undefined): boolean {
  if (!email) return false;
  const domain = email.split("@")[1]?.toLowerCase();
  return Boolean(domain && FREE_EMAIL_DOMAINS.has(domain));
}

type ScorableLead = {
  email: string | null;
  intent: "PRICING" | "DEMO" | "PRODUCT_INFO" | "OTHER" | "UNKNOWN";
  monthlyVisitors: "UNDER_10K" | "BETWEEN_10K_100K" | "OVER_100K" | "UNKNOWN";
  quality: "LOW" | "MEDIUM" | "HIGH" | "UNKNOWN";
  flagged: boolean;
};

export function computeLeadScore(lead: ScorableLead): number {
  let score = 0;
  if (lead.email && !isFreeEmailDomain(lead.email)) score += 20;
  if (lead.intent === "DEMO") score += 20;
  if (lead.monthlyVisitors === "OVER_100K") score += 30;
  if (lead.quality === "HIGH") score += 20;
  if (lead.flagged) score -= 20;
  return Math.max(0, Math.min(100, score));
}

export type LeadTier = "HOT" | "WARM" | "COLD";

export function getLeadTier(score: number): LeadTier {
  if (score >= 70) return "HOT";
  if (score >= 40) return "WARM";
  return "COLD";
}

export const LEAD_TIER_LABEL: Record<LeadTier, string> = {
  HOT: "Hot Lead",
  WARM: "Warm Lead",
  COLD: "Cold Lead",
};

export const LEAD_TIER_STYLES: Record<LeadTier, string> = {
  HOT: "bg-red-100 text-red-700",
  WARM: "bg-amber-100 text-amber-700",
  COLD: "bg-slate-100 text-slate-500",
};
