import type { ReactNode } from "react";

type BubbleSize = "sm" | "default";

const SIZE_STYLES: Record<BubbleSize, string> = {
  default: "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm",
  sm: "max-w-[85%] rounded-lg px-3 py-2 text-sm",
};

const ASSISTANT_STYLES: Record<BubbleSize, string> = {
  default: "bg-slate-100 text-slate-800",
  sm: "bg-white text-slate-800",
};

export function MessageBubble({
  role,
  size = "default",
  className = "",
  children,
}: {
  role: "user" | "assistant";
  size?: BubbleSize;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`${SIZE_STYLES[size]} ${
        role === "user" ? "ml-auto bg-brand-600 text-white" : ASSISTANT_STYLES[size]
      } ${className}`}
    >
      {children}
    </div>
  );
}
