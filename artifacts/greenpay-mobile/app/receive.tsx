import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/lib/api";
import { useAuth } from "@/context/auth";
import colors from "@/constants/colors";
type Request = { id: string; amount: string | number; currency: string; message?: string; fromUser?: { fullName?: string; email?: string }; status?: string };
export default function ReceiveScreen() {
  const { user } = useAuth(); const client = useQueryClient();
  const [email, setEmail] = useState(""); const [phone, setPhone] = useState(""); const [amount, setAmount] = useState(""); const [currency, setCurrency] = useState("KES"); const [note, setNote] = useState(""); const [pin, setPin] = useState(""); const [busy, setBusy] = useState(false); const [message, setMessage] = useState("");
  const link = useQuery({ queryKey: ["mobile-receive-link", user?.id], queryFn: () => api<{ receiveLink?: string }>("/api/receive-payment-link"), enabled: !!user });
  const requests = useQuery({ queryKey: ["mobile-payment-requests", user?.id], queryFn: () => api<{ requests?: Request[]; paymentRequests?: Request[] } | Request[]>("/api/payment-requests-received"), enabled: !!user, refetchInterval: 15000 });
  const rows = Array.isArray(requests.data) ? requests.data : requests.data?.requests || requests.data?.paymentRequests || [];
  const createRequest = async () => {
    setBusy(true); setMessage("");
    try {
      await api("/api/payment-requests", { method: "POST", body: JSON.stringify({ fromUserId: user?.id, amount, currency, toEmail: email || undefined, toPhone: phone || undefined, message: note }) });
      setMessage("Payment request sent."); setEmail(""); setPhone(""); setAmount(""); setNote("");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not send payment request."); }
    finally { setBusy(false); }
  };
  const accept = async (id: string) => {
    setBusy(true); setMessage("");
    try {
      const result = await api<{ message?: string }>(`/api/payment-requests/${id}/accept`, { method: "PUT", body: JSON.stringify(pin ? { pin } : {}) });
      setMessage(result.message || "Payment request paid."); setPin("");
      await Promise.all([client.invalidateQueries({ queryKey: ["mobile-payment-requests", user?.id] }), client.invalidateQueries({ queryKey: ["mobile-wallets", user?.id] })]);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not pay this request."); }
    finally { setBusy(false); }
  };
  return <SafeAreaView style={s.safe} edges={["top"]}><ScrollView contentContainerStyle={s.page} keyboardShouldPersistTaps="handled">
    <Text style={s.kicker}>GET PAID</Text><Text style={s.title}>Receive money</Text><Text style={s.sub}>Share your payment link or ask someone to pay you.</Text>
    <View style={s.card}><Text style={s.label}>YOUR PAYMENT LINK</Text><Text selectable style={s.link}>{link.data?.receiveLink || (link.isLoading ? "Loading link…" : "Payment link unavailable")}</Text>
      <Pressable disabled={!link.data?.receiveLink} onPress={() => link.data?.receiveLink && Share.share({ message: link.data.receiveLink })} style={s.secondary}><Text style={s.secondaryText}>Share payment link</Text></Pressable>
    </View>
    <View style={s.card}><Text style={s.cardTitle}>Request a payment</Text>
      <Field label="RECIPIENT EMAIL (OR PHONE)" value={email} onChangeText={setEmail} placeholder="name@example.com" />
      <Field label="PHONE (OPTIONAL)" value={phone} onChangeText={setPhone} placeholder="+254…" />
      <Field label="AMOUNT" value={amount} onChangeText={setAmount} placeholder="0.00" keyboardType="decimal-pad" />
      <Text style={s.label}>CURRENCY</Text><View style={s.row}>{["KES", "USD", "EUR", "GBP"].map(code => <Pressable key={code} onPress={() => setCurrency(code)} style={[s.chip, currency === code && s.chipActive]}><Text style={[s.chipText, currency === code && s.chipTextActive]}>{code}</Text></Pressable>)}</View>
      <Field label="NOTE (OPTIONAL)" value={note} onChangeText={setNote} placeholder="What is this payment for?" />
      <Pressable disabled={busy || Number(amount) <= 0 || (!email && !phone)} onPress={() => void createRequest()} style={[s.button, (busy || Number(amount) <= 0 || (!email && !phone)) && { opacity: .5 }]}><Text style={s.buttonText}>{busy ? "Sending…" : "Send payment request"}</Text></Pressable>
    </View>
    <View style={s.card}><Text style={s.cardTitle}>Requests sent to you</Text>
      {requests.isLoading ? <ActivityIndicator color={colors.light.primary} /> : requests.isError ? <Text style={s.help}>Payment requests could not load.</Text> : rows.length ? rows.map(item => <View key={item.id} style={s.request}><Text style={s.requestTitle}>{item.fromUser?.fullName || item.fromUser?.email || "GreenPay user"}</Text><Text style={s.help}>{item.currency} {item.amount}{item.message ? ` · ${item.message}` : ""}</Text><Pressable disabled={busy} onPress={() => void accept(item.id)} style={s.smallButton}><Text style={s.buttonText}>Pay request</Text></Pressable></View>) : <Text style={s.help}>No pending requests.</Text>}
      <Field label="PIN (IF REQUIRED TO PAY)" value={pin} onChangeText={setPin} placeholder="PIN" secureTextEntry keyboardType="number-pad" />
    </View>
    {!!message && <Text accessibilityRole="alert" style={s.message}>{message}</Text>}
  </ScrollView></SafeAreaView>;
}
function Field({ label, value, onChangeText, placeholder, keyboardType, secureTextEntry }: { label: string; value: string; onChangeText: (v: string) => void; placeholder: string; keyboardType?: "decimal-pad" | "number-pad"; secureTextEntry?: boolean }) {
  return <><Text style={s.label}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.light.mutedForeground} keyboardType={keyboardType} secureTextEntry={secureTextEntry} style={s.input} /></>;
}
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.light.background }, page: { padding: 20, paddingBottom: 36 }, kicker: { color: colors.light.primary, fontSize: 10, fontWeight: "800", letterSpacing: 1.4, marginTop: 10 },
  title: { color: colors.light.foreground, fontSize: 28, fontWeight: "800", marginTop: 5 }, sub: { color: colors.light.mutedForeground, fontSize: 13, lineHeight: 19, marginTop: 6, marginBottom: 13 },
  card: { borderWidth: 1, borderColor: colors.light.border, borderRadius: 16, padding: 14, backgroundColor: colors.light.card, marginTop: 10 }, cardTitle: { color: colors.light.foreground, fontSize: 15, fontWeight: "800", marginBottom: 3 },
  label: { color: colors.light.mutedForeground, fontSize: 10, fontWeight: "800", letterSpacing: .6, marginTop: 11, marginBottom: 6 }, link: { color: colors.light.primary, fontSize: 12, fontWeight: "700" },
  secondary: { marginTop: 11, minHeight: 42, borderRadius: 11, borderWidth: 1, borderColor: colors.light.primary, justifyContent: "center", alignItems: "center" }, secondaryText: { color: colors.light.primary, fontWeight: "800", fontSize: 12 },
  input: { minHeight: 45, borderWidth: 1, borderColor: colors.light.border, borderRadius: 11, paddingHorizontal: 12, color: colors.light.foreground, backgroundColor: colors.light.background },
  row: { flexDirection: "row", gap: 7 }, chip: { minWidth: 54, minHeight: 36, borderWidth: 1, borderColor: colors.light.border, borderRadius: 10, alignItems: "center", justifyContent: "center" }, chipActive: { borderColor: colors.light.primary, backgroundColor: colors.light.muted },
  chipText: { color: colors.light.mutedForeground, fontSize: 11, fontWeight: "700" }, chipTextActive: { color: colors.light.primary },
  button: { minHeight: 46, borderRadius: 12, backgroundColor: colors.light.primary, alignItems: "center", justifyContent: "center", marginTop: 13 }, smallButton: { alignSelf: "flex-start", paddingHorizontal: 14, minHeight: 36, justifyContent: "center", borderRadius: 10, backgroundColor: colors.light.primary, marginTop: 8 },
  buttonText: { color: "#fff", fontWeight: "800", fontSize: 12 }, request: { borderTopWidth: 1, borderTopColor: colors.light.border, paddingVertical: 11 }, requestTitle: { color: colors.light.foreground, fontSize: 13, fontWeight: "700" }, help: { color: colors.light.mutedForeground, fontSize: 11, marginTop: 4 },
  message: { color: colors.light.mutedForeground, fontSize: 12, marginTop: 12 },
});
