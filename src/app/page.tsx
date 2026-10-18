import { ProfileExplorer } from "@/components/ProfileExplorer";
import { getProfile } from "@/lib/profile";

export default async function Home() {
  const profile = await getProfile();

  return <ProfileExplorer profile={profile} />;
}
