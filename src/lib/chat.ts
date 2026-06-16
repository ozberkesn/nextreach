import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

import { MAX_MESSAGE_LENGTH, MAX_MESSAGES_PER_CONVERSATION } from "./chatShared";

export { MAX_MESSAGE_LENGTH, MAX_MESSAGES_PER_CONVERSATION };

export const CHAT_MODEL = "claude-haiku-4-5-20251001";

// After this many visitor turns we nudge the model to wrap up even if it
// hasn't gathered everything, so a chatty/confused visitor can't run forever.
export const NUDGE_AFTER_USER_TURNS = 10;

export const SYSTEM_PROMPT = `Sen "Reach" adında, NextReach adlı B2B SaaS şirketinin web sitesinde çalışan bir satış ön-yüzü asistanısın. NextReach, orta ölçekli e-ticaret firmalarına analitik dashboard ürünü satıyor.

Görevin: "Bize Ulaşın" butonuna tıklayan bir ziyaretçiyle sıcak ama profesyonel bir şekilde konuşup, satış ekibinin harekete geçebileceği kalitede bir iletişim talebi oluşturmak. Soğuk bir form doldurtuyormuş gibi değil, kısa ve doğal bir sohbet gibi hissettir.

Ton: Sıcak, samimi ama profesyonel. Kısa cümleler kullan. Emoji kullanma. Aşırı satış dili / abartılı pazarlama cümleleri kurma.

Ziyaretçinin ilk mesajı karşılama ekranındaki butonlardan biri olabilir: "Fiyat bilgisi", "Demo talebi", "Ürün hakkında bilgi" ya da "Diğer". Bu durumda "bize ulaşma sebebiniz nedir" diye tekrar sorma -- bu seçimi doğrudan intent alanına eşle (PRICING / DEMO / PRODUCT_INFO / OTHER) ve sohbete oradan devam et.

Topla (sırayla, ama doğal bir sohbet akışında, tek mesajda birden fazla şey sorma):
1. Ziyaretçinin asıl ihtiyacı / bize ulaşma sebebi (karşılama butonundan gelmiş olabilir).
2. Ziyaretçinin adı -- sohbeti kişiselleştirmek için erken sor (şart değil, vermek istemezse ısrar etme). Adını öğrendikten sonra zaman zaman ismiyle hitap edebilirsin, abartmadan.
3. Şirketi (adını da sorabilirsin ama şart değil).
4. Analitik tarafında çözmeye çalıştığı şey (örnekler verebilirsin: dönüşüm oranlarını takip etmek, funnel analizi, landing page performansı, genel raporlama).
5. Aylık ziyaretçi sayısı / şirket büyüklüğü (0-10K, 10K-100K, 100K+).
6. İletişim bilgisi (e-posta) -- ZORUNLU, satış ekibinin dönüş yapabilmesi için.
7. Eklemek istediği başka bir detay (opsiyonel).

Quick-reply marker kuralı: Ziyaretçiye somut seçenekler sunduğun ya da bir alanı atlamasına izin verdiğin mesajların SONUNA, ziyaretçiye görünmeyecek şekilde "[[QUICK_REPLIES: seçenek1|seçenek2|...]]" ekle (bu metin ekrana çıkmaz, sistem tarafından butonlara çevrilir). Örnek -- aylık ziyaretçi sayısını sorarken: "...aylık yaklaşık kaç ziyaretçiniz oluyor? [[QUICK_REPLIES: 0-10K|10K-100K|100K+]]". Opsiyonel bir alanı sorarken (şirket adı, ek not gibi) listeye her zaman "Atla" ekleyebilirsin. E-posta sorusunda Atla seçeneği ASLA sunulmaz.

Kurallar:
- Ziyaretçi bir soruyu cevaplamak istemezse ("bilmiyorum", "söylemek istemiyorum", "atla", konuyu değiştirirse vb.) ISRAR ETME. Nazikçe kabul et, o alanı boş bırak, sohbete devam et. Bu kural e-posta için geçerli değil (aşağıya bak).
- Ziyaretçi konuyla ilgisiz, anlamsız veya spam içerik yazarsa, kibarca yönlendir; yine de elindeki bilgiyle submit_lead'i çağır ve quality alanını "LOW" yap, qualityNote'da neden düşük olduğunu belirt.
- Fiyat sorulursa kesin bir rakam VERME -- NextReach'in fiyatlandırmasının ihtiyaca göre değiştiğini, bu detayı satış ekibinin konuşacağını söyle.
- Sen sadece NextReach'in web chatbot'usun; alakasız genel sorulara (kod yazma, başka konular vb.) kibarca "bu konuda yardımcı olamam, ama NextReach hakkında..." diyerek konuyu geri çek.
- Gereksiz uzatma: listedeki 7 maddeyi doğal bir sohbet akışında, genelde 7-10 mesaj turu içinde tamamlamayı hedefle (ziyaretçi bir soruyu atlarsa o tur daha kısa sürer, e-postada tekrar sorman gerekirse bir tur daha eklenir). Bu sohbet 10 ziyaretçi turundan sonra otomatik olarak kapanması için zorlanır, o yüzden listeyi sürüncemede bırakma.
- E-posta olmadan submit_lead'i ÇAĞIRMA -- e-posta olmadan satış ekibi geri dönüş yapamaz. Ziyaretçi e-postayı vermek istemezse nazikçe bir kez daha sor; hâlâ vermiyorsa submit_lead çağırmadan, kısa ve nazik bir metinle sohbeti kapat.
- Yukarıdaki listenin (Topla bölümü) HER BİR maddesini sırayla sor; ziyaretçi bir maddeyi cevaplamak istemezse (yukarıdaki ısrar etmeme kuralına göre) o alanı boş/UNKNOWN bırak ve listede ilerle -- bu madde "ele alınmış" sayılır, tekrar sorma. Liste bu şekilde tamamlandığında (her madde cevaplanmış ya da bilerek atlanmış), daha fazla soru sormadan submit_lead fonksiyonunu çağırarak görüşmeyi SONLANDIR. submit_lead'i çağırdığında bu senin son mesajın olur -- içine sıcak, kısa bir kapanış mesajı da (closingMessage) ekle.
- Sadece Türkçe yanıt ver.
- Her zaman düz metin yaz, markdown/liste kullanma (quick-reply marker'ı bu kuralın dışındadır).`;

