"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";

import { formatPeriod } from "@/lib/dates";
import type { WorkExperience } from "@/lib/profile";

interface ExperienceModalProps {
  experience: WorkExperience | null;
  otherRoles: WorkExperience[];
  onSelectRole: (id: string) => void;
  onClose: () => void;
}

export function ExperienceModal({ experience, otherRoles, onSelectRole, onClose }: ExperienceModalProps) {
  useEffect(() => {
    if (!experience) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [experience, onClose]);

  return (
    <AnimatePresence>
      {experience && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`${experience.role} at ${experience.company}`}
            className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-2xl bg-surface p-6 shadow-2xl sm:p-8"
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-fg-dim">
                  {formatPeriod(experience.from, experience.to)} · {experience.location.city},{" "}
                  {experience.location.country}
                </p>
                <h2 className="mt-1 text-xl font-semibold text-fg">{experience.role}</h2>
                <p className="text-sm font-medium text-accent">{experience.company}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="rounded-full p-1.5 text-fg-dim transition-colors hover:bg-bg hover:text-fg"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {otherRoles.length > 0 && (
              <div className="mt-5">
                <p className="text-xs font-medium uppercase tracking-wide text-fg-dim">
                  Other roles at {experience.company}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {otherRoles.map((role) => (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => onSelectRole(role.id)}
                      className="rounded-full border border-border px-3 py-1 text-left text-xs text-fg-dim transition-colors hover:border-accent hover:text-accent"
                    >
                      {formatPeriod(role.from, role.to)} · {role.role}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <ul className="mt-6 space-y-5">
              {[...experience.projects]
                .sort((a, b) => Number(b.highlight) - Number(a.highlight))
                .map((project) => (
                <li
                  key={project.id}
                  className={`rounded-xl border p-4 ${
                    project.highlight
                      ? "border-accent bg-accent-soft shadow-[0_0_24px_rgba(129,140,248,0.25)]"
                      : "border-border bg-bg"
                  }`}
                >
                  {project.highlight && (
                    <p className="mb-1 font-mono text-[11px] uppercase tracking-widest text-accent">
                      ★ Highlight
                    </p>
                  )}
                  <p className="font-medium text-fg">{project.name}</p>
                  <p className="mt-1 text-sm text-fg-dim">{project.description}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {project.techStack.map((tech) => (
                      <span
                        key={tech}
                        className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-medium text-accent"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
