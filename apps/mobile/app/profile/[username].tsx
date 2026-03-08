import { useLocalSearchParams } from "expo-router";
import { ProfileScreen } from "@/src/features/profile-screen";

export default function PublicProfileScreen() {
  const params = useLocalSearchParams<{ username: string }>();
  return <ProfileScreen initialUsername={params.username} />;
}
