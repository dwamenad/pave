import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const TINT = "#13b6ec";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: TINT,
        tabBarInactiveTintColor: "#94a3b8",
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
          letterSpacing: 0.4,
          textTransform: "uppercase"
        },
        tabBarStyle: {
          borderTopColor: "#e2e8f0",
          backgroundColor: "#ffffffF2",
          height: 74,
          paddingBottom: 10,
          paddingTop: 8,
          borderTopWidth: 1
        }
      }}
      backBehavior="history"
    >
      <Tabs.Screen
        name="feed"
        options={{
          title: "Explore",
          tabBarIcon: ({ color, size }) => <Ionicons name="compass-outline" color={color} size={size} />
        }}
      />
      <Tabs.Screen
        name="home"
        options={{
          title: "Nearby",
          tabBarIcon: ({ color, size }) => <Ionicons name="location-outline" color={color} size={size} />
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: "Create",
          tabBarIcon: ({ color, size }) => <Ionicons name="add-circle-outline" color={color} size={size} />
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <Ionicons name="person-circle-outline" color={color} size={size} />
        }}
      />
    </Tabs>
  );
}
