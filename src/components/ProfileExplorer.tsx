"use client";

import { useMemo, useState } from "react";

import { ExperienceModal } from "@/components/ExperienceModal";
import { Navbar } from "@/components/Navbar";
import { TravelModal } from "@/components/TravelModal";
import { ActivitiesTab } from "@/components/tabs/ActivitiesTab";
import { ArticlesTab } from "@/components/tabs/ArticlesTab";
import { MapTab } from "@/components/tabs/MapTab";
import { ProfileTab } from "@/components/tabs/ProfileTab";
import { WorkExperienceTab } from "@/components/tabs/WorkExperienceTab";
import type { Profile } from "@/lib/profile";
import type { TabId } from "@/lib/tabs";

interface ProfileExplorerProps {
  profile: Profile;
}

export function ProfileExplorer({ profile }: ProfileExplorerProps) {
  const [activeTab, setActiveTab] = useState<TabId>("map");
  const [selectedExperienceId, setSelectedExperienceId] = useState<string | null>(null);

  const [selectedTravelId, setSelectedTravelId] = useState<string | null>(null);

  const selectedTravel = useMemo(
    () => profile.travelDestinations.find((dest) => dest.id === selectedTravelId) ?? null,
    [profile.travelDestinations, selectedTravelId],
  );

  const selectedExperience = useMemo(
    () => profile.workExperience.find((exp) => exp.id === selectedExperienceId) ?? null,
    [profile.workExperience, selectedExperienceId],
  );

  const otherRoles = useMemo(
    () =>
      selectedExperience
        ? profile.workExperience.filter(
            (exp) => exp.company === selectedExperience.company && exp.id !== selectedExperience.id,
          )
        : [],
    [profile.workExperience, selectedExperience],
  );

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <Navbar name={profile.name} activeTab={activeTab} onChangeTab={setActiveTab} />

      <main
        className={
          activeTab === "map"
            ? "w-full flex-1 p-0"
            : "mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-6 sm:py-10"
        }
      >
        {activeTab === "map" && (
          <MapTab
            name={profile.name}
            bio={profile.bio}
            homeCountry={profile.homeCountry}
            currentCountry={profile.currentCountry}
            workExperience={profile.workExperience}
            education={profile.education}
            travelDestinations={profile.travelDestinations}
            recommendations={profile.recommendations}
            linkedinUrl={profile.linkedinUrl}
            selectedExperienceId={selectedExperienceId}
            onSelectExperience={setSelectedExperienceId}
            onSelectTravel={setSelectedTravelId}
          />
        )}

        {activeTab === "experience" && (
          <WorkExperienceTab
            workExperience={profile.workExperience}
            onSelectExperience={setSelectedExperienceId}
          />
        )}

        {activeTab === "profile" && (
          <ProfileTab
            name={profile.name}
            headline={profile.headline}
            bio={profile.bio}
            about={profile.about}
            skills={profile.skills}
            homeCountry={profile.homeCountry}
            currentCountry={profile.currentCountry}
            education={profile.education}
          />
        )}

        {activeTab === "articles" && (
          <ArticlesTab articles={profile.articles} profileUrl={profile.articlesUrl} />
        )}

        {activeTab === "activities" && (
          <ActivitiesTab
            activities={profile.activities}
            travelDestinations={profile.travelDestinations}
            onSelectTravel={setSelectedTravelId}
          />
        )}
      </main>

      <TravelModal destination={selectedTravel} onClose={() => setSelectedTravelId(null)} />
      <ExperienceModal
        experience={selectedExperience}
        otherRoles={otherRoles}
        onSelectRole={setSelectedExperienceId}
        onClose={() => setSelectedExperienceId(null)}
      />
    </div>
  );
}
