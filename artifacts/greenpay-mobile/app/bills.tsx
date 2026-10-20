import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/lib/api";
import { useAuth } from "@/context/auth";
import colors from "@/constants/colors";
const providers = [{ id: "KPLC", name: "KPLC", field: "meterNumber" }, { id: "Zuku", name: "Zuku", field: "accountNumber" }, { id: "StarimesTV", name: "StarTimes TV", field: "accountNumber" }, { id: "Nairobi_Water", name: "Nairobi Water", field: "meterNumber" }, { id: "Kenya_Power", name: "Kenya Power", field: "meterNumber" }, { id: "Airtel_Money", name: "Airtel Money", field: "accountNumber" }] as const;
export default function BillsScreen() {
  const { user } = useAuth(); const client = useQueryClient();
  const [provider, setProvider] = useState<typeof providers[number] | null>(null); const [identifier, setIdentifier] = useState(""); const [amount, setAmount] = useState(""); const [pin, setPin] = useState(""); const [code, setCode] = useState(""); const [confirm, setConfirm] = useState(false); const [busy, setBusy] = useState(false); const [message, setMessage] = useState("");
  const submit = async () => {
    if (!provider) return;
    setBusy(true); setMessage("");
    try {
      const result = await api<{ status?: string; message?: string }>("/api/bills/pay", { method: "POST", body: JSON.stringify({
        provider: provider.id, meterNumber: provider.field === "meterNumber" ? identifier : null,
        accountNumber: provider.field === "accountNumber" ? identifier : null, amount,
        ...(pin ? { pin } : {}), ...(code ? { authenticatorCode: code } : {}),
      }) });
      setMessage(result.message || (result.status === "pending" ? "Payment is pending provider verification." : "Bill payment submitted."));
      setIdentifier(""); setAmount(""); setPin(""); setCode(""); setConfirm(false);
      await client.invalidateQueries({ queryKey: ["mobile-transactions", user?.id] });
    } catch (error) { setMessage(error instanceof Error ? error.message : "Bill payment failed."); }
    finally { setBusy(false); }
  };
  return <SafeAreaView style={s.safe} edges={["top"]}><ScrollView contentContainerStyle={s.page} keyboardShouldPersistTaps="handled">
    <Text style={s.kicker}>PAYMENTS</Text><Text style={s.title}>Pay a bill</Text><Text style={s.sub}>Choose a provider and enter its account or meter number.</Text>
    <Text style={s.label}>PROVIDER</Text><View style={s.grid}>{providers.map(item => <Pressable key={item.id} onPress={() => { setProvider(item); setConfirm(false); }} style={[s.provider, provider?.id === item.id && s.providerActive]}><Text style={[s.providerText, provider?.id === item.id && s.providerTextActive]}>{item.name}</Text></Pressable>)}</View>
    {provider && <><Text style={s.label}>{provider.field === "meterNumber" ? "METER NUMBER" : "ACCOUNT NUMBER"}</Text><TextInput value={identifier} onChangeText={setIdentifier} placeholder={provider.field === "meterNumber" ? "Enter meter number" : "Enter account number"} placeholderTextColor={colors.light.mutedForeground} style={s.input} />
      <Text style={s.label}>AMOUNT (KES)</Text><TextInput value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor={colors.light.mutedForeground} style={s.input} />
      <Text style={s.label}>PIN (IF ENABLED)</Text><TextInput value={pin} onChangeText={setPin} secureTextEntry keyboardType="number-pad" placeholder="PIN" placeholderTextColor={colors.light.mutedForeground} style={s.input} />
      <Text style={s.label}>AUTHENTICATOR CODE (IF ENABLED)</Text><TextInput value={code} onChangeText={setCode} keyboardType="number-pad" placeholder="6-digit code" placeholderTextColor={colors.light.mutedForeground} style={s.input} />
      {confirm && <View style={s.confirm}><Text style={s.confirmText}>Pay KES {amount} to {provider.name}?</Text></View>}
      <Pressable disabled={busy || !identifier || Number(amount) <= 0} onPress={() => confirm ? void submit() : setConfirm(true)} style={[s.button, busy && { opacity: .5 }]}><Text style={s.buttonText}>{busy ? "Processing…" : confirm ? "Confirm bill payment" : "Review payment"}</Text></Pressable>
    </>}
    {!!message && <Text accessibilityRole="alert" style={s.message}>{message}</Text>}
  </ScrollView></SafeAreaView>;
}
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.light.background }, page: { padding: 20, paddingBottom: 36 }, kicker: { color: colors.light.primary, fontSize: 10, fontWeight: "800", letterSpacing: 1.4, marginTop: 10 },
  title: { color: colors.light.foreground, fontSize: 28, fontWeight: "800", marginTop: 5 }, sub: { color: colors.light.mutedForeground, fontSize: 13, lineHeight: 19, marginTop: 6, marginBottom: 14 },
  label: { color: colors.light.mutedForeground, fontSize: 10, fontWeight: "800", letterSpacing: .7, marginTop: 12, marginBottom: 6 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, provider: { width: "48%", minHeight: 45, alignItems: "center", justifyContent: "center", borderRadius: 12, borderWidth: 1, borderColor: colors.light.border, backgroundColor: colors.light.card },
  providerActive: { borderColor: colors.light.primary, backgroundColor: colors.light.muted }, providerText: { color: colors.light.mutedForeground, fontSize: 12, fontWeight: "700" }, providerTextActive: { color: colors.light.primary },
  input: { minHeight: 48, borderWidth: 1, borderColor: colors.light.border, borderRadius: 12, backgroundColor: colors.light.card, paddingHorizontal: 13, color: colors.light.foreground },
  confirm: { marginTop: 14, padding: 13, borderWidth: 1, borderColor: colors.light.primary, borderRadius: 12 }, confirmText: { color: colors.light.foreground, fontWeight: "700", fontSize: 13 },
  button: { minHeight: 50, borderRadius: 13, backgroundColor: colors.light.primary, alignItems: "center", justifyContent: "center", marginTop: 18 }, buttonText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  message: { color: colors.light.mutedForeground, fontSize: 12, lineHeight: 18, marginTop: 12 },
});
