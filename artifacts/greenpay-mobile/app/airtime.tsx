import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/lib/api";
import { useAuth } from "@/context/auth";
import colors from "@/constants/colors";
const providers = ["safaricom", "airtel", "telkom"];
type Wallet = { currency: string; availableBalance: number; isDefault?: boolean };
export default function AirtimeScreen() {
  const { user } = useAuth(); const client = useQueryClient();
  const [provider, setProvider] = useState(""); const [phoneNumber, setPhone] = useState(""); const [amount, setAmount] = useState(""); const [pin, setPin] = useState(""); const [code, setCode] = useState(""); const [confirm, setConfirm] = useState(false); const [busy, setBusy] = useState(false); const [message, setMessage] = useState("");
  const wallets = useQuery({ queryKey: ["mobile-wallets", user?.id], queryFn: () => api<{ wallets: Wallet[] }>("/api/wallets"), enabled: !!user });
  const wallet = wallets.data?.wallets.find(w => w.currency === "KES");
  const submit = async () => {
    setBusy(true); setMessage("");
    try {
      const result = await api<{ message?: string }>("/api/airtime/purchase", { method: "POST", body: JSON.stringify({ phoneNumber, amount, currency: "KES", provider, ...(pin ? { pin } : {}), ...(code ? { authenticatorCode: code } : {}) }) });
      setMessage(result.message || "Airtime request submitted."); setPhone(""); setAmount(""); setPin(""); setCode(""); setConfirm(false);
      await Promise.all([client.invalidateQueries({ queryKey: ["mobile-wallets", user?.id] }), client.invalidateQueries({ queryKey: ["mobile-transactions", user?.id] })]);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Airtime purchase failed."); }
    finally { setBusy(false); }
  };
  return <SafeAreaView style={s.safe} edges={["top"]}><ScrollView contentContainerStyle={s.page} keyboardShouldPersistTaps="handled">
    <Text style={s.kicker}>MOBILE SERVICES</Text><Text style={s.title}>Buy airtime</Text><Text style={s.sub}>Send airtime to a Kenyan mobile number using your KES wallet.</Text>
    {wallets.isLoading ? <ActivityIndicator color={colors.light.primary} /> : <View style={s.balance}><Text style={s.label}>KES AVAILABLE</Text><Text style={s.balanceText}>KES {Number(wallet?.availableBalance || 0).toLocaleString()}</Text></View>}
    <Text style={s.label}>NETWORK</Text><View style={s.row}>{providers.map(item => <Pressable key={item} onPress={() => setProvider(item)} style={[s.chip, provider === item && s.active]}><Text style={[s.chipText, provider === item && s.activeText]}>{item}</Text></Pressable>)}</View>
    <Field label="PHONE NUMBER" value={phoneNumber} onChangeText={setPhone} placeholder="+254…" />
    <Field label="AMOUNT (KES)" value={amount} onChangeText={setAmount} placeholder="5–10,000" keyboardType="decimal-pad" />
    <Field label="PIN (IF ENABLED)" value={pin} onChangeText={setPin} placeholder="PIN" secureTextEntry keyboardType="number-pad" />
    <Field label="AUTHENTICATOR CODE (IF ENABLED)" value={code} onChangeText={setCode} placeholder="6-digit code" keyboardType="number-pad" />
    {confirm && <View style={s.confirm}><Text style={s.confirmText}>Send KES {amount} airtime to {phoneNumber} on {provider}?</Text></View>}
    <Pressable disabled={busy || !wallet || !provider || phoneNumber.length < 10 || Number(amount) < 5 || Number(amount) > 10000} onPress={() => confirm ? void submit() : setConfirm(true)} style={[s.button, busy && { opacity: .5 }]}><Text style={s.buttonText}>{busy ? "Processing…" : confirm ? "Confirm purchase" : "Review purchase"}</Text></Pressable>
    {!!message && <Text accessibilityRole="alert" style={s.message}>{message}</Text>}
  </ScrollView></SafeAreaView>;
}
function Field({ label, value, onChangeText, placeholder, keyboardType, secureTextEntry }: { label: string; value: string; onChangeText: (v: string) => void; placeholder: string; keyboardType?: "decimal-pad" | "number-pad"; secureTextEntry?: boolean }) {
  return <><Text style={s.label}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.light.mutedForeground} keyboardType={keyboardType} secureTextEntry={secureTextEntry} style={s.input} /></>;
}
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.light.background }, page: { padding: 20, paddingBottom: 35 }, kicker: { color: colors.light.primary, fontSize: 10, fontWeight: "800", letterSpacing: 1.4, marginTop: 10 },
  title: { color: colors.light.foreground, fontSize: 28, fontWeight: "800", marginTop: 5 }, sub: { color: colors.light.mutedForeground, fontSize: 13, lineHeight: 19, marginTop: 6, marginBottom: 16 },
  balance: { padding: 14, backgroundColor: colors.light.card, borderWidth: 1, borderColor: colors.light.border, borderRadius: 14, marginBottom: 8 }, label: { color: colors.light.mutedForeground, fontSize: 10, fontWeight: "800", letterSpacing: .7, marginTop: 12, marginBottom: 6 },
  balanceText: { color: colors.light.foreground, fontSize: 18, fontWeight: "800", marginTop: 5 }, row: { flexDirection: "row", gap: 8 }, chip: { flex: 1, minHeight: 42, borderWidth: 1, borderColor: colors.light.border, backgroundColor: colors.light.card, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  active: { borderColor: colors.light.primary, backgroundColor: colors.light.muted }, chipText: { textTransform: "capitalize", color: colors.light.mutedForeground, fontSize: 12, fontWeight: "700" }, activeText: { color: colors.light.primary },
  input: { minHeight: 48, borderWidth: 1, borderColor: colors.light.border, backgroundColor: colors.light.card, borderRadius: 12, paddingHorizontal: 13, color: colors.light.foreground },
  confirm: { marginTop: 14, padding: 13, borderWidth: 1, borderColor: colors.light.primary, borderRadius: 12 }, confirmText: { color: colors.light.foreground, fontWeight: "700", fontSize: 13 },
  button: { minHeight: 50, backgroundColor: colors.light.primary, borderRadius: 13, marginTop: 17, alignItems: "center", justifyContent: "center" }, buttonText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  message: { color: colors.light.mutedForeground, fontSize: 12, lineHeight: 18, marginTop: 12 },
});
