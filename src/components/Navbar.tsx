"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { TABS, type TabId } from "@/lib/tabs";

interface NavbarProps {
  name: string;
  activeTab: TabId;
  onChangeTab: (tab: TabId) => void;
}

const FADE = "28px";
const EMAIL = "thivanka.saranathapro@gmail.com";

export function Navbar({ name, activeTab, onChangeTab }: NavbarProps) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  const navRef = useRef<HTMLElement>(null);
  const [fade, setFade] = useState({ left: false, right: false });

  const updateFade = useCallback(() => {
    const el = navRef.current;
    if (!el) return;
    setFade({
      left: el.scrollLeft > 4,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
    });
  }, []);

  useEffect(() => {
    updateFade();
    const el = navRef.current;
    if (!el) return;
    const observer = new ResizeObserver(updateFade);
    observer.observe(el);
    return () => observer.disconnect();
  }, [updateFade]);

  useEffect(() => {
    const active = navRef.current?.querySelector<HTMLElement>('[aria-current="page"]');
    active?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [activeTab]);

  // Fade the edge that has more tabs beyond it, so a cut-off tab reads as
  // "scroll for more" instead of looking like it doesn't exist.
  const mask = `linear-gradient(to right, ${fade.left ? "transparent" : "black"} 0, black ${
    fade.left ? FADE : "0px"
  }, black calc(100% - ${fade.right ? FADE : "0px"}), ${fade.right ? "transparent" : "black"} 100%)`;

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-bg">
            {initial}
          </span>
          <span className="text-sm font-semibold text-fg">{name}</span>
          <a
            href={`mailto:${EMAIL}`}
            className="text-xs text-fg-dim transition-colors hover:text-accent hover:underline"
          >
            {EMAIL}
          </a>
        </div>

        <nav
          ref={navRef}
          onScroll={updateFade}
          style={{ maskImage: mask, WebkitMaskImage: mask }}
          className="-mx-1 flex items-center gap-1 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {TABS.map((tab) => {
            const active = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                aria-current={active ? "page" : undefined}
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
