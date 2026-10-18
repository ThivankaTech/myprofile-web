import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}

export function Card({ children, className, padded = true }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-border bg-surface shadow-sm ${padded ? "p-6 sm:p-8" : ""} ${className ?? ""}`}
    >
      {children}
    </div>
  );
}
