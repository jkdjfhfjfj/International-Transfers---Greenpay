import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "@/context/auth";
import colors from "@/constants/colors";

export default function IndexRoute() {
  const { user } = useAuth();
  const [destination, setDestination] = useState<"/(tabs)" | "/get-started" | "/sign-in" | null>(null);
  useEffect(() => {
    if (user) {
      setDestination("/(tabs)");
      return;
    }
    AsyncStorage.getItem("geepay-onboarding-complete")
      .then((seen) => setDestination(seen ? "/sign-in" : "/get-started"))
      .catch(() => setDestination("/get-started"));
  }, [user]);
  if (!destination) return <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.light.background }}><ActivityIndicator color={colors.light.primary} /></View>;
  return <Redirect href={destination} />;
}
