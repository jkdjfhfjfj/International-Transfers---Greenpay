import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import colors from "@/constants/colors";

export default function KycReturnScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  useEffect(() => {
    void queryClient.invalidateQueries({ queryKey: ["mobile-kyc-status"] });
    router.replace("/kyc");
  }, [queryClient, router]);
  return <View style={{ flex: 1, backgroundColor: colors.light.background, justifyContent: "center", alignItems: "center" }}><ActivityIndicator color={colors.light.primary} /></View>;
}
