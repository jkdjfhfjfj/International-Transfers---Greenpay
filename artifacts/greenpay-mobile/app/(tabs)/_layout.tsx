import { Redirect, Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "@/context/auth";
import colors from "@/constants/colors";

export default function TabLayout() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Redirect href="/sign-in" />;

  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: colors.light.primary,
      tabBarInactiveTintColor: colors.light.mutedForeground,
      tabBarStyle: { height: 78, paddingTop: 8, paddingBottom: 18, backgroundColor: colors.light.card, borderTopColor: colors.light.border },
      tabBarLabelStyle: { fontSize: 10, fontWeight: "600" },
    }}>
      <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: ({ color, size }) => <Feather name="home" color={color} size={size} /> }} />
      <Tabs.Screen name="wallets" options={{ title: "Wallets", tabBarIcon: ({ color, size }) => <Feather name="briefcase" color={color} size={size} /> }} />
      <Tabs.Screen name="activity" options={{ title: "History", tabBarIcon: ({ color, size }) => <Feather name="list" color={color} size={size} /> }} />
      <Tabs.Screen name="more" options={{ title: "More", tabBarIcon: ({ color, size }) => <Feather name="grid" color={color} size={size} /> }} />
      <Tabs.Screen name="profile" options={{ href: null }} />
    </Tabs>
  );
}
