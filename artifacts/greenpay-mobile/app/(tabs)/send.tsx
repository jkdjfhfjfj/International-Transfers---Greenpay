import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { api } from "@/lib/api";
import { useAuth } from "@/context/auth";
import colors from "@/constants/colors";

type Recipient = { id: string; fullName: string; email: string; phone?: string };
type Wallet = { currency: string; availableBalance: number; isDefault?: boolean };
type Policy = { activeCard?: boolean; activeCardRequired?: { send?: boolean } };
const fmt = (n: number, currency: string) => `${currency} ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function SendScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<Recipient[]>([]);
  const [recipient, setRecipient] = useState<Recipient | null>(null);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [pin, setPin] = useState("");
  const [authenticatorCode, setAuthenticatorCode] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const wallets = useQuery({ queryKey: ["mobile-wallets", user?.id], queryFn: () => api<{ wallets: Wallet[] }>("/api/wallets"), enabled: !!user });
  const policy = useQuery({ queryKey: ["mobile-transaction-policy", user?.id], queryFn: () => api<Policy>("/api/transaction-policy"), enabled: !!user, staleTime: 0 });
  const wallet = wallets.data?.wallets.find((item) => item.isDefault) || wallets.data?.wallets[0];
  const requiresCard = policy.data?.activeCardRequired?.send ?? true;
  const hasCard = policy.data?.activeCard ?? false;
  const value = Number(amount);

  const search = async () => {
    if (term.trim().length < 2) { setMessage("Enter at least two characters to search."); return; }
    setBusy(true); setMessage("");
    try {
      const data = await api<{ users?: Recipient[] }>(`/api/users/search?q=${encodeURIComponent(term.trim())}`);
      setResults((data.users || []).filter((item) => item.id !== user?.id));
      if (!data.users?.length) setMessage("No GreenPay users found.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Search failed."); }
    finally { setBusy(false); }
  };

  const send = async () => {
    if (!user || !recipient || !wallet || !Number.isFinite(value) || value <= 0 || value > Number(wallet.availableBalance)) return;
    setBusy(true); setMessage("");
    try {
      await api("/api/transfer", { method: "POST", body: JSON.stringify({
        fromUserId: user.id, toUserId: recipient.id, amount, currency: wallet.currency,
        description: description.trim() || `Transfer to ${recipient.fullName}`,
        ...(pin ? { pin } : {}), ...(authenticatorCode ? { authenticatorCode } : {}),
      }) });
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["mobile-transactions", user.id] }),
        qc.invalidateQueries({ queryKey: ["mobile-wallets", user.id] }),
      ]);
      setMessage(`Transfer sent to ${recipient.fullName}.`);
      setRecipient(null); setAmount(""); setDescription(""); setPin(""); setAuthenticatorCode(""); setConfirming(false);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Transfer could not be completed."); }
    finally { setBusy(false); }
  };

  if (policy.isLoading || wallets.isLoading) return <SafeAreaView style={s.safe}><ActivityIndicator color={colors.light.primary} style={{ flex: 1 }} /></SafeAreaView>;
  if (requiresCard && !hasCard) return <SafeAreaView style={s.safe} edges={["top"]}><View style={s.page}><Text style={s.kicker}>SEND MONEY</Text><Text style={s.title}>Virtual card required</Text><Text style={s.subtitle}>Your account needs an active virtual card before transfers can be made.</Text><Button label="View card options" onPress={() => router.push("/card-purchase")} /></View></SafeAreaView>;

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={s.page} keyboardShouldPersistTaps="handled">
        <Text style={s.kicker}>MOVE MONEY</Text><Text style={s.title}>Send money</Text><Text style={s.subtitle}>Transfer to another GreenPay account.</Text>
        <View style={s.balance}><Text style={s.label}>FROM YOUR {wallet?.currency || "WALLET"} WALLET</Text><Text style={s.balanceText}>{wallet ? fmt(Number(wallet.availableBalance || 0), wallet.currency) : "No wallet available"}</Text></View>
        {!recipient ? <>
          <Text style={s.label}>Find a GreenPay user</Text>
          <View style={s.searchRow}><TextInput value={term} onChangeText={setTerm} onSubmitEditing={() => void search()} style={[s.input, { flex: 1 }]} placeholder="Name, email or phone" placeholderTextColor={colors.light.mutedForeground} /><Pressable onPress={() => void search()} style={s.searchButton}><Feather name="search" size={19} color="#fff" /></Pressable></View>
          {results.map((item) => <Pressable key={item.id} onPress={() => { setRecipient(item); setResults([]); setMessage(""); }} style={s.result}><View style={s.personIcon}><Feather name="user" size={17} color={colors.light.primary} /></View><View style={{ flex: 1 }}><Text style={s.resultName}>{item.fullName}</Text><Text style={s.meta}>{item.email}</Text></View><Feather name="chevron-right" size={17} color={colors.light.mutedForeground} /></Pressable>)}
        </> : <>
          <Text style={s.label}>SEND TO</Text><View style={s.selected}><Text style={s.resultName}>{recipient.fullName}</Text><Text style={s.meta}>{recipient.email}</Text><Pressable onPress={() => { setRecipient(null); setConfirming(false); }}><Text style={s.link}>Change</Text></Pressable></View>
          <Text style={s.label}>AMOUNT ({wallet?.currency || "KES"})</Text><TextInput value={amount} onChangeText={(value) => { setAmount(value); setConfirming(false); }} keyboardType="decimal-pad" style={s.input} placeholder="0.00" placeholderTextColor={colors.light.mutedForeground} />
          <Text style={s.label}>NOTE (OPTIONAL)</Text><TextInput value={description} onChangeText={setDescription} style={s.input} placeholder="What is this transfer for?" placeholderTextColor={colors.light.mutedForeground} />
          <Text style={s.label}>SECURITY (IF ENABLED)</Text><TextInput value={pin} onChangeText={setPin} secureTextEntry keyboardType="number-pad" style={s.input} placeholder="PIN" placeholderTextColor={colors.light.mutedForeground} />
          <TextInput value={authenticatorCode} onChangeText={setAuthenticatorCode} keyboardType="number-pad" style={s.input} placeholder="Authenticator code" placeholderTextColor={colors.light.mutedForeground} />
          {value > Number(wallet?.availableBalance || 0) && <Text style={s.error}>The amount is greater than your available balance.</Text>}
          {confirming && <View style={s.confirm}><Text style={s.resultName}>Confirm {fmt(value, wallet?.currency || "KES")} to {recipient.fullName}?</Text><Text style={s.meta}>This transfer will debit your wallet.</Text></View>}
          <Button label={busy ? "Sending…" : confirming ? "Confirm and send" : "Review transfer"} disabled={busy || !Number.isFinite(value) || value <= 0 || value > Number(wallet?.availableBalance || 0)} onPress={() => confirming ? void send() : setConfirming(true)} />
        </>}
        {!!message && <Text accessibilityRole="alert" style={s.message}>{message}</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}

function Button({ label, onPress, disabled = false }: { label: string; onPress: () => void; disabled?: boolean }) {
  return <Pressable disabled={disabled} onPress={onPress} style={[s.button, disabled && { opacity: 0.5 }]}><Text style={s.buttonText}>{label}</Text></Pressable>;
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.light.background }, page: { padding: 20, paddingBottom: 36 },
  kicker: { color: colors.light.primary, fontSize: 10, fontWeight: "800", letterSpacing: 1.5, marginTop: 10 },
  title: { color: colors.light.foreground, fontSize: 28, fontWeight: "800", marginTop: 5 },
  subtitle: { color: colors.light.mutedForeground, fontSize: 13, lineHeight: 19, marginTop: 6, marginBottom: 20 },
  balance: { backgroundColor: colors.light.card, borderWidth: 1, borderColor: colors.light.border, borderRadius: 16, padding: 15, marginBottom: 20 },
  label: { color: colors.light.mutedForeground, fontSize: 10, fontWeight: "800", letterSpacing: 0.7, marginTop: 12, marginBottom: 7 },
  balanceText: { color: colors.light.foreground, fontSize: 19, fontWeight: "800", marginTop: 7 },
  input: { minHeight: 50, borderWidth: 1, borderColor: colors.light.border, borderRadius: 13, backgroundColor: colors.light.card, paddingHorizontal: 14, color: colors.light.foreground, fontSize: 14 },
  searchRow: { flexDirection: "row", gap: 8 }, searchButton: { width: 50, borderRadius: 13, backgroundColor: colors.light.primary, alignItems: "center", justifyContent: "center" },
  result: { minHeight: 64, flexDirection: "row", alignItems: "center", gap: 11, borderBottomWidth: 1, borderColor: colors.light.border },
  personIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: colors.light.muted, alignItems: "center", justifyContent: "center" },
  resultName: { color: colors.light.foreground, fontSize: 14, fontWeight: "700" }, meta: { color: colors.light.mutedForeground, fontSize: 11, marginTop: 4 },
  selected: { backgroundColor: colors.light.card, borderWidth: 1, borderColor: colors.light.border, borderRadius: 14, padding: 13 },
  link: { color: colors.light.primary, fontWeight: "700", fontSize: 12, marginTop: 8 },
  button: { minHeight: 52, borderRadius: 14, backgroundColor: colors.light.primary, alignItems: "center", justifyContent: "center", marginTop: 18 },
  buttonText: { color: "#fff", fontSize: 14, fontWeight: "800" },
  confirm: { marginTop: 14, padding: 14, borderRadius: 13, borderWidth: 1, borderColor: colors.light.primary, backgroundColor: colors.light.card },
  error: { color: colors.light.destructive, fontSize: 12, marginTop: 7 }, message: { color: colors.light.mutedForeground, fontSize: 12, lineHeight: 18, marginTop: 12 },
});
