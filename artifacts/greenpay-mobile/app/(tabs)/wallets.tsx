import { useQuery } from "@tanstack/react-query";
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/context/auth";
import { api } from "@/lib/api";
import colors from "@/constants/colors";
import WalletCard from "@/components/WalletCard";

type Wallet = { id: string; currency: string; balance: string | number; availableBalance?: string | number; isDefault?: boolean; isActive?: boolean; isSuspended?: boolean; holdAmount?: string | number; withdrawalHoldAmount?: string | number; label?: string };

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
        renderItem={({ item }) => <WalletCard wallet={item} />}
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
  empty: { color: colors.light.mutedForeground, textAlign: "center", marginTop: 40 }, error: { color: colors.light.destructive, fontSize: 13 },
});
