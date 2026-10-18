"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

import { formatDate } from "@/lib/dates";
import type { Recommendation } from "@/lib/profile";

interface RecommendationsCarouselProps {
  recommendations: Recommendation[];
  linkedinUrl: string;
}

const AUTO_ADVANCE_MS = 10000;

export function RecommendationsCarousel({ recommendations, linkedinUrl }: RecommendationsCarouselProps) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [expanded, setExpanded] = useState(false);
  const [paused, setPaused] = useState(false);
  const reduceMotion = useReducedMotion();

  const count = recommendations.length;

  function go(step: number) {
    setDirection(step);
    setExpanded(false);
    setIndex((i) => (i + step + count) % count);
  }

  useEffect(() => {
    if (count < 2 || paused || expanded || reduceMotion) return;
    const timer = setTimeout(() => {
      setDirection(1);
      setIndex((i) => (i + 1) % count);
    }, AUTO_ADVANCE_MS);
    return () => clearTimeout(timer);
  }, [index, count, paused, expanded, reduceMotion]);

  if (count === 0) return null;
  const rec = recommendations[index];
  const paragraphs = rec.text.split(/\n\s*\n/);

  return (
    <section
      aria-label="Recommendations"
      className="mb-8 w-full max-w-xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="mb-2 flex items-center justify-between gap-2 font-mono text-[11px] uppercase tracking-widest">
        <span className="text-fg-dim">★ What colleagues say</span>
        {linkedinUrl && (
          <a
            href={linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            LinkedIn profile ↗
          </a>
        )}
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-border bg-surface/80 shadow-[0_0_30px_rgba(99,102,241,0.15)]">
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.figure
            key={index}
            custom={direction}
            initial={{ opacity: 0, x: reduceMotion ? 0 : 48 * direction }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: reduceMotion ? 0 : -48 * direction }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="p-5"
          >
            <blockquote
              className={`space-y-2 text-sm leading-relaxed text-fg ${
                expanded ? "max-h-64 overflow-y-auto pr-1" : "line-clamp-5"
              }`}
            >
              {paragraphs.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </blockquote>
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              className="mt-2 font-mono text-[11px] uppercase tracking-widest text-accent hover:underline"
            >
              {expanded ? "show less" : "read more"}
            </button>
            <figcaption className="mt-4 border-t border-border pt-3">
              <p className="text-sm font-semibold text-fg">{rec.name}</p>
              <p className="text-xs text-fg-dim">{rec.title}</p>
              <p className="mt-0.5 text-xs text-fg-dim">
                {formatDate(rec.date)}
                {rec.relationship && ` · ${rec.relationship}`}
              </p>
            </figcaption>
          </motion.figure>
        </AnimatePresence>
      </div>

      {count > 1 && (
        <div className="mt-3 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous recommendation"
            className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-fg-dim transition-colors hover:border-accent hover:text-accent"
          >
            ‹
          </button>
          <div className="flex gap-1.5">
            {recommendations.map((r, i) => (
              <button
                key={r.name}
                type="button"
                aria-label={`Show recommendation from ${r.name}`}
                aria-current={i === index}
                onClick={() => {
                  setDirection(i > index ? 1 : -1);
                  setExpanded(false);
                  setIndex(i);
                }}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-6 bg-accent" : "w-1.5 bg-border hover:bg-fg-dim"
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next recommendation"
            className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-fg-dim transition-colors hover:border-accent hover:text-accent"
          >
            ›
          </button>
        </div>
      )}
    </section>
  );
}
