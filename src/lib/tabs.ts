export type TabId = "map" | "experience" | "profile" | "articles" | "activities";

export const TABS: { id: TabId; label: string }[] = [
  { id: "map", label: "Map" },
  { id: "experience", label: "Work Experience" },
  { id: "profile", label: "Profile" },
  { id: "articles", label: "Articles" },
  { id: "activities", label: "Activities" },
];
