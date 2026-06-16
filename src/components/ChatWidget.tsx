"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, X } from "lucide-react";

import { INITIAL_GREETING, INITIAL_QUICK_REPLIES, MAX_MESSAGE_LENGTH } from "@/lib/chatShared";
import { Button } from "@/components/ui/Button";
import { MessageBubble } from "@/components/ui/MessageBubble";

type Message = { role: "user" | "assistant"; content: string };
type ChatResponse = { type: "message" | "closed" | "error"; reply: string; quickReplies?: string[] };

export function ChatWidget({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>(() => [
    { role: "assistant", content: INITIAL_GREETING },
  ]);
  const [input, setInput] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [sending, setSending] = useState(false);
  const [closed, setClosed] = useState(false);
  const [activeQuickReplies, setActiveQuickReplies] = useState<string[] | null>(
    INITIAL_QUICK_REPLIES
  );

  const openedAtRef = useRef<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  // setSending(true) doesn't commit until the next render, so a double
  // click/Enter fired in the same tick would both read the stale `sending`
  // value and slip past the guard below -- this ref blocks synchronously.
  const sendingRef = useRef(false);

  // Record the moment the visitor actually opens the panel (not page load),
  // used as a bot heuristic: a real person needs a beat to read and reply.
  useEffect(() => {
    if (open && openedAtRef.current === null) {
      openedAtRef.current = Date.now();
    }
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  async function sendMessage(overrideContent?: string) {
    const content = (overrideContent ?? input).trim();
    if (!content || sendingRef.current || closed) return;
    sendingRef.current = true;

    const isFirstUserMessage = !messages.some((m) => m.role === "user");
    const elapsedMsAtFirstMessage = isFirstUserMessage
      ? Date.now() - (openedAtRef.current ?? Date.now())
      : undefined;

    const updated: Message[] = [...messages, { role: "user", content }];
    setMessages(updated);
    setInput("");
    setSending(true);
    setActiveQuickReplies(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updated, honeypot, elapsedMsAtFirstMessage }),
      });
      const data: ChatResponse = await res.json();

      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      if (data.type === "closed") setClosed(true);
      setActiveQuickReplies(data.quickReplies ?? null);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Bağlantı kurulamadı, lütfen tekrar deneyin." },
      ]);
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  }

  function resetConversation() {
    openedAtRef.current = Date.now();
    setMessages([{ role: "assistant", content: INITIAL_GREETING }]);
    setClosed(false);
    setInput("");
    setActiveQuickReplies(INITIAL_QUICK_REPLIES);
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end justify-end transition-opacity sm:p-6 ${
        open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      }`}
      aria-hidden={!open}
    >
      <button
        aria-label="Sohbeti kapat"
        onClick={onClose}
        className="absolute inset-0 cursor-pointer bg-slate-900/20 sm:hidden"
      />

      <div
        className={`relative flex h-full w-full flex-col bg-white transition-all duration-200 sm:h-[600px] sm:w-96 sm:rounded-2xl sm:shadow-2xl ${
          open ? "sm:translate-y-0 sm:scale-100" : "sm:translate-y-4 sm:scale-95"
        }`}
      >
        <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-brand-600">
              <MessageCircle size={16} />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">Reach · NextReach Asistanı</p>
              <p className="text-xs text-slate-500">Genelde birkaç dakika içinde yanıtlar</p>
            </div>
          </div>
          <button
            aria-label="Sohbeti kapat"
            onClick={onClose}
            className="cursor-pointer rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </header>

        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.map((m, i) => (
            <MessageBubble key={i} role={m.role} className="animate-[message-in_0.25s_ease-out]">
              {m.content}
            </MessageBubble>
          ))}
          {sending && (
            <div className="flex w-fit items-center gap-1 rounded-2xl bg-slate-100 px-4 py-3">
              <span className="h-1.5 w-1.5 animate-[typing-bounce_1.2s_ease-in-out_infinite] rounded-full bg-slate-400" />
              <span className="h-1.5 w-1.5 animate-[typing-bounce_1.2s_ease-in-out_infinite] rounded-full bg-slate-400 [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-[typing-bounce_1.2s_ease-in-out_infinite] rounded-full bg-slate-400 [animation-delay:-0.3s]" />
            </div>
          )}
        </div>

        {!closed && !sending && activeQuickReplies && (
          <div className="flex flex-wrap gap-2 border-t border-slate-200 p-3">
            {activeQuickReplies.map((option) => (
              <Button
                key={option}
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => sendMessage(option)}
              >
                {option}
              </Button>
            ))}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="border-t border-slate-200 p-3"
        >
          {/* Honeypot: invisible to people, irresistible to form-filling bots. */}
          <div className="absolute -left-[9999px]" aria-hidden="true">
            <label htmlFor="website">Website</label>
            <input
              id="website"
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </div>

          {closed ? (
            <button
              type="button"
              onClick={resetConversation}
              className="w-full cursor-pointer rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200"
            >
              Yeni bir görüşme başlat
            </button>
          ) : (
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value.slice(0, MAX_MESSAGE_LENGTH))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Mesajını yaz..."
                rows={1}
                maxLength={MAX_MESSAGE_LENGTH}
                disabled={sending}
                className="flex-1 resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:bg-slate-50"
              />
              <Button type="submit" variant="primary" size="sm" disabled={sending || !input.trim()}>
                Gönder
              </Button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
