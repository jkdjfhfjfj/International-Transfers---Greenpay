import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/context/auth";
import { api } from "@/lib/api";
import colors from "@/constants/colors";

type Wallet = { id: string; currency: string; balance: string | number; availableBalance?: number; isDefault?: boolean; isActive?: boolean };
const format = (value: string | number, currency: string) => {
  try { return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 2 }).format(Number(value || 0)); }
  catch { return `${currency} ${Number(value || 0).toFixed(2)}`; }
};

export default function WalletsScreen() {
  const { user } = useAuth();
  const query = useQuery({ queryKey: ["mobile-wallets", user?.id], queryFn: () => api<{ wallets: Wallet[] }>("/api/wallets"), enabled: !!user });
  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <FlatList
        data={query.data?.wallets || []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} tintColor={colors.light.primary} />}
        ListHeaderComponent={<><Text style={s.kicker}>YOUR MONEY</Text><Text style={s.title}>Wallets</Text><Text style={s.subtitle}>Balances across your GreenPay accounts.</Text>{query.isError && <Text style={s.error}>Wallets couldn’t load. Pull down to retry.</Text>}</>}
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.icon}><Text style={s.currencyMark}>{item.currency.slice(0, 1)}</Text></View>
            <View style={s.details}><Text style={s.name}>{item.currency} account</Text><Text style={s.meta}>{item.isDefault ? "Default wallet" : item.isActive === false ? "Inactive" : "GreenPay wallet"}</Text></View>
            <Text style={s.amount}>{format(item.availableBalance ?? item.balance, item.currency)}</Text>
            {item.isDefault && <Feather name="check-circle" size={17} color={colors.light.primary} />}
          </View>
        )}
        ListEmptyComponent={query.isLoading ? <ActivityIndicator color={colors.light.primary} style={{ marginTop: 40 }} /> : !query.isError ? <Text style={s.empty}>Your wallets will appear here.</Text> : null}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.light.background }, content: { padding: 20, paddingBottom: 32, flexGrow: 1 },
  kicker: { color: colors.light.primary, fontSize: 10, fontWeight: "800", letterSpacing: 1.5, marginTop: 10 },
  title: { color: colors.light.foreground, fontSize: 28, fontWeight: "800", marginTop: 5 },
  subtitle: { color: colors.light.mutedForeground, fontSize: 13, lineHeight: 19, marginTop: 6, marginBottom: 20 },
  card: { minHeight: 78, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.light.border, borderRadius: 17, backgroundColor: colors.light.card, marginBottom: 10 },
  icon: { width: 42, height: 42, borderRadius: 15, backgroundColor: colors.light.muted, alignItems: "center", justifyContent: "center" },
  currencyMark: { color: colors.light.primary, fontWeight: "800", fontSize: 18 },
  details: { flex: 1 }, name: { color: colors.light.foreground, fontWeight: "700", fontSize: 14 }, meta: { color: colors.light.mutedForeground, fontSize: 11, marginTop: 4 },
  amount: { color: colors.light.foreground, fontSize: 12, fontWeight: "700" }, empty: { color: colors.light.mutedForeground, textAlign: "center", marginTop: 40 }, error: { color: colors.light.destructive, fontSize: 13 },
});
