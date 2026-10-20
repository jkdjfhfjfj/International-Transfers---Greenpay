import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/auth";
import colors from "@/constants/colors";

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const name = user?.fullName || [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "GreenPay user";
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.content}>
        <Text style={styles.kicker}>ACCOUNT</Text>
        <Text style={styles.title}>Your profile</Text>
        <View style={styles.profileCard}>
          <View style={styles.avatar}><Feather name="user" size={24} color="#fff" /></View>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.email}>{user?.email || "Signed-in account"}</Text>
        </View>
        <Pressable onPress={() => router.push("/kyc")} style={styles.kycButton}>
          <Feather name="shield" size={18} color={colors.light.primary} />
          <Text style={styles.kycText}>Identity verification</Text>
          <Feather name="chevron-right" size={18} color={colors.light.mutedForeground} />
        </Pressable>
        <View style={styles.infoRow}><Text style={styles.label}>Account status</Text><Text style={styles.value}>Secure session</Text></View>
        <Text style={styles.note}>Financial features may depend on local availability and applicable regulations.</Text>
        <Pressable testID="signout-button" onPress={async () => { setBusy(true); try { await logout(); } finally { setBusy(false); } }} style={({ pressed }) => [styles.signout, pressed && { opacity: 0.75 }]} disabled={busy}>
          {busy ? <ActivityIndicator color={colors.light.destructive} /> : <><Feather name="log-out" size={17} color={colors.light.destructive} /><Text style={styles.signoutText}>Sign out</Text></>}
        </Pressable>
        <Text style={styles.version}>GreenPay Mobile · 1.0.0</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.light.background },
  content: { padding: 20, flex: 1 },
  kicker: { color: colors.light.primary, fontSize: 10, fontWeight: "700", letterSpacing: 1.6, marginTop: 14 },
  title: { color: colors.light.foreground, fontSize: 28, fontWeight: "700", marginTop: 5, marginBottom: 22 },
  profileCard: { backgroundColor: colors.light.card, padding: 22, borderRadius: 20, borderWidth: 1, borderColor: colors.light.border, alignItems: "center" },
  kycButton: { flexDirection: "row", alignItems: "center", gap: 11, marginTop: 18, padding: 16, borderRadius: 15, borderWidth: 1, borderColor: colors.light.border, backgroundColor: colors.light.card },
  kycText: { flex: 1, color: colors.light.foreground, fontWeight: "600", fontSize: 14 },
  avatar: { width: 58, height: 58, borderRadius: 20, backgroundColor: colors.light.primary, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  name: { color: colors.light.foreground, fontSize: 18, fontWeight: "700" },
  email: { color: colors.light.mutedForeground, fontSize: 13, marginTop: 5 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.light.border },
  label: { color: colors.light.mutedForeground, fontSize: 13 },
  value: { color: colors.light.foreground, fontSize: 13, fontWeight: "600" },
  note: { color: colors.light.mutedForeground, fontSize: 11, lineHeight: 17, marginTop: 18 },
  signout: { flexDirection: "row", gap: 9, alignItems: "center", justifyContent: "center", marginTop: 28, borderWidth: 1, borderColor: colors.light.border, backgroundColor: colors.light.muted, height: 50, borderRadius: 15 },
  signoutText: { color: colors.light.destructive, fontWeight: "700", fontSize: 14 },
  version: { color: colors.light.mutedForeground, textAlign: "center", fontSize: 10, marginTop: "auto", paddingTop: 25 },
});
