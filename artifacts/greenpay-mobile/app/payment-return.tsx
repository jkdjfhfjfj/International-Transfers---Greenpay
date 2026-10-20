import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import colors from "@/constants/colors";

export default function PaymentReturnScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: string }>();
  const queryClient = useQueryClient();
  useEffect(() => {
    void queryClient.invalidateQueries();
    router.replace(params.type === "virtual-card" ? "/card-purchase" : "/(tabs)");
  }, [params.type, queryClient, router]);
  return <View style={{ flex: 1, backgroundColor: colors.light.background, justifyContent: "center", alignItems: "center" }}><ActivityIndicator color={colors.light.primary} /></View>;
}
