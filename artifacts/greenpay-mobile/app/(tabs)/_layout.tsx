import { Redirect, Tabs } from "expo-router";
import { useAuth } from "@/context/auth";
import { FloatingTabBar } from "@/components/FloatingTabBar";

export default function TabLayout() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Redirect href="/sign-in" />;

  return (
    <Tabs tabBar={(props) => <FloatingTabBar {...props} />} screenOptions={{ headerShown: false, tabBarStyle: { position: "absolute", backgroundColor: "transparent", borderTopWidth: 0 } }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="card" />
      <Tabs.Screen name="send" />
      <Tabs.Screen name="activity" />
      <Tabs.Screen name="settings" />
      <Tabs.Screen name="wallets" options={{ href: null }} />
      <Tabs.Screen name="more" options={{ href: null }} />
      <Tabs.Screen name="profile" options={{ href: null }} />
    </Tabs>
  );
}
