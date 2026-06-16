// Constants safe to import from both client components and server code.
// Anything that pulls in the Anthropic SDK or server secrets belongs in chat.ts instead.

export const MAX_MESSAGE_LENGTH = 1000;
export const MAX_MESSAGES_PER_CONVERSATION = 50;

export const INITIAL_GREETING =
  "Merhaba! Ben Reach, NextReach'in dijital asistanıyım. Size doğru şekilde yardımcı olabilmem için birkaç kısa soru soracağım, sadece birkaç dakikanızı alır. Bize ulaşma sebebiniz nedir?";

export const INITIAL_QUICK_REPLIES = [
  "Fiyat bilgisi",
  "Demo talebi",
  "Ürün hakkında bilgi",
  "Diğer",
];
