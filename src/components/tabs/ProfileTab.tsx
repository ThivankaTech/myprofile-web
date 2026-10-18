import { Card } from "@/components/Card";
import { formatPeriod } from "@/lib/dates";
import type { Education, SkillGroup } from "@/lib/profile";

interface ProfileTabProps {
  name: string;
  headline: string;
  bio: string;
  about: string;
  skills: SkillGroup[];
  homeCountry: string;
  currentCountry: string;
  education: Education[];
}

export function ProfileTab({
  name,
  headline,
  bio,
  about,
  skills,
  homeCountry,
  currentCountry,
  education,
}: ProfileTabProps) {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <h1 className="text-2xl font-semibold text-fg">{name}</h1>
        <p className="mt-1 font-medium text-accent">{headline}</p>
        <p className="mt-3 max-w-prose text-fg-dim">{bio}</p>
        <p className="mt-3 max-w-prose text-sm text-fg-dim">{about}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent">
            From {homeCountry}
          </span>
          <span className="rounded-full bg-travel-soft px-3 py-1 text-xs font-medium text-travel">
            Based in {currentCountry}
          </span>
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-fg-dim">Skills</h2>
        <dl className="mt-4 flex flex-col gap-4">
          {skills.map((group) => (
            <div key={group.category}>
              <dt className="text-sm font-medium text-fg">{group.category}</dt>
              <dd className="mt-1.5 flex flex-wrap gap-1.5">
                {group.items.map((item) => (
                  <span
                    key={item}
                    className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-medium text-accent"
                  >
                    {item}
                  </span>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-fg-dim">Education</h2>
        <ul className="mt-4 flex flex-col gap-4">
          {education.map((edu) => (
            <li
              key={`${edu.institution}-${edu.degree}-${edu.from}`}
              className="border-l-2 border-accent/30 pl-4"
            >
              <p className="text-xs text-fg-dim">
                {formatPeriod(edu.from, edu.to)}
              </p>
              <p className="font-medium text-fg">{edu.degree}</p>
              <p className="text-sm text-fg-dim">
                {edu.institution}
                {edu.note && ` · ${edu.note}`}
              </p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
