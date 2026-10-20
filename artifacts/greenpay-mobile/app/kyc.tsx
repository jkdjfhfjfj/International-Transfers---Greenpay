import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Redirect, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as WebBrowser from "expo-web-browser";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/lib/api";
import { useAuth } from "@/context/auth";
import colors from "@/constants/colors";

type KycStatus = { kyc?: { status?: string | null } | null };
const WEB_KYC_URL = "https://geepay.us/auth/kyc-verification?source=mobile";

export default function KycScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [opening, setOpening] = useState(false);
  const status = useQuery({
    queryKey: ["mobile-kyc-status", user?.id],
    queryFn: () => api<KycStatus>(`/api/kyc/${encodeURIComponent(user!.id)}`),
    enabled: !!user,
  });

  if (!user) return <Redirect href="/sign-in" />;
  const currentStatus = status.data?.kyc?.status ?? "not started";
  const startVerification = async () => {
    setOpening(true);
    try {
      await WebBrowser.openBrowserAsync(WEB_KYC_URL);
      await queryClient.invalidateQueries({ queryKey: ["mobile-kyc-status", user.id] });
      await status.refetch();
    } finally {
      setOpening(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.page}>
        <Pressable onPress={() => router.back()} style={styles.back} accessibilityRole="button">
          <Ionicons name="arrow-back" size={22} color={colors.light.foreground} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <View style={styles.icon}><Ionicons name="shield-checkmark-outline" size={32} color={colors.light.primary} /></View>
        <Text style={styles.title}>Identity verification</Text>
        <Text style={styles.description}>Complete verification in Geepay’s secure browser flow. When you return, this screen will refresh your status.</Text>
        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>Current status</Text>
          {status.isLoading ? <ActivityIndicator color={colors.light.primary} /> : <Text style={styles.statusValue}>{String(currentStatus).replace(/_/g, " ")}</Text>}
        </View>
        <Pressable onPress={startVerification} disabled={opening} style={styles.button}>
          {opening ? <ActivityIndicator color="#fff" /> : <><Ionicons name="open-outline" size={18} color="#fff" /><Text style={styles.buttonText}>Continue in browser</Text></>}
        </Pressable>
        {status.isError && <Text style={styles.note}>Status could not be loaded. You can still open the secure verification page.</Text>}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.light.background },
  page: { flex: 1, padding: 24, justifyContent: "center" },
  back: { position: "absolute", top: 12, left: 18, flexDirection: "row", alignItems: "center", gap: 7, padding: 10 },
  backText: { color: colors.light.foreground, fontSize: 15, fontWeight: "600" },
  icon: { width: 68, height: 68, borderRadius: 22, backgroundColor: "#ccfbf1", alignItems: "center", justifyContent: "center", marginBottom: 24 },
  title: { color: colors.light.foreground, fontSize: 27, fontWeight: "800", marginBottom: 12 },
  description: { color: colors.light.mutedForeground, fontSize: 15, lineHeight: 23, marginBottom: 22 },
  statusCard: { backgroundColor: colors.light.card, borderWidth: 1, borderColor: colors.light.border, borderRadius: 16, padding: 17, marginBottom: 16 },
  statusLabel: { color: colors.light.mutedForeground, fontSize: 12, marginBottom: 7 },
  statusValue: { color: colors.light.foreground, fontSize: 17, fontWeight: "700", textTransform: "capitalize" },
  button: { height: 54, borderRadius: 15, backgroundColor: colors.light.primary, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 9 },
  buttonText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  note: { color: colors.light.mutedForeground, fontSize: 12, lineHeight: 18, marginTop: 12 },
});
