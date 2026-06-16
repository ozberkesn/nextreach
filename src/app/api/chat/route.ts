import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { isRateLimited } from "@/lib/rateLimit";
import {
  CHAT_MODEL,
  NUDGE_AFTER_USER_TURNS,
  SUBMIT_LEAD_TOOL,
  SYSTEM_PROMPT,
  chatRequestSchema,
  extractQuickReplies,
  submitLeadSchema,
} from "@/lib/chat";

export const dynamic = "force-dynamic";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Visitor sends the first message within this many ms of the widget
// mounting -> almost certainly a script, not a human reading the greeting.
const BOT_MIN_ELAPSED_MS = 1200;

// Catches the obvious junk (keyboard mashing, "test", all-digit strings)
// without trying to be a real spam classifier -- see README for the gap.
const SPAM_PATTERNS = [
  /^test+$/i,
  /^\d+$/,
  /^(.)\1{3,}$/i,
  /^([a-z]{2,4})\1{2,}$/i,
];

function looksLikeSpam(text: string): boolean {
  const trimmed = text.trim();
  return SPAM_PATTERNS.some((pattern) => pattern.test(trimmed));
}

function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() ?? "unknown";
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  if (isRateLimited(ip, { max: 30, windowMs: 10 * 60 * 1000 })) {
    return NextResponse.json(
      { type: "error", reply: "Çok fazla istek gönderildi, lütfen biraz sonra tekrar deneyin." },
      { status: 429 }
    );
  }

  const json = await req.json().catch(() => null);
  const parsed = chatRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { type: "error", reply: "Mesaj gönderilemedi, lütfen tekrar deneyin." },
      { status: 400 }
    );
  }

  const { messages, honeypot, elapsedMsAtFirstMessage } = parsed.data;
  const suspectedBot =
    Boolean(honeypot) ||
    (elapsedMsAtFirstMessage !== undefined && elapsedMsAtFirstMessage < BOT_MIN_ELAPSED_MS) ||
    messages.some((m) => m.role === "user" && looksLikeSpam(m.content));

  const userTurns = messages.filter((m) => m.role === "user").length;
  const system =
    userTurns >= NUDGE_AFTER_USER_TURNS
      ? `${SYSTEM_PROMPT}\n\nBu sohbet yeterince uzadı. Daha fazla soru sormadan, elindeki bilgiyle submit_lead fonksiyonunu çağırarak görüşmeyi sonlandır.`
      : SYSTEM_PROMPT;

  let response;
  try {
    response = await anthropic.messages.create({
      model: CHAT_MODEL,
      max_tokens: 1024,
      temperature: 0.5,
      system,
      tools: [SUBMIT_LEAD_TOOL],
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });
  } catch (error) {
    console.error("Anthropic request failed", error);
    return NextResponse.json(
      { type: "error", reply: "Şu anda bağlantı kuramadım, lütfen tekrar deneyin." },
      { status: 502 }
    );
  }

  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
  );

  if (toolUse && toolUse.name === "submit_lead") {
    const leadArgs = submitLeadSchema.safeParse(toolUse.input);

    if (leadArgs.success) {
      const lead = leadArgs.data;
      await prisma.lead.create({
        data: {
          name: lead.name,
          email: lead.email,
          company: lead.company,
          reason: lead.reason,
          urgency: lead.urgency,
          quality: lead.quality,
          qualityNote: lead.qualityNote,
          intent: lead.intent,
          monthlyVisitors: lead.monthlyVisitors,
          flagged: suspectedBot,
          transcript: [
            ...messages,
            { role: "assistant", content: lead.closingMessage },
          ],
        },
      });

      return NextResponse.json({ type: "closed", reply: lead.closingMessage });
    }

    console.error("submit_lead tool call failed validation", leadArgs.error.flatten());

    if (leadArgs.error.flatten().fieldErrors.email) {
      return NextResponse.json({
        type: "message",
        reply:
          "Ekibimizin size dönüş yapabilmesi için geçerli bir e-posta adresine ihtiyacımız var, paylaşabilir misiniz?",
      });
    }
  }

  const textBlock = response.content.find(
    (block): block is Anthropic.TextBlock => block.type === "text"
  );

  const { reply, quickReplies } = extractQuickReplies(
    textBlock?.text ?? "Üzgünüm, bunu anlayamadım. Tekrar yazabilir misin?"
  );

  return NextResponse.json({ type: "message", reply, quickReplies });
}
