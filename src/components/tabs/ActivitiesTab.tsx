import Image from "next/image";

import { Card } from "@/components/Card";
import { withBasePath } from "@/lib/basePath";
import type { Activity, TravelDestination } from "@/lib/profile";

interface ActivitiesTabProps {
  activities: Activity[];
  travelDestinations: TravelDestination[];
  onSelectTravel: (id: string) => void;
}

function ActivityList({ list }: { list: Activity[] }) {
  if (list.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      {list.map((activity) => {
        const portrait = activity.orientation === "portrait";
        const count = activity.images.length;
        return (
          <Card key={activity.id} padded={false}>
            <div className={portrait ? "sm:flex" : ""}>
              {count > 0 && (
                <div
                  className={`grid gap-1 overflow-hidden ${
                    portrait
                      ? `max-sm:rounded-t-2xl sm:shrink-0 sm:rounded-l-2xl ${
                          count > 1 ? "grid-cols-2 sm:w-[27rem]" : "sm:w-72"
                        }`
                      : `rounded-t-2xl ${count > 1 ? "sm:grid-cols-2" : ""}`
                  }`}
                >
                  {activity.images.map((img, i) => (
                    <div
                      key={img.src}
                      className={`relative ${
                        portrait ? "aspect-[3/4] sm:h-full sm:min-h-80" : "aspect-[3/2]"
                      }`}
                    >
                      <Image
                        src={withBasePath(img.src)}
                        alt={img.alt}
                        fill
                        priority={i === 0}
                        sizes={portrait ? "(min-width: 640px) 216px, 50vw" : "(min-width: 896px) 440px, 100vw"}
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
              <div className="p-6 sm:p-8">
                <p className="text-xs font-medium uppercase tracking-wide text-travel">
                  {activity.category}
                </p>
                <h2 className="mt-1 text-xl font-semibold text-fg">{activity.title}</h2>
                <p className="mt-3 max-w-prose text-fg-dim">{activity.description}</p>
                {activity.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {activity.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-travel-soft px-2.5 py-0.5 text-xs font-medium text-travel"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

export function ActivitiesTab({ activities, travelDestinations, onSelectTravel }: ActivitiesTabProps) {
  return (
    <div className="flex flex-col gap-10">
      <ActivityList list={activities.filter((a) => a.featured)} />

      {travelDestinations.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-fg-dim">Travel</h2>
          <div className="mt-4 grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
            {travelDestinations.map((dest) => {
              const photo = dest.images[0];
              const body = (
                <>
                  {photo && (
                    <div className="relative aspect-[4/3] overflow-hidden rounded-t-2xl">
                      <Image
                        src={withBasePath(photo.src)}
                        alt={photo.alt}
                        fill
                        sizes="(min-width: 896px) 440px, 100vw"
                        className="object-cover object-[50%_50%]"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    {dest.year && (
                      <p className="text-xs font-medium uppercase tracking-wide text-travel">{dest.year}</p>
                    )}
                    <p className="mt-1 text-lg font-semibold text-fg">
                      {dest.location.city}, {dest.location.country}
                    </p>
                    {dest.note && <p className="mt-2 text-sm text-fg-dim">{dest.note}</p>}
                  </div>
                </>
              );
              return (
                <Card key={dest.id} padded={false}>
                  {photo ? (
                    <button
                      type="button"
                      onClick={() => onSelectTravel(dest.id)}
                      className="block w-full rounded-2xl text-left transition-colors hover:bg-bg"
                    >
                      {body}
                    </button>
                  ) : (
                    body
                  )}
                </Card>
              );
            })}
          </div>
        </section>
      )}

      <ActivityList list={activities.filter((a) => !a.featured)} />
    </div>
  );
}
