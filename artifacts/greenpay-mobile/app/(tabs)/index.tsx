import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { useCallback } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { api } from "@/lib/api";
import { useAuth } from "@/context/auth";
import colors from "@/constants/colors";

type Wallet = { id: string; currency: string; balance: string | number; availableBalance?: string | number; isDefault?: boolean };
type Transaction = { id: string; type: string; description?: string; amount: string | number; currency?: string; status?: string; createdAt?: string };
const money = (value: string | number, currency: string) => {
  const amount = Number(value || 0);
  try { return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 2 }).format(amount); }
  catch { return `${currency} ${amount.toFixed(2)}`; }
};

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const wallets = useQuery({ queryKey: ["mobile-wallets"], queryFn: () => api<{ wallets: Wallet[] }>("/api/wallets") });
  const activity = useQuery({
    queryKey: ["mobile-transactions", user?.id],
    enabled: Boolean(user?.id),
    queryFn: () => api<{ transactions: Transaction[] }>(`/api/transactions/${encodeURIComponent(user!.id)}`),
  });
  const refresh = useCallback(() => { void Promise.all([wallets.refetch(), activity.refetch()]); }, [wallets.refetch, activity.refetch]);
  const allTransactions = activity.data?.transactions || [];
  const defaultWallet = (wallets.data?.wallets || []).find((wallet) => wallet.isDefault) || wallets.data?.wallets?.[0];
  const firstName = user?.firstName || user?.fullName?.split(" ")[0] || "there";

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <FlatList
        data={allTransactions.slice(0, 4)}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={wallets.isRefetching || activity.isRefetching} onRefresh={refresh} tintColor={colors.light.primary} />}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View>
            <View style={styles.topline}>
              <View><Text style={styles.greeting}>Good day, {firstName}</Text><Text style={styles.subhead}>Your money, at a glance</Text></View>
              <View style={styles.mark}><Text style={styles.markText}>G</Text></View>
            </View>
            <View style={styles.balanceCard}>
              <View style={styles.balanceLabelRow}><Text style={styles.balanceLabel}>DEFAULT WALLET</Text><Feather name="shield" size={16} color="#b4eee4" /></View>
              {wallets.isLoading ? <ActivityIndicator color="#fff" style={{ alignSelf: "flex-start", marginTop: 18 }} /> :
                wallets.isError ? <Text style={styles.whiteBody}>Wallets couldn’t load. Pull down to retry.</Text> :
                defaultWallet ? <><Text style={styles.balance}>{money(defaultWallet.availableBalance ?? defaultWallet.balance, defaultWallet.currency)}</Text><Text style={styles.whiteBody}>{defaultWallet.currency} available balance</Text></> :
                <Text style={styles.whiteBody}>No wallet is available yet.</Text>}
              <View style={styles.cardWave}><View style={styles.waveDot} /><View style={styles.waveDot2} /></View>
            </View>
            <View style={styles.actions}>
              <Pressable style={styles.actionButton} onPress={() => router.push("/deposit")}><Feather name="plus-circle" size={18} color={colors.light.primary} /><Text style={styles.actionText}>Deposit</Text></Pressable>
              <Pressable style={styles.actionButton} onPress={() => router.push("/card-purchase")}><Feather name="credit-card" size={18} color={colors.light.primary} /><Text style={styles.actionText}>Get a card</Text></Pressable>
            </View>
            <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>Your wallets</Text><Text style={styles.count}>{wallets.data?.wallets?.length || 0}</Text></View>
            {wallets.isLoading ? <ActivityIndicator color={colors.light.primary} style={{ margin: 22 }} /> :
              wallets.data?.wallets?.length ? <View style={styles.walletList}>{wallets.data.wallets.slice(0, 3).map((wallet) => (
                <View key={wallet.id} style={styles.walletRow}>
                  <View style={styles.currencyIcon}><Text style={styles.currencyIconText}>{wallet.currency.slice(0, 1)}</Text></View>
                  <View style={{ flex: 1 }}><Text style={styles.currency}>{wallet.currency} account</Text><Text style={styles.walletMeta}>{wallet.isDefault ? "Default account" : "GreenPay wallet"}</Text></View>
                  <Text style={styles.walletBalance}>{money(wallet.availableBalance ?? wallet.balance, wallet.currency)}</Text>
                </View>
              ))}</View> : <View style={styles.empty}><Text style={styles.muted}>Your wallet list will appear here.</Text></View>}
            <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>Recent activity</Text><Feather name="arrow-up-right" size={17} color={colors.light.mutedForeground} /></View>
            {activity.isError && <Text style={styles.muted}>Activity couldn’t load. Pull down to retry.</Text>}
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.transactionRow}>
            <View style={styles.transactionIcon}><Feather name={item.type === "deposit" ? "arrow-down-left" : "arrow-up-right"} size={17} color={colors.light.primary} /></View>
            <View style={{ flex: 1 }}><Text style={styles.currency} numberOfLines={1}>{item.description || item.type}</Text><Text style={styles.walletMeta}>{item.status || "pending"}{item.createdAt ? ` · ${new Date(item.createdAt).toLocaleDateString()}` : ""}</Text></View>
            <Text style={styles.walletBalance}>{money(item.amount, item.currency || defaultWallet?.currency || "USD")}</Text>
          </View>
        )}
        ListEmptyComponent={!activity.isLoading && !activity.isError ? <View style={styles.empty}><Text style={styles.muted}>No recent transactions yet.</Text></View> : activity.isLoading ? <ActivityIndicator color={colors.light.primary} style={{ margin: 18 }} /> : null}
        ListFooterComponent={<Text style={styles.footer}>GreenPay keeps your account protected with secure sign-in.</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.light.background },
  content: { paddingHorizontal: 20, paddingBottom: 28 },
  topline: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 14, paddingBottom: 20 },
  greeting: { color: colors.light.foreground, fontSize: 22, fontWeight: "700" },
  subhead: { color: colors.light.mutedForeground, fontSize: 13, marginTop: 5 },
  mark: { width: 40, height: 40, borderRadius: 14, backgroundColor: colors.light.primary, alignItems: "center", justifyContent: "center" },
  markText: { color: colors.light.primaryForeground, fontWeight: "800", fontSize: 22 },
  balanceCard: { overflow: "hidden", minHeight: 170, borderRadius: 24, backgroundColor: colors.light.primary, padding: 22, justifyContent: "center" },
  balanceLabelRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  balanceLabel: { color: colors.light.primaryForeground, letterSpacing: 1.4, fontSize: 10, fontWeight: "700" },
  balance: { color: colors.light.primaryForeground, fontSize: 32, fontWeight: "700", marginTop: 15 },
  whiteBody: { color: "#e1fffa", fontSize: 13, marginTop: 6 },
  actions: { flexDirection: "row", gap: 12, marginTop: 14 },
  actionButton: { flex: 1, minHeight: 54, flexDirection: "row", gap: 9, alignItems: "center", justifyContent: "center", borderRadius: 15, borderWidth: 1, borderColor: colors.light.border, backgroundColor: colors.light.card },
  actionText: { color: colors.light.foreground, fontWeight: "600", fontSize: 13 },
  cardWave: { position: "absolute", right: -50, bottom: -100, width: 250, height: 200, borderRadius: 150, borderWidth: 1, borderColor: colors.light.secondary, opacity: 0.24 },
  waveDot: { position: "absolute", right: 18, top: 12, width: 190, height: 190, borderRadius: 110, borderWidth: 1, borderColor: colors.light.secondary, opacity: 0.2 },
  waveDot2: { position: "absolute", right: 45, top: 30, width: 130, height: 130, borderRadius: 80, backgroundColor: colors.light.secondary, opacity: 0.12 },
  sectionHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 25, marginBottom: 12 },
  sectionTitle: { color: colors.light.foreground, fontSize: 16, fontWeight: "700" },
  count: { color: colors.light.mutedForeground, fontSize: 12 },
  walletList: { backgroundColor: colors.light.card, borderRadius: 18, borderWidth: 1, borderColor: colors.light.border, paddingHorizontal: 14 },
  walletRow: { minHeight: 68, flexDirection: "row", alignItems: "center", gap: 11, borderBottomWidth: 1, borderBottomColor: colors.light.border },
  currencyIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: colors.light.muted, alignItems: "center", justifyContent: "center" },
  currencyIconText: { fontSize: 16, color: colors.light.primary, fontWeight: "700" },
  currency: { color: colors.light.foreground, fontSize: 13, fontWeight: "600" },
  walletMeta: { color: colors.light.mutedForeground, fontSize: 11, marginTop: 4, textTransform: "capitalize" },
  walletBalance: { color: colors.light.foreground, fontSize: 12, fontWeight: "700" },
  transactionRow: { flexDirection: "row", alignItems: "center", gap: 11, minHeight: 66, borderBottomWidth: 1, borderBottomColor: colors.light.border },
  transactionIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.light.muted, alignItems: "center", justifyContent: "center" },
  empty: { paddingVertical: 18, alignItems: "center" },
  muted: { color: colors.light.mutedForeground, fontSize: 12 },
  footer: { color: colors.light.mutedForeground, textAlign: "center", fontSize: 10, marginTop: 24 },
});
