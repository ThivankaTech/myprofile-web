"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { useMemo } from "react";

import { countryFlag } from "@/lib/countryFlag";
import { formatPeriod, isPresent, monthIndex } from "@/lib/dates";
import { RecommendationsCarousel } from "@/components/RecommendationsCarousel";
import type { Education, Recommendation, TravelDestination, WorkExperience } from "@/lib/profile";

// react-simple-maps computes marker positions via d3-geo trig functions
// that can differ by a fraction of a ULP between the server's and
// browser's math library, which React's hydration diffing treats as a
// mismatch. The map has no SEO value, so it's simplest and correct to skip
// SSR for it entirely rather than fight float-precision hydration noise.
const WorldMap = dynamic(
  () => import("@/components/map/WorldMap").then((mod) => mod.WorldMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center text-sm text-fg-dim">
        Loading globe…
      </div>
    ),
  },
);

interface MapTabProps {
  name: string;
  bio: string;
  homeCountry: string;
  currentCountry: string;
  workExperience: WorkExperience[];
  education: Education[];
  travelDestinations: TravelDestination[];
  recommendations: Recommendation[];
  linkedinUrl: string;
  selectedExperienceId: string | null;
  onSelectExperience: (id: string) => void;
  onSelectTravel: (id: string) => void;
}

interface TimelineItem {
  key: string;
  kind: "education" | "work";
  title: string;
  subtitle: string;
  place?: string;
  from: string;
  to: string;
  workId?: string;
  highlights: string[];
}

