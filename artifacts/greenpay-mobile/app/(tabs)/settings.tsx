import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as LocalAuthentication from "expo-local-authentication";
import { useAuth } from "@/context/auth";
import colors from "@/constants/colors";

export default function SettingsScreen() {
  const auth = useAuth(); const router = useRouter();
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState("");
  useEffect(() => {
    void Promise.all([LocalAuthentication.hasHardwareAsync(), LocalAuthentication.isEnrolledAsync()])
      .then(([hardware, enrolled]) => setBiometricAvailable(hardware && enrolled))
      .catch(() => setBiometricAvailable(false));
  }, []);
  const toggleBiometrics = async (enabled: boolean) => {
    setBusy(true); setMessage("");
    try {
      await auth.setBiometricEnabled(enabled);
      setMessage(enabled ? "Biometric app unlock is enabled on this device." : "Biometric app unlock is off.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update biometric settings.");
    } finally { setBusy(false); }
  };
  const links = [
    { label: "All services", detail: "Payments, wallets and account tools", icon: "grid", path: "/(tabs)/more" },
    { label: "Your profile", detail: "Account information and sign out", icon: "user", path: "/(tabs)/profile" },
    { label: "Identity verification", detail: "Review your KYC status", icon: "shield", path: "/kyc" },
  ] as const;
  return <SafeAreaView style={s.safe} edges={["top"]}><ScrollView contentContainerStyle={s.page}>
    <Text style={s.kicker}>ACCOUNT</Text><Text style={s.title}>Settings</Text>
    <View style={s.section}>
      <Text style={s.sectionTitle}>SECURITY</Text>
      <View style={s.securityRow}>
        <View style={s.icon}><Feather name="lock" size={18} color={colors.light.primary} /></View>
        <View style={s.copy}><Text style={s.rowTitle}>Biometric app unlock</Text><Text style={s.detail}>{biometricAvailable ? "Use Face ID or fingerprint when you return to GreenPay." : "Set up Face ID or fingerprint on this device to enable."}</Text></View>
        {busy ? <ActivityIndicator color={colors.light.primary} /> : <Switch value={auth.biometricEnabled} onValueChange={(value) => void toggleBiometrics(value)} disabled={!biometricAvailable} trackColor={{ false: colors.light.border, true: colors.light.primary }} />}
      </View>
      {!!message && <Text accessibilityRole="alert" style={s.message}>{message}</Text>}
    </View>
    <View style={s.section}>
      <Text style={s.sectionTitle}>ACCOUNT & SERVICES</Text>
      {links.map((item) => <Pressable key={item.path} onPress={() => router.push(item.path as never)} style={s.link}>
        <View style={s.icon}><Feather name={item.icon as any} size={18} color={colors.light.primary} /></View>
        <View style={s.copy}><Text style={s.rowTitle}>{item.label}</Text><Text style={s.detail}>{item.detail}</Text></View>
        <Feather name="chevron-right" size={18} color={colors.light.mutedForeground} />
      </Pressable>)}
    </View>
  </ScrollView></SafeAreaView>;
}
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.light.background }, page: { padding: 20, paddingBottom: 120 },
  kicker: { color: colors.light.primary, fontSize: 10, fontWeight: "800", letterSpacing: 1.5, marginTop: 10 },
  title: { color: colors.light.foreground, fontSize: 28, fontWeight: "800", marginTop: 5, marginBottom: 20 },
  section: { marginBottom: 14, borderWidth: 1, borderColor: colors.light.border, borderRadius: 18, backgroundColor: colors.light.card, paddingHorizontal: 14, paddingBottom: 6 },
  sectionTitle: { color: colors.light.mutedForeground, fontSize: 10, letterSpacing: 1, fontWeight: "800", marginTop: 15, marginBottom: 6 },
  securityRow: { flexDirection: "row", alignItems: "center", gap: 11, paddingVertical: 13 },
  link: { minHeight: 66, flexDirection: "row", alignItems: "center", gap: 11, borderTopWidth: 1, borderTopColor: colors.light.border },
  icon: { width: 38, height: 38, borderRadius: 13, backgroundColor: colors.light.muted, alignItems: "center", justifyContent: "center" },
  copy: { flex: 1 }, rowTitle: { color: colors.light.foreground, fontSize: 13, fontWeight: "700" }, detail: { color: colors.light.mutedForeground, fontSize: 11, marginTop: 4, lineHeight: 16 },
  message: { color: colors.light.mutedForeground, fontSize: 12, paddingBottom: 10 },
});
