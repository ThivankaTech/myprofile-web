import profileData from "@/data/profile.json";

export interface Location {
  city: string;
  country: string;
  lat: number;
  lng: number;
  photo: Image | null;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  techStack: string[];
  highlight: boolean;
}

export interface WorkExperience {
  id: string;
  company: string;
  role: string;
  summary: string;
  location: Location;
  from: string;
  to: string;
  projects: Project[];
}

export interface Education {
  institution: string;
  degree: string;
  from: string;
  to: string;
  note: string;
}

export interface SkillGroup {
  category: string;
  items: string[];
}

export interface Image {
  src: string;
  alt: string;
  focus: "left" | "center" | "right" | "";
  credit: string;
  creditUrl: string;
}

export interface Activity {
  id: string;
  title: string;
  category: string;
  featured: boolean;
  orientation: "landscape" | "portrait";
  description: string;
  tags: string[];
  images: Image[];
}

export interface Article {
  title: string;
  url: string;
  platform: string;
  published: string;
  readMinutes: number;
  tags: string[];
}

export interface Recommendation {
  name: string;
  title: string;
  relationship: string;
  date: string;
  text: string;
}

export interface TravelDestination {
  id: string;
  location: Location;
  year: string;
  note: string;
  images: Image[];
}

export interface Profile {
  name: string;
  headline: string;
  bio: string;
  about: string;
  homeCountry: string;
  currentCountry: string;
  skills: SkillGroup[];
  activities: Activity[];
  articles: Article[];
  articlesUrl: string;
  recommendations: Recommendation[];
  linkedinUrl: string;
  workExperience: WorkExperience[];
  education: Education[];
  travelDestinations: TravelDestination[];
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// Missing fields (older data) default to empty so pages never crash on undefined.
function withDefaults(raw: Partial<Profile> & Pick<Profile, "name">): Profile {
  return {
    headline: "",
    bio: "",
    about: "",
    homeCountry: "",
    currentCountry: "",
    skills: [],
    activities: [],
    articles: [],
    articlesUrl: "",
    recommendations: [],
    linkedinUrl: "",
    workExperience: [],
    education: [],
    travelDestinations: [],
    ...raw,
  };
}

// By default the profile comes from src/data/profile.json, generated from the
// Go backend's profile.json by `npm run sync-data` and bundled at build time,
// so a deployed site makes no API calls. Set NEXT_PUBLIC_API_URL (for example
// http://localhost:8080) to read from the running backend instead.
export async function getProfile(): Promise<Profile> {
  if (API_BASE_URL) {
    const res = await fetch(`${API_BASE_URL}/api/profile`, { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`profile API responded with ${res.status}`);
    }
    return withDefaults((await res.json()) as Profile);
  }
  return withDefaults(profileData as unknown as Profile);
}
