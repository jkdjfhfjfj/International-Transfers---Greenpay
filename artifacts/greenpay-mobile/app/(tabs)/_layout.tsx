import { Redirect, Stack } from "expo-router";
import { useAuth } from "@/context/auth";

export default function TabLayout() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Redirect href="/sign-in" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
