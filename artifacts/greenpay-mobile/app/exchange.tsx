import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { api } from "@/lib/api";
import { useAuth } from "@/context/auth";
import colors from "@/constants/colors";
type Wallet = { id: string; currency: string; availableBalance: number; isActive?: boolean; isSuspended?: boolean; isDefault?: boolean };
type Policy = { activeCard?: boolean; activeCardRequired?: { exchange?: boolean } };
export default function ExchangeScreen() {
  const { user } = useAuth(); const router = useRouter(); const client = useQueryClient();
  const [from, setFrom] = useState(""); const [to, setTo] = useState(""); const [amount, setAmount] = useState(""); const [pin, setPin] = useState(""); const [code, setCode] = useState(""); const [confirm, setConfirm] = useState(false); const [busy, setBusy] = useState(false); const [message, setMessage] = useState("");
  const wallets = useQuery({ queryKey: ["mobile-wallets", user?.id], queryFn: () => api<{ wallets: Wallet[] }>("/api/wallets"), enabled: !!user });
  const policy = useQuery({ queryKey: ["mobile-transaction-policy", user?.id], queryFn: () => api<Policy>("/api/transaction-policy"), enabled: !!user, staleTime: 0 });
  const active = (wallets.data?.wallets || []).filter(w => w.isActive !== false && !w.isSuspended);
  useEffect(() => { if (!from && active.length) setFrom((active.find(w => w.isDefault) || active[0]).currency); }, [active, from]);
  useEffect(() => { if (!to && active.length > 1) setTo(active.find(w => w.currency !== from)?.currency || ""); else if (to === from) setTo(active.find(w => w.currency !== from)?.currency || ""); }, [active, from, to]);
  const source = active.find(w => w.currency === from); const destination = active.find(w => w.currency === to); const value = Number(amount);
  const rate = useQuery({ queryKey: ["mobile-exchange-rate", from, to], queryFn: () => api<{ rates?: Record<string, number>; rate?: number }>(`/api/exchange-rates/${from}`), enabled: !!from && !!to && from !== to });
  const rateValue = Number(rate.data?.rates?.[to] || rate.data?.rate || 0);
  const submit = async () => {
    setBusy(true); setMessage("");
    try {
      const result = await api<{ convertedAmount?: string; message?: string }>("/api/exchange/convert", { method: "POST", body: JSON.stringify({ amount, fromCurrency: from, toCurrency: to, ...(pin ? { pin } : {}), ...(code ? { authenticatorCode: code } : {}) }) });
      setMessage(result.message || `Exchange complete${result.convertedAmount ? `: ${result.convertedAmount} ${to}` : "."}`);
      setAmount(""); setPin(""); setCode(""); setConfirm(false);
      await Promise.all([client.invalidateQueries({ queryKey: ["mobile-wallets", user?.id] }), client.invalidateQueries({ queryKey: ["mobile-transactions", user?.id] })]);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Exchange failed."); }
    finally { setBusy(false); }
  };
  if ((policy.data?.activeCardRequired?.exchange ?? false) && !policy.data?.activeCard) return <SafeAreaView style={s.safe}><View style={s.page}><Text style={s.title}>Virtual card required</Text><Text style={s.sub}>An active card is required before exchanging currencies.</Text><Pressable style={s.button} onPress={() => router.push("/card-purchase")}><Text style={s.buttonText}>View card options</Text></Pressable></View></SafeAreaView>;
  return <SafeAreaView style={s.safe} edges={["top"]}><ScrollView contentContainerStyle={s.page} keyboardShouldPersistTaps="handled">
    <Text style={s.kicker}>CURRENCY TOOLS</Text><Text style={s.title}>Exchange</Text><Text style={s.sub}>Convert between your active wallets using the current rate.</Text>
    {wallets.isLoading ? <ActivityIndicator color={colors.light.primary} /> : null}
    <Text style={s.label}>FROM WALLET</Text><View style={s.row}>{active.map(w => <Pressable key={w.id} onPress={() => setFrom(w.currency)} style={[s.chip, from === w.currency && s.selected]}><Text style={[s.chipText, from === w.currency && s.selectedText]}>{w.currency}</Text></Pressable>)}</View>
    <Text style={s.label}>TO WALLET</Text><View style={s.row}>{active.filter(w => w.currency !== from).map(w => <Pressable key={w.id} onPress={() => setTo(w.currency)} style={[s.chip, to === w.currency && s.selected]}><Text style={[s.chipText, to === w.currency && s.selectedText]}>{w.currency}</Text></Pressable>)}</View>
    <View style={s.balance}><Text style={s.label}>AVAILABLE {from}</Text><Text style={s.balanceText}>{source ? Number(source.availableBalance || 0).toLocaleString() : "Add a wallet to exchange"}</Text></View>
    <Text style={s.label}>AMOUNT ({from})</Text><TextInput value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor={colors.light.mutedForeground} style={s.input} />
    <View style={s.quote}><Text style={s.quoteText}>{rate.isLoading ? "Loading live rate…" : rateValue > 0 ? `1 ${from} = ${rateValue} ${to}` : "Live exchange rate is unavailable."}</Text>{rateValue > 0 && value > 0 ? <Text style={s.quoteText}>Estimated receive: {(value * rateValue * .985).toFixed(2)} {to} after 1.5% fee</Text> : null}</View>
    <Text style={s.label}>PIN (IF ENABLED)</Text><TextInput value={pin} onChangeText={setPin} secureTextEntry keyboardType="number-pad" placeholder="PIN" placeholderTextColor={colors.light.mutedForeground} style={s.input} />
    <Text style={s.label}>AUTHENTICATOR CODE (IF ENABLED)</Text><TextInput value={code} onChangeText={setCode} keyboardType="number-pad" placeholder="6-digit code" placeholderTextColor={colors.light.mutedForeground} style={s.input} />
    {value > Number(source?.availableBalance || 0) && <Text style={s.error}>Amount exceeds the available {from} balance.</Text>}
    {confirm && <View style={s.quote}><Text style={s.quoteText}>Confirm {amount} {from} → {to}?</Text></View>}
    <Pressable disabled={busy || !source || !destination || value <= 0 || value > Number(source?.availableBalance || 0) || rateValue <= 0} onPress={() => confirm ? void submit() : setConfirm(true)} style={[s.button, (busy || rateValue <= 0) && { opacity: .5 }]}><Text style={s.buttonText}>{busy ? "Exchanging…" : confirm ? "Confirm exchange" : "Review exchange"}</Text></Pressable>
    {!!message && <Text accessibilityRole="alert" style={s.message}>{message}</Text>}
  </ScrollView></SafeAreaView>;
}
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.light.background }, page: { padding: 20, paddingBottom: 35 }, kicker: { color: colors.light.primary, fontSize: 10, fontWeight: "800", letterSpacing: 1.4, marginTop: 10 },
  title: { color: colors.light.foreground, fontSize: 28, fontWeight: "800", marginTop: 5 }, sub: { color: colors.light.mutedForeground, fontSize: 13, lineHeight: 19, marginTop: 6, marginBottom: 14 },
  label: { color: colors.light.mutedForeground, fontSize: 10, fontWeight: "800", letterSpacing: .7, marginTop: 12, marginBottom: 6 }, row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { minWidth: 72, minHeight: 40, borderWidth: 1, borderColor: colors.light.border, borderRadius: 11, alignItems: "center", justifyContent: "center" }, selected: { borderColor: colors.light.primary, backgroundColor: colors.light.muted },
  chipText: { color: colors.light.mutedForeground, fontSize: 12, fontWeight: "700" }, selectedText: { color: colors.light.primary },
  balance: { padding: 13, borderWidth: 1, borderColor: colors.light.border, borderRadius: 13, backgroundColor: colors.light.card, marginTop: 13 }, balanceText: { color: colors.light.foreground, fontSize: 16, fontWeight: "800" },
  input: { minHeight: 47, borderWidth: 1, borderColor: colors.light.border, borderRadius: 12, paddingHorizontal: 13, backgroundColor: colors.light.card, color: colors.light.foreground },
  quote: { padding: 13, borderRadius: 12, backgroundColor: colors.light.muted, marginTop: 13, gap: 5 }, quoteText: { color: colors.light.foreground, fontSize: 12, fontWeight: "600" },
  button: { minHeight: 50, borderRadius: 13, backgroundColor: colors.light.primary, alignItems: "center", justifyContent: "center", marginTop: 17 }, buttonText: { color: "#fff", fontWeight: "800" }, error: { color: colors.light.destructive, fontSize: 12, marginTop: 9 }, message: { color: colors.light.mutedForeground, fontSize: 12, marginTop: 12 },
});
