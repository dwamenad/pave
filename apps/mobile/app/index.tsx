import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useMobileAuth } from "@/src/auth/mobile-auth-context";

export default function IndexRoute() {
  const auth = useMobileAuth();

  if (!auth.ready) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f8fafc" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return <Redirect href={auth.signedIn ? "/(tabs)/home" : "/sign-in"} />;
}
