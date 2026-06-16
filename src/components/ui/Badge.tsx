import type { ReactNode } from "react";

export function Badge({ className, children }: { className: string; children: ReactNode }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>
      {children}
    </span>
  );
}