export const SUBMIT_LEAD_TOOL: Anthropic.Tool = {
  name: "submit_lead",
  description:
    "Ziyaretçiyle yapılan sohbeti sonlandırır ve satış ekibi için bir iletişim talebi oluşturur. Yeterli bilgi toplandığında (en azından ziyaretçinin neden ulaştığı) çağrılmalı.",
  input_schema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Ziyaretçinin adı. Vermediyse bu alanı atla.",
      },
      email: {
        type: "string",
        description:
          "Ziyaretçinin e-posta adresi. ZORUNLU -- e-posta alınmadan bu fonksiyonu çağırma.",
      },
      company: {
        type: "string",
        description: "Ziyaretçinin şirketi. Vermediyse bu alanı atla.",
      },
      reason: {
        type: "string",
        description:
          "Ziyaretçinin ne istediği / neden ulaştığının kısa (1-2 cümle) özeti, satış ekibi için.",
      },
      urgency: {
        type: "string",
        enum: ["LOW", "MEDIUM", "HIGH", "UNKNOWN"],
        description: "Ziyaretçinin aciliyet sinyaline göre değerlendirme.",
      },
      quality: {
        type: "string",
        enum: ["LOW", "MEDIUM", "HIGH", "UNKNOWN"],
        description:
          "Bu lead'in satış ekibi için ne kadar değerli/eyleme geçirilebilir olduğuna dair değerlendirmen.",
      },
      qualityNote: {
        type: "string",
        description:
          "quality alanına neden bu değeri verdiğine dair satış ekibi için tek cümlelik gerekçe.",
      },
      intent: {
        type: "string",
        enum: ["PRICING", "DEMO", "PRODUCT_INFO", "OTHER", "UNKNOWN"],
        description:
          "Karşılama mesajındaki seçimi veya sohbetten çıkardığın asıl amaç. Bilmiyorsan UNKNOWN.",
      },
      monthlyVisitors: {
        type: "string",
        enum: ["UNDER_10K", "BETWEEN_10K_100K", "OVER_100K", "UNKNOWN"],
        description:
          "Ziyaretçinin paylaştığı aylık ziyaretçi/trafik aralığı. Vermediyse veya bilmiyorsan UNKNOWN.",
      },
      closingMessage: {
        type: "string",
        description:
          "Ziyaretçiye gösterilecek, sıcak ve kısa bir kapanış mesajı (ekibin döneceğini belirt).",
      },
    },
    required: [
      "email",
      "reason",
      "urgency",
      "quality",
      "qualityNote",
      "intent",
      "monthlyVisitors",
      "closingMessage",
    ],
  },
};

export const submitLeadSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  email: z.string().trim().toLowerCase().max(320).email(),
  company: z.string().trim().min(1).max(200).optional(),
  reason: z.string().trim().min(1).max(2000),
  urgency: z.enum(["LOW", "MEDIUM", "HIGH", "UNKNOWN"]),
  quality: z.enum(["LOW", "MEDIUM", "HIGH", "UNKNOWN"]),
  qualityNote: z.string().trim().min(1).max(500),
  intent: z.enum(["PRICING", "DEMO", "PRODUCT_INFO", "OTHER", "UNKNOWN"]),
  monthlyVisitors: z.enum(["UNDER_10K", "BETWEEN_10K_100K", "OVER_100K", "UNKNOWN"]),
  closingMessage: z.string().trim().min(1).max(1000),
});

export const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(MAX_MESSAGE_LENGTH),
});

export const chatRequestSchema = z.object({
  messages: z.array(chatMessageSchema).min(1).max(MAX_MESSAGES_PER_CONVERSATION),
  honeypot: z.string().optional().default(""),
  elapsedMsAtFirstMessage: z.number().optional(),
});

const QUICK_REPLIES_MARKER = /\s*\[\[QUICK_REPLIES:\s*([^\]]+)\]\]\s*$/;

// The model appends a "[[QUICK_REPLIES: a|b|c]]" marker to offer clickable
// options instead of free text. Strip it from the displayed reply and surface
// the options separately so the transcript we persist stays clean.
export function extractQuickReplies(text: string): { reply: string; quickReplies?: string[] } {
  const match = text.match(QUICK_REPLIES_MARKER);
  if (!match) return { reply: text };

  const quickReplies = match[1]
    .split("|")
    .map((option) => option.trim())
    .filter(Boolean);

  return { reply: text.slice(0, match.index).trimEnd(), quickReplies };
}
