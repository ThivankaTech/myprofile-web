"use client";

import { TABS, type TabId } from "@/lib/tabs";

interface NavbarProps {
  name: string;
  activeTab: TabId;
  onChangeTab: (tab: TabId) => void;
}

export function Navbar({ name, activeTab, onChangeTab }: NavbarProps) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-bg">
            {initial}
          </span>
          <span className="text-sm font-semibold text-fg">{name}</span>
        </div>

        <nav className="-mx-1 flex items-center gap-1 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TABS.map((tab) => {
            const active = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onChangeTab(tab.id)}
                className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-accent-soft text-accent"
                    : "text-fg-dim hover:bg-bg hover:text-fg"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
