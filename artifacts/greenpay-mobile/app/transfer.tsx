import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/lib/api";
import { useAuth } from "@/context/auth";
import colors from "@/constants/colors";
type Wallet = { id: string; currency: string; availableBalance: number; isActive?: boolean; isSuspended?: boolean; isDefault?: boolean };
export default function TransferScreen() {
  const { user } = useAuth(); const client = useQueryClient();
  const [sourceId, setSourceId] = useState(""); const [destinationId, setDestinationId] = useState(""); const [amount, setAmount] = useState(""); const [pin, setPin] = useState(""); const [code, setCode] = useState(""); const [review, setReview] = useState(false); const [busy, setBusy] = useState(false); const [message, setMessage] = useState("");
  const query = useQuery({ queryKey: ["mobile-wallets", user?.id], queryFn: () => api<{ wallets: Wallet[] }>("/api/wallets"), enabled: !!user });
  const wallets = (query.data?.wallets || []).filter(wallet => wallet.isActive !== false && !wallet.isSuspended);
  const source = wallets.find(wallet => wallet.id === sourceId) || wallets.find(wallet => wallet.isDefault) || wallets[0];
  const destination = wallets.find(wallet => wallet.id === destinationId && wallet.id !== source?.id);
  const value = Number(amount);
  const submit = async () => {
    if (!source || !destination) return;
    setBusy(true); setMessage("");
    try {
      const result = await api<{ message?: string; sourceAmount?: number; sourceCoin?: string }>("/api/crypto/transfer", { method: "POST", body: JSON.stringify({
        sourceType: "wallet", sourceId: source.id, destinationType: "wallet", destinationId: destination.id, amount: value,
        ...(pin ? { pin } : {}), ...(code ? { authenticatorCode: code } : {}),
      }) });
      setMessage(result.message || `${result.sourceAmount ?? amount} ${result.sourceCoin || source.currency} transferred to ${destination.currency}.`);
      setAmount(""); setPin(""); setCode(""); setReview(false);
      await Promise.all([client.invalidateQueries({ queryKey: ["mobile-wallets", user?.id] }), client.invalidateQueries({ queryKey: ["mobile-transactions", user?.id] })]);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Wallet transfer failed."); }
    finally { setBusy(false); }
  };
  return <SafeAreaView style={s.safe} edges={["top"]}><ScrollView contentContainerStyle={s.page} keyboardShouldPersistTaps="handled">
    <Text style={s.kicker}>YOUR ACCOUNTS</Text><Text style={s.title}>Transfer</Text><Text style={s.sub}>Move funds between your own GreenPay wallets. This is different from sending money to another person.</Text>
    {query.isLoading ? <ActivityIndicator color={colors.light.primary} /> : null}
    <Text style={s.label}>FROM WALLET</Text><View style={s.options}>{wallets.map(wallet => <Pressable key={wallet.id} onPress={() => { setSourceId(wallet.id); if (destinationId === wallet.id) setDestinationId(""); setReview(false); }} style={[s.option, (source?.id === wallet.id) && s.selected]}><Text style={[s.currency, source?.id === wallet.id && s.selectedText]}>{wallet.currency}</Text><Text style={s.balance}>{Number(wallet.availableBalance || 0).toLocaleString()} available</Text></Pressable>)}</View>
    <Text style={s.label}>TO WALLET</Text><View style={s.options}>{wallets.filter(wallet => wallet.id !== source?.id).map(wallet => <Pressable key={wallet.id} onPress={() => { setDestinationId(wallet.id); setReview(false); }} style={[s.option, destination?.id === wallet.id && s.selected]}><Text style={[s.currency, destination?.id === wallet.id && s.selectedText]}>{wallet.currency}</Text><Text style={s.balance}>Wallet balance</Text></Pressable>)}</View>
    <Text style={s.label}>AMOUNT ({source?.currency || "WALLET"})</Text><TextInput value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor={colors.light.mutedForeground} style={s.input} />
    <Text style={s.label}>PIN (IF ENABLED)</Text><TextInput value={pin} onChangeText={setPin} secureTextEntry keyboardType="number-pad" placeholder="PIN" placeholderTextColor={colors.light.mutedForeground} style={s.input} />
    <Text style={s.label}>AUTHENTICATOR CODE (IF ENABLED)</Text><TextInput value={code} onChangeText={setCode} keyboardType="number-pad" placeholder="6-digit code" placeholderTextColor={colors.light.mutedForeground} style={s.input} />
    {value > Number(source?.availableBalance || 0) && <Text style={s.error}>Amount exceeds your available balance.</Text>}
    {review && <View style={s.confirm}><Text style={s.confirmText}>Transfer {amount} {source?.currency} to your {destination?.currency} wallet?</Text><Text style={s.balance}>Any applicable conversion and fees are confirmed by GreenPay.</Text></View>}
    <Pressable disabled={busy || !source || !destination || value <= 0 || value > Number(source?.availableBalance || 0)} onPress={() => review ? void submit() : setReview(true)} style={[s.button, busy && { opacity: .5 }]}><Text style={s.buttonText}>{busy ? "Transferring…" : review ? "Confirm transfer" : "Review transfer"}</Text></Pressable>
    {!!message && <Text accessibilityRole="alert" style={s.message}>{message}</Text>}
  </ScrollView></SafeAreaView>;
}
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.light.background }, page: { padding: 20, paddingBottom: 36 }, kicker: { color: colors.light.primary, fontSize: 10, fontWeight: "800", letterSpacing: 1.4, marginTop: 10 },
  title: { color: colors.light.foreground, fontSize: 28, fontWeight: "800", marginTop: 5 }, sub: { color: colors.light.mutedForeground, fontSize: 13, lineHeight: 19, marginTop: 6, marginBottom: 14 },
  label: { color: colors.light.mutedForeground, fontSize: 10, fontWeight: "800", letterSpacing: .7, marginTop: 12, marginBottom: 6 },
  options: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, option: { width: "48%", minHeight: 61, padding: 10, borderRadius: 12, borderWidth: 1, borderColor: colors.light.border, backgroundColor: colors.light.card },
  selected: { borderColor: colors.light.primary, backgroundColor: colors.light.muted }, currency: { color: colors.light.foreground, fontWeight: "800", fontSize: 13 }, selectedText: { color: colors.light.primary }, balance: { color: colors.light.mutedForeground, fontSize: 10, marginTop: 5 },
  input: { minHeight: 47, borderWidth: 1, borderColor: colors.light.border, borderRadius: 12, paddingHorizontal: 13, backgroundColor: colors.light.card, color: colors.light.foreground },
  confirm: { marginTop: 14, padding: 13, borderWidth: 1, borderColor: colors.light.primary, borderRadius: 12 }, confirmText: { color: colors.light.foreground, fontWeight: "700", fontSize: 13 },
  button: { minHeight: 50, borderRadius: 13, backgroundColor: colors.light.primary, alignItems: "center", justifyContent: "center", marginTop: 17 }, buttonText: { color: "#fff", fontWeight: "800" }, error: { color: colors.light.destructive, fontSize: 12, marginTop: 9 }, message: { color: colors.light.mutedForeground, fontSize: 12, marginTop: 12 },
});
