import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { api } from "@/lib/api";
import { useAuth } from "@/context/auth";
import colors from "@/constants/colors";

type Wallet = { id: string; currency: string; availableBalance: number; isDefault?: boolean };
type Policy = { activeCard?: boolean; activeCardRequired?: { withdrawal?: boolean } };
type Method = "bank" | "mobile-money";
export default function WithdrawScreen() {
  const { user } = useAuth(); const router = useRouter(); const client = useQueryClient();
  const [method, setMethod] = useState<Method>("bank"); const [amount, setAmount] = useState("");
  const [bankName, setBankName] = useState(""); const [accountNumber, setAccountNumber] = useState(""); const [accountName, setAccountName] = useState(""); const [phone, setPhone] = useState("");
  const [pin, setPin] = useState(""); const [code, setCode] = useState(""); const [confirm, setConfirm] = useState(false); const [busy, setBusy] = useState(false); const [message, setMessage] = useState("");
  const wallets = useQuery({ queryKey: ["mobile-wallets", user?.id], queryFn: () => api<{ wallets: Wallet[] }>("/api/wallets"), enabled: !!user });
  const policy = useQuery({ queryKey: ["mobile-transaction-policy", user?.id], queryFn: () => api<Policy>("/api/transaction-policy"), enabled: !!user, staleTime: 0 });
  const wallet = wallets.data?.wallets.find(w => w.isDefault) || wallets.data?.wallets[0]; const value = Number(amount);
  const submit = async () => {
    if (!wallet || !Number.isFinite(value) || value <= 0 || value > Number(wallet.availableBalance || 0)) return;
    setBusy(true); setMessage("");
    try {
      const result = await api<{ message?: string }>("/api/transactions", { method: "POST", body: JSON.stringify({
        type: "withdraw", amount, currency: wallet.currency, description: `Withdrawal via ${method}`,
        recipientDetails: method === "bank" ? { bankName, accountNumber, accountName, country: user?.country || "Kenya" } : { phoneNumber: phone, accountName, country: user?.country || "Kenya" },
        ...(pin ? { pin } : {}), ...(code ? { authenticatorCode: code } : {}),
      }) });
      setMessage(result.message || "Withdrawal request submitted for review.");
      setAmount(""); setPin(""); setCode(""); setConfirm(false);
      await Promise.all([client.invalidateQueries({ queryKey: ["mobile-wallets", user?.id] }), client.invalidateQueries({ queryKey: ["mobile-transactions", user?.id] })]);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Withdrawal could not be submitted."); }
    finally { setBusy(false); }
  };
  if (wallets.isLoading || policy.isLoading) return <SafeAreaView style={s.safe}><ActivityIndicator color={colors.light.primary} style={{ flex: 1 }} /></SafeAreaView>;
  if ((policy.data?.activeCardRequired?.withdrawal ?? false) && !policy.data?.activeCard) return <SafeAreaView style={s.safe}><View style={s.page}><Text style={s.title}>Virtual card required</Text><Text style={s.sub}>An active card is required before withdrawals can be requested.</Text><Pressable style={s.button} onPress={() => router.push("/card-purchase")}><Text style={s.buttonText}>View card options</Text></Pressable></View></SafeAreaView>;
  return <SafeAreaView style={s.safe} edges={["top"]}><ScrollView contentContainerStyle={s.page} keyboardShouldPersistTaps="handled">
    <Text style={s.kicker}>MOVE MONEY</Text><Text style={s.title}>Withdraw</Text><Text style={s.sub}>Request a withdrawal from your default wallet.</Text>
    <View style={s.balance}><Text style={s.label}>{wallet?.currency || "WALLET"} AVAILABLE</Text><Text style={s.balanceText}>{wallet ? `${wallet.currency} ${Number(wallet.availableBalance || 0).toLocaleString()}` : "No wallet available"}</Text></View>
    <Text style={s.label}>PAYOUT METHOD</Text><View style={s.methods}>{(["bank", "mobile-money"] as Method[]).map(item => <Pressable key={item} onPress={() => { setMethod(item); setConfirm(false); }} style={[s.method, method === item && s.methodActive]}><Text style={[s.methodText, method === item && s.methodTextActive]}>{item === "bank" ? "Bank account" : "Mobile money"}</Text></Pressable>)}</View>
    <Text style={s.label}>AMOUNT ({wallet?.currency || "KES"})</Text><TextInput value={amount} onChangeText={setAmount} keyboardType="decimal-pad" style={s.input} placeholder="0.00" placeholderTextColor={colors.light.mutedForeground} />
    {method === "bank" ? <><Field label="BANK NAME" value={bankName} onChangeText={setBankName} /><Field label="ACCOUNT NAME" value={accountName} onChangeText={setAccountName} /><Field label="ACCOUNT NUMBER" value={accountNumber} onChangeText={setAccountNumber} keyboardType="number-pad" /></> : <><Field label="ACCOUNT NAME" value={accountName} onChangeText={setAccountName} /><Field label="MOBILE MONEY NUMBER" value={phone} onChangeText={setPhone} keyboardType="phone-pad" /></>}
    <Text style={s.label}>SECURITY (IF ENABLED)</Text><Field label="PIN" value={pin} onChangeText={setPin} secureTextEntry keyboardType="number-pad" /><Field label="AUTHENTICATOR CODE" value={code} onChangeText={setCode} keyboardType="number-pad" />
    {value > Number(wallet?.availableBalance || 0) && <Text style={s.error}>Amount exceeds your available balance.</Text>}
    {confirm && <View style={s.confirm}><Text style={s.confirmTitle}>Confirm withdrawal of {wallet?.currency} {amount}?</Text><Text style={s.sub}>The request may require review before funds are released.</Text></View>}
    <Pressable disabled={busy || !wallet || value <= 0 || value > Number(wallet?.availableBalance || 0) || (method === "bank" ? !bankName || !accountName || !accountNumber : !accountName || !phone)} onPress={() => confirm ? void submit() : setConfirm(true)} style={[s.button, (busy || !wallet || value <= 0) && { opacity: .5 }]}><Text style={s.buttonText}>{busy ? "Submitting…" : confirm ? "Confirm withdrawal" : "Review withdrawal"}</Text></Pressable>
    {!!message && <Text accessibilityRole="alert" style={s.message}>{message}</Text>}
  </ScrollView></SafeAreaView>;
}
function Field(props: { label: string; value: string; onChangeText: (v: string) => void; keyboardType?: "number-pad" | "phone-pad"; secureTextEntry?: boolean }) { return <><Text style={s.label}>{props.label}</Text><TextInput value={props.value} onChangeText={props.onChangeText} keyboardType={props.keyboardType} secureTextEntry={props.secureTextEntry} style={s.input} placeholder={props.label.toLowerCase()} placeholderTextColor={colors.light.mutedForeground} /></>; }
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.light.background }, page: { padding: 20, paddingBottom: 34 },
  kicker: { color: colors.light.primary, fontSize: 10, fontWeight: "800", letterSpacing: 1.4, marginTop: 10 },
  title: { color: colors.light.foreground, fontSize: 28, fontWeight: "800", marginTop: 5 }, sub: { color: colors.light.mutedForeground, fontSize: 13, lineHeight: 19, marginTop: 6, marginBottom: 15 },
  balance: { padding: 15, borderRadius: 15, borderWidth: 1, borderColor: colors.light.border, backgroundColor: colors.light.card, marginBottom: 12 },
  label: { color: colors.light.mutedForeground, fontSize: 10, fontWeight: "800", letterSpacing: .7, marginTop: 12, marginBottom: 7 },
  balanceText: { color: colors.light.foreground, fontSize: 18, fontWeight: "800", marginTop: 6 },
  methods: { flexDirection: "row", gap: 9 }, method: { flex: 1, minHeight: 44, borderWidth: 1, borderColor: colors.light.border, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: colors.light.card },
  methodActive: { borderColor: colors.light.primary, backgroundColor: colors.light.muted }, methodText: { color: colors.light.mutedForeground, fontSize: 12, fontWeight: "700" }, methodTextActive: { color: colors.light.primary },
  input: { minHeight: 48, borderWidth: 1, borderColor: colors.light.border, borderRadius: 12, backgroundColor: colors.light.card, color: colors.light.foreground, paddingHorizontal: 13, fontSize: 14 },
  button: { minHeight: 50, borderRadius: 14, backgroundColor: colors.light.primary, alignItems: "center", justifyContent: "center", marginTop: 18 },
  buttonText: { color: "#fff", fontSize: 14, fontWeight: "800" }, confirm: { borderWidth: 1, borderColor: colors.light.primary, borderRadius: 14, padding: 14, marginTop: 14 },
  confirmTitle: { color: colors.light.foreground, fontWeight: "800", fontSize: 14 }, error: { color: colors.light.destructive, fontSize: 12, marginTop: 8 },
  message: { color: colors.light.mutedForeground, fontSize: 12, lineHeight: 18, marginTop: 12 },
});
