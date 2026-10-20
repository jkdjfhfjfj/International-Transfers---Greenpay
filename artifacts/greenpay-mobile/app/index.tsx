import { Redirect } from "expo-router";
import { useAuth } from "@/context/auth";

export default function IndexRoute() {
  const { user } = useAuth();
  return <Redirect href={user ? "/(tabs)" : "/get-started"} />;
}
