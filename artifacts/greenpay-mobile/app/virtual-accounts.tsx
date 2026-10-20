import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/lib/api";
import { useAuth } from "@/context/auth";
import colors from "@/constants/colors";

type Application = { id: string; currency: string; status: string; sourceOfIncome?: string; purpose?: string; virtualAccount?: { accountNumber?: string; balance?: string | number } | null };
type Data = { applications: Application[]; supportedCurrencies: string[] };
const declarationsList = [
  ["notUsCitizen", "I am not a U.S. citizen or resident"],
  ["notPoliticallyExposed", "I am not a politically exposed person"],
  ["beneficialOwner", "I am the beneficial owner of this account"],
  ["truthfulInformation", "The information I provided is accurate"],
  ["acceptsTerms", "I accept the account terms"],
] as const;

export default function VirtualAccountsScreen() {
  const { user } = useAuth(); const client = useQueryClient();
  const [currency, setCurrency] = useState("USD");
  const [sourceOfIncome, setSourceOfIncome] = useState("");
  const [monthlyVolume, setMonthlyVolume] = useState("");
  const [purpose, setPurpose] = useState("");
  const [expectedSenders, setExpectedSenders] = useState("");
  const [declarations, setDeclarations] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState("");
  const query = useQuery({ queryKey: ["mobile-virtual-accounts", user?.id], queryFn: () => api<Data>("/api/virtual-accounts"), enabled: !!user });
  const currencies = query.data?.supportedCurrencies || ["USD", "EUR", "GBP"];
  const applications = query.data?.applications || [];
  const submit = async () => {
    setBusy(true); setMessage("");
    try {
      await api("/api/virtual-accounts/apply", { method: "POST", body: JSON.stringify({
        currency, sourceOfIncome, monthlyVolume, purpose, expectedSenders,
        declarations: Object.fromEntries(declarationsList.map(([key]) => [key, declarations[key] === true])),
      }) });
      setMessage("Application submitted. It is pending review.");
      setSourceOfIncome(""); setMonthlyVolume(""); setPurpose(""); setExpectedSenders(""); setDeclarations({});
      await client.invalidateQueries({ queryKey: ["mobile-virtual-accounts", user?.id] });
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not submit the application."); }
    finally { setBusy(false); }
  };
  return <SafeAreaView style={s.safe} edges={["top"]}><ScrollView contentContainerStyle={s.page} keyboardShouldPersistTaps="handled">
    <Text style={s.kicker}>GLOBAL ACCOUNTS</Text><Text style={s.title}>Virtual accounts</Text><Text style={s.sub}>Apply for a USD, EUR, or GBP account and track its review status here.</Text>
    {query.isLoading ? <ActivityIndicator color={colors.light.primary} style={{ margin: 24 }} /> : null}
    {query.isError ? <Text style={s.error}>Account information could not load. Refresh and try again.</Text> : null}
    <Text style={s.section}>YOUR APPLICATIONS</Text>
    <View style={s.currencyRow}>{["USD", "EUR", "GBP"].map(code => {
      const item = applications.find(app => app.currency === code);
      return <View key={code} style={s.accountCard}><Text style={s.code}>{code}</Text><Text style={s.status}>{item ? item.status.replace(/_/g, " ") : "No application"}</Text>{item?.virtualAccount?.accountNumber ? <Text style={s.accountNumber}>{item.virtualAccount.accountNumber}</Text> : null}</View>;
    })}</View>
    <View style={s.form}><Text style={s.formTitle}>Apply for an account</Text>
      <Text style={s.label}>ACCOUNT CURRENCY</Text><View style={s.currencyRow}>{currencies.map(code => <Pressable key={code} onPress={() => setCurrency(code)} style={[s.pill, currency === code && s.pillActive]}><Text style={[s.pillText, currency === code && s.pillTextActive]}>{code}</Text></Pressable>)}</View>
      <Field label="SOURCE OF INCOME" value={sourceOfIncome} onChangeText={setSourceOfIncome} placeholder="Employment, business, savings…" />
      <Field label="EXPECTED MONTHLY VOLUME" value={monthlyVolume} onChangeText={setMonthlyVolume} placeholder="Approximate amount" />
      <Field label="PURPOSE OF ACCOUNT" value={purpose} onChangeText={setPurpose} placeholder="How you plan to use this account" />
      <Field label="EXPECTED SENDERS (OPTIONAL)" value={expectedSenders} onChangeText={setExpectedSenders} placeholder="Names or countries" />
      <Text style={s.label}>DECLARATIONS</Text>
      {declarationsList.map(([key, label]) => <Pressable key={key} onPress={() => setDeclarations(current => ({ ...current, [key]: !current[key] }))} style={s.checkRow}><View style={[s.checkbox, declarations[key] && s.checked]}>{declarations[key] ? <Text style={s.checkMark}>✓</Text> : null}</View><Text style={s.checkText}>{label}</Text></Pressable>)}
      <Pressable disabled={busy || !sourceOfIncome || monthlyVolume.length < 1 || purpose.length < 5 || !declarationsList.every(([key]) => declarations[key])} onPress={() => void submit()} style={[s.button, busy && { opacity: .5 }]}><Text style={s.buttonText}>{busy ? "Submitting…" : "Submit application"}</Text></Pressable>
      {!!message && <Text accessibilityRole="alert" style={s.message}>{message}</Text>}
    </View>
  </ScrollView></SafeAreaView>;
}

function Field({ label, value, onChangeText, placeholder }: { label: string; value: string; onChangeText: (v: string) => void; placeholder: string }) {
  return <><Text style={s.label}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.light.mutedForeground} style={s.input} /></>;
}
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.light.background }, page: { padding: 20, paddingBottom: 36 },
  kicker: { color: colors.light.primary, fontSize: 10, fontWeight: "800", letterSpacing: 1.5, marginTop: 10 },
  title: { color: colors.light.foreground, fontSize: 28, fontWeight: "800", marginTop: 5 }, sub: { color: colors.light.mutedForeground, fontSize: 13, lineHeight: 19, marginTop: 6, marginBottom: 20 },
  section: { color: colors.light.mutedForeground, fontSize: 10, fontWeight: "800", letterSpacing: 1, marginBottom: 9 },
  currencyRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  accountCard: { flex: 1, minHeight: 76, padding: 10, borderRadius: 14, borderWidth: 1, borderColor: colors.light.border, backgroundColor: colors.light.card },
  code: { color: colors.light.primary, fontSize: 15, fontWeight: "800" }, status: { color: colors.light.mutedForeground, fontSize: 10, marginTop: 7, textTransform: "capitalize" }, accountNumber: { color: colors.light.foreground, fontSize: 10, marginTop: 5 },
  form: { padding: 15, borderRadius: 18, borderWidth: 1, borderColor: colors.light.border, backgroundColor: colors.light.card, marginTop: 8 },
  formTitle: { color: colors.light.foreground, fontSize: 16, fontWeight: "800", marginBottom: 3 },
  label: { color: colors.light.mutedForeground, fontSize: 10, fontWeight: "800", letterSpacing: .6, marginTop: 12, marginBottom: 6 },
  pill: { minWidth: 66, paddingVertical: 9, borderRadius: 11, borderWidth: 1, borderColor: colors.light.border, alignItems: "center" }, pillActive: { borderColor: colors.light.primary, backgroundColor: colors.light.muted },
  pillText: { color: colors.light.mutedForeground, fontSize: 12, fontWeight: "700" }, pillTextActive: { color: colors.light.primary },
  input: { minHeight: 46, borderWidth: 1, borderColor: colors.light.border, borderRadius: 12, paddingHorizontal: 12, color: colors.light.foreground, backgroundColor: colors.light.background },
  checkRow: { minHeight: 38, flexDirection: "row", alignItems: "center", gap: 9 }, checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1, borderColor: colors.light.border, alignItems: "center", justifyContent: "center" },
  checked: { backgroundColor: colors.light.primary, borderColor: colors.light.primary }, checkMark: { color: "#fff", fontSize: 13, fontWeight: "800" }, checkText: { color: colors.light.foreground, fontSize: 11, flex: 1 },
  button: { minHeight: 49, borderRadius: 13, backgroundColor: colors.light.primary, alignItems: "center", justifyContent: "center", marginTop: 15 }, buttonText: { color: "#fff", fontWeight: "800", fontSize: 13 },
  message: { color: colors.light.mutedForeground, fontSize: 12, lineHeight: 18, marginTop: 11 }, error: { color: colors.light.destructive, fontSize: 12 },
});
