import { Card } from "@/components/Card";
import { DownloadCvButton } from "@/components/DownloadCvButton";
import { formatPeriod } from "@/lib/dates";
import type { WorkExperience } from "@/lib/profile";

interface WorkExperienceTabProps {
  workExperience: WorkExperience[];
  onSelectExperience: (id: string) => void;
}

export function WorkExperienceTab({ workExperience, onSelectExperience }: WorkExperienceTabProps) {
  return (
    <div className="flex flex-col gap-4">
      <DownloadCvButton className="self-start" />
      {workExperience.map((exp) => (
        <Card key={exp.id} padded={false}>
          <button
            type="button"
            onClick={() => onSelectExperience(exp.id)}
            className="flex w-full flex-col gap-1 p-6 text-left transition-colors hover:bg-bg sm:p-8"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-fg-dim">
              {formatPeriod(exp.from, exp.to)} · {exp.location.city}, {exp.location.country}
            </p>
            <p className="text-lg font-semibold text-fg">{exp.role}</p>
            <p className="text-sm font-medium text-accent">{exp.company}</p>
            {exp.summary && <p className="mt-2 text-sm text-fg-dim">{exp.summary}</p>}
            {exp.projects.some((p) => p.highlight) && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {exp.projects
                  .filter((p) => p.highlight)
                  .map((p) => (
                    <span
                      key={p.id}
                      className="rounded-full border border-accent/60 bg-accent-soft px-2.5 py-0.5 text-xs font-medium text-accent shadow-[0_0_14px_rgba(129,140,248,0.3)]"
                    >
                      ★ {p.name}
                    </span>
                  ))}
              </div>
            )}
            <p className="mt-2 text-sm text-accent">
              {exp.projects.length} highlight{exp.projects.length === 1 ? "" : "s"} — view details
            </p>
          </button>
        </Card>
      ))}
    </div>
  );
}