export function MapTab({
  bio,
  workExperience,
  education,
  travelDestinations,
  recommendations,
  linkedinUrl,
  selectedExperienceId,
  onSelectExperience,
  onSelectTravel,
}: MapTabProps) {
  const timeline = useMemo<TimelineItem[]>(() => {
    const items: TimelineItem[] = [
      ...education.map((edu) => ({
        key: `edu-${edu.institution}-${edu.from}`,
        kind: "education" as const,
        title: edu.degree,
        subtitle: edu.note ? `${edu.institution} · ${edu.note}` : edu.institution,
        from: edu.from,
        to: edu.to,
        highlights: [],
      })),
      ...workExperience.map((exp) => ({
        key: `work-${exp.id}`,
        kind: "work" as const,
        title: exp.role,
        subtitle: exp.company,
        place: `${exp.location.city}, ${exp.location.country}`,
        from: exp.from,
        to: exp.to,
        workId: exp.id,
        highlights: exp.projects.filter((p) => p.highlight).map((p) => p.name),
      })),
    ];
    return items.sort((a, b) => monthIndex(b.from) - monthIndex(a.from));
  }, [education, workExperience]);

  const photoCredits = useMemo(() => {
    const seen = new Map<string, { credit: string; url: string; place: string }>();
    for (const exp of workExperience) {
      const photo = exp.location.photo;
      if (photo?.credit && !seen.has(photo.src)) {
        seen.set(photo.src, { credit: photo.credit, url: photo.creditUrl, place: exp.location.city });
      }
    }
    return [...seen.values()];
  }, [workExperience]);

  const careerSpan = useMemo(() => {
    const starts = workExperience.map((exp) => exp.from.slice(0, 4)).sort();
    const ongoing = workExperience.some((exp) => isPresent(exp.to));
    const ends = workExperience.map((exp) => exp.to.slice(0, 4)).sort();
    return {
      start: starts[0] ?? "",
      end: ongoing ? "Present" : (ends[ends.length - 1] ?? ""),
    };
  }, [workExperience]);

  return (
    <div className="flex min-h-[80vh] w-full items-center justify-center overflow-x-clip px-4 py-10 sm:py-16">
      <div className="mx-auto flex w-full max-w-[1500px] flex-col items-center gap-12 lg:flex-row lg:gap-10">
        {/* Left: recommendations, then the globe */}
        <div className="flex w-full flex-col items-center lg:w-[58%]">
          <RecommendationsCarousel recommendations={recommendations} linkedinUrl={linkedinUrl} />
          <div className="relative mx-auto aspect-square w-[min(88vw,82vh)] touch-pan-y lg:w-[min(56vw,760px,82vh)]">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.6, delay: 0.2 }}
              className="pointer-events-none absolute -inset-12 rounded-full"
              style={{ background: "radial-gradient(closest-side, rgba(99,102,241,0.3), transparent 72%)" }}
            />
            <motion.div
              initial={{ scale: 0, opacity: 0, rotate: -10 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1] }}
              className="relative h-full w-full overflow-hidden rounded-full"
            >
              <WorldMap
                workExperience={workExperience}
                travelDestinations={travelDestinations}
                selectedExperienceId={selectedExperienceId}
                onSelectExperience={onSelectExperience}
                onSelectTravel={onSelectTravel}
              />
            </motion.div>
          </div>
          <p className="mt-4 text-center font-mono text-xs uppercase tracking-widest text-fg-dim">
            <span className="lg:hidden">tap a pin · use +/− to zoom</span>
            <span className="max-lg:hidden">drag to pan · scroll to zoom</span>
          </p>
          {photoCredits.length > 0 && (
            <p className="mt-2 max-w-md text-center text-[11px] leading-relaxed text-fg-dim/80">
              Photos:{" "}
              {photoCredits.map((c, i) => (
                <span key={c.place}>
                  {i > 0 && " · "}
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline decoration-dotted underline-offset-2 hover:text-accent"
                  >
                    {c.place}: {c.credit}
                  </a>
                </span>
              ))}
            </p>
          )}
        </div>

        {/* Right: story + timeline */}
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          className="w-full max-w-xl lg:w-[42%]"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-accent-soft px-3 py-1 font-mono text-xs uppercase tracking-widest text-accent">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            timeline.log
          </span>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-fg sm:text-4xl">
            <span className="text-travel">{careerSpan.start}</span> — <span className="text-accent">{careerSpan.end}</span>
          </h1>
          <p className="mt-3 text-sm text-fg-dim">{bio}</p>

          <ol className="relative mt-8 space-y-6 border-l border-border pl-7">
            {timeline.map((item, i) => {
              const current = isPresent(item.to);
              const isWork = item.kind === "work";
              const selected = isWork && item.workId === selectedExperienceId;
              const flag = item.place ? countryFlag(item.place.split(", ").pop() ?? "") : null;
              const body = (
                <>
                  <p className="font-mono text-[11px] uppercase tracking-widest text-fg-dim">
                    {formatPeriod(item.from, item.to)}
                    <span className="ml-2 text-accent">{isWork ? "// work" : "// education"}</span>
                  </p>
                  <p className="mt-1 font-semibold text-fg">{item.title}</p>
                  <p className="text-sm text-fg-dim">
                    {item.subtitle}
                    {item.place && (
                      <span className="text-fg-dim">
                        {" "}· {flag} {item.place}
                      </span>
                    )}
                  </p>
                  {item.highlights.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {item.highlights.map((text) => (
                        <span
                          key={text}
                          className="rounded-full border border-accent/60 bg-accent-soft px-2.5 py-0.5 text-xs font-medium text-accent shadow-[0_0_14px_rgba(129,140,248,0.3)]"
                        >
                          ★ {text}
                        </span>
                      ))}
                    </div>
                  )}
                </>
              );
              return (
                <motion.li
                  key={item.key}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.7 + i * 0.12 }}
                  className="relative"
                >
                  <span
                    className={`absolute -left-[34px] top-1.5 h-3 w-3 rounded-full border-2 ${
                      isWork ? "border-accent bg-bg" : "border-travel bg-bg"
                    } ${current ? "animate-pulse" : ""}`}
                    style={{
                      boxShadow: isWork
                        ? "0 0 12px rgba(129,140,248,0.9)"
                        : "0 0 10px rgba(245,158,11,0.7)",
                    }}
                  />
                  {isWork ? (
                    <button
                      type="button"
                      onClick={() => item.workId && onSelectExperience(item.workId)}
                      className={`w-full rounded-xl border p-3 text-left transition-colors hover:border-accent hover:bg-accent-soft ${
                        selected ? "border-accent bg-accent-soft" : "border-border bg-surface/70"
                      }`}
                    >
                      {body}
                      <p className="mt-2 font-mono text-[11px] text-accent">view projects →</p>
                    </button>
                  ) : (
                    <div className="rounded-xl border border-border bg-surface/40 p-3">{body}</div>
                  )}
                </motion.li>
              );
            })}
          </ol>
        </motion.div>
      </div>
    </div>
  );
}
