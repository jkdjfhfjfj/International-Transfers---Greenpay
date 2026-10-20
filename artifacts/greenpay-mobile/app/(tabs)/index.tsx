import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { api } from "@/lib/api";
import { useAuth } from "@/context/auth";
import colors from "@/constants/colors";

type Wallet = { id: string; currency: string; balance: string | number; availableBalance?: string | number; isDefault?: boolean };
type Transaction = { id: string; type: string; description?: string; amount: string | number; currency?: string; status?: string };
const money = (amount: string | number, currency: string) => {
  try { return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 2 }).format(Number(amount || 0)); }
  catch { return `${currency} ${Number(amount || 0).toFixed(2)}`; }
};

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const wallets = useQuery({ queryKey: ["mobile-wallets", user?.id], queryFn: () => api<{ wallets: Wallet[] }>("/api/wallets"), enabled: !!user });
  const activity = useQuery({ queryKey: ["mobile-transactions", user?.id], queryFn: () => api<{ transactions: Transaction[] }>(`/api/transactions/${encodeURIComponent(user!.id)}`), enabled: !!user?.id });
  const list = wallets.data?.wallets || [];
  const primary = list.find((wallet) => wallet.isDefault) || list[0];
  const name = user?.firstName || user?.fullName?.split(" ")[0] || "there";
  const go = (path: string) => router.push(path as never);
  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={s.page}>
        <View style={s.header}><View><Text style={s.greeting}>Good day, {name}</Text><Text style={s.sub}>Your money, at a glance</Text></View><View style={s.avatar}><Text style={s.avatarText}>G</Text></View></View>
        <View style={s.balanceCard}>
          <View style={s.balanceTop}><Text style={s.balanceLabel}>TOTAL AVAILABLE</Text><Feather name="eye" size={18} color="#d7fff7" /></View>
          {wallets.isLoading ? <ActivityIndicator color="#fff" style={{ alignSelf: "flex-start", marginTop: 22 }} /> :
            <Text style={s.balance}>{primary ? money(primary.availableBalance ?? primary.balance, primary.currency) : "No wallet yet"}</Text>}
          <Text style={s.balanceHint}>{list.length} {list.length === 1 ? "wallet" : "wallets"} linked to your account</Text>
          <View style={s.cardOrb} />
        </View>
        <View style={s.quickGrid}>
          <Action icon="plus" label="Add money" onPress={() => go("/deposit")} />
          <Action icon="credit-card" label="Get a card" onPress={() => go("/card-purchase")} />
          <Action icon="shield" label="Verify identity" onPress={() => go("/kyc")} />
          <Action icon="briefcase" label="All wallets" onPress={() => go("/(tabs)/wallets")} />
        </View>
        <View style={s.sectionHeader}><Text style={s.sectionTitle}>Your wallets</Text><Pressable onPress={() => go("/(tabs)/wallets")}><Text style={s.link}>See all</Text></Pressable></View>
        {wallets.isError ? <Text style={s.empty}>Wallets couldn’t load. Pull down to retry.</Text> : list.slice(0, 3).map((wallet) =>
          <Pressable key={wallet.id} style={s.walletRow} onPress={() => go("/(tabs)/wallets")}>
            <View style={s.currencyIcon}><Text style={s.currencyIconText}>{wallet.currency.slice(0, 1)}</Text></View>
            <View style={{ flex: 1 }}><Text style={s.walletTitle}>{wallet.currency} account</Text><Text style={s.walletMeta}>{wallet.isDefault ? "Default wallet" : "GreenPay wallet"}</Text></View>
            <Text style={s.walletAmount}>{money(wallet.availableBalance ?? wallet.balance, wallet.currency)}</Text>
          </Pressable>
        )}
        <View style={s.sectionHeader}><Text style={s.sectionTitle}>Recent activity</Text><Pressable onPress={() => go("/(tabs)/activity")}><Text style={s.link}>View history</Text></Pressable></View>
        {activity.isLoading ? <ActivityIndicator color={colors.light.primary} style={{ margin: 20 }} /> : activity.data?.transactions?.slice(0, 4).map((item) =>
          <View key={item.id} style={s.walletRow}><View style={s.currencyIcon}><Feather name={item.type === "deposit" ? "arrow-down-left" : "arrow-up-right"} size={17} color={colors.light.primary} /></View><View style={{ flex: 1 }}><Text style={s.walletTitle}>{item.description || item.type}</Text><Text style={s.walletMeta}>{item.status || "pending"}</Text></View><Text style={s.walletAmount}>{money(item.amount, item.currency || primary?.currency || "KES")}</Text></View>
        ) || <Text style={s.empty}>Your account activity will appear here.</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}

function Action({ icon, label, onPress }: { icon: React.ComponentProps<typeof Feather>["name"]; label: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={s.action}><Feather name={icon} size={20} color={colors.light.primary} /><Text style={s.actionText}>{label}</Text></Pressable>;
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.light.background },
  page: { padding: 20, paddingBottom: 30 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 8, paddingBottom: 18 },
  greeting: { color: colors.light.foreground, fontSize: 22, fontWeight: "800" },
  sub: { color: colors.light.mutedForeground, fontSize: 13, marginTop: 4 },
  avatar: { width: 42, height: 42, borderRadius: 15, backgroundColor: colors.light.primary, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontWeight: "800", fontSize: 22 },
  balanceCard: { minHeight: 160, backgroundColor: colors.light.primary, borderRadius: 24, padding: 22, justifyContent: "center", overflow: "hidden" },
  balanceTop: { flexDirection: "row", justifyContent: "space-between" },
  balanceLabel: { color: "#d7fff7", fontSize: 10, letterSpacing: 1.4, fontWeight: "700" },
  balance: { color: "#fff", fontSize: 30, fontWeight: "800", marginTop: 18 },
  balanceHint: { color: "#d7fff7", fontSize: 12, marginTop: 6 },
  cardOrb: { position: "absolute", right: -55, bottom: -115, width: 220, height: 220, borderRadius: 120, borderWidth: 1, borderColor: "#b4eee4", opacity: 0.35 },
  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 15 },
  action: { width: "48%", minHeight: 74, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 13, borderRadius: 16, borderWidth: 1, borderColor: colors.light.border, backgroundColor: colors.light.card },
  actionText: { color: colors.light.foreground, fontSize: 12, fontWeight: "700", flexShrink: 1 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 24, marginBottom: 8 },
  sectionTitle: { color: colors.light.foreground, fontSize: 16, fontWeight: "800" },
  link: { color: colors.light.primary, fontWeight: "700", fontSize: 12 },
  walletRow: { minHeight: 64, flexDirection: "row", alignItems: "center", gap: 11, borderBottomWidth: 1, borderBottomColor: colors.light.border },
  currencyIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: colors.light.muted, alignItems: "center", justifyContent: "center" },
  currencyIconText: { color: colors.light.primary, fontWeight: "800" },
  walletTitle: { color: colors.light.foreground, fontSize: 13, fontWeight: "700" },
  walletMeta: { color: colors.light.mutedForeground, fontSize: 11, marginTop: 3, textTransform: "capitalize" },
  walletAmount: { color: colors.light.foreground, fontSize: 12, fontWeight: "700" },
  empty: { color: colors.light.mutedForeground, fontSize: 13, paddingVertical: 16 },
});
