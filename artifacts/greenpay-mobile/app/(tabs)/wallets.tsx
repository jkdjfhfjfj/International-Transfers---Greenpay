import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/context/auth";
import { api } from "@/lib/api";
import colors from "@/constants/colors";
import WalletCard from "@/components/WalletCard";

type Wallet = { id: string; currency: string; balance: string | number; availableBalance?: string | number; isDefault?: boolean; isActive?: boolean; isSuspended?: boolean; holdAmount?: string | number; withdrawalHoldAmount?: string | number; label?: string };
type Currency = { code: string; name?: string; flag?: string };

export default function WalletsScreen() {
  const { user } = useAuth();
  const client = useQueryClient();
  const [selectedCurrency, setSelectedCurrency] = useState("");
  const [message, setMessage] = useState("");
  const query = useQuery({ queryKey: ["mobile-wallets", user?.id], queryFn: () => api<{ wallets: Wallet[] }>("/api/wallets"), enabled: !!user });
  const currencies = useQuery({ queryKey: ["mobile-currencies"], queryFn: () => api<{ currencies: Currency[]; enabled?: string[] }>("/api/currencies"), enabled: !!user });
  const addWallet = useMutation({
    mutationFn: (currency: string) => api("/api/wallets", { method: "POST", body: JSON.stringify({ currency }) }),
    onSuccess: async () => {
      setMessage(`${selectedCurrency} wallet added.`);
      setSelectedCurrency("");
      await client.invalidateQueries({ queryKey: ["mobile-wallets", user?.id] });
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Could not add wallet."),
  });
  const enabled = new Set(currencies.data?.enabled || []);
  const existing = new Set((query.data?.wallets || []).map((wallet) => wallet.currency));
  const available = (currencies.data?.currencies || []).filter((currency) => enabled.has(currency.code) && !existing.has(currency.code));
  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <FlatList
        data={query.data?.wallets || []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} tintColor={colors.light.primary} />}
        ListHeaderComponent={<><Text style={s.kicker}>YOUR MONEY</Text><Text style={s.title}>Wallets</Text><Text style={s.subtitle}>Balances across your GreenPay accounts.</Text>{query.isError && <Text style={s.error}>Wallets couldn’t load. Pull down to retry.</Text>}</>}
        renderItem={({ item }) => <WalletCard wallet={item} />}
        ListFooterComponent={<View style={s.addSection}>
          <Text style={s.addTitle}>Add a wallet</Text>
          <Text style={s.addHelp}>Choose an enabled currency for your account.</Text>
          {currencies.isLoading ? <ActivityIndicator color={colors.light.primary} /> : available.length ? <View style={s.currencyGrid}>
            {available.map((currency) => <Pressable key={currency.code} onPress={() => setSelectedCurrency(currency.code)} style={[s.currencyOption, selectedCurrency === currency.code && s.currencySelected]}>
              <Text style={s.currencyCode}>{currency.code}</Text><Text style={s.currencyName}>{currency.name || currency.code}</Text>
            </Pressable>)}
          </View> : <Text style={s.empty}>All enabled wallets are already added.</Text>}
          {selectedCurrency ? <Pressable disabled={addWallet.isPending} onPress={() => addWallet.mutate(selectedCurrency)} style={[s.addButton, addWallet.isPending && { opacity: 0.5 }]}><Text style={s.addButtonText}>{addWallet.isPending ? "Adding…" : `Add ${selectedCurrency} wallet`}</Text></Pressable> : null}
          {!!message && <Text accessibilityRole="alert" style={s.message}>{message}</Text>}
        </View>}
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
  empty: { color: colors.light.mutedForeground, textAlign: "center", marginTop: 18 }, error: { color: colors.light.destructive, fontSize: 13 },
  addSection: { marginTop: 22, padding: 15, borderRadius: 18, borderWidth: 1, borderColor: colors.light.border, backgroundColor: colors.light.card },
  addTitle: { color: colors.light.foreground, fontWeight: "800", fontSize: 15 }, addHelp: { color: colors.light.mutedForeground, fontSize: 12, marginTop: 5, marginBottom: 12 },
  currencyGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, currencyOption: { width: "48%", padding: 10, borderRadius: 12, borderWidth: 1, borderColor: colors.light.border },
  currencySelected: { borderColor: colors.light.primary, backgroundColor: colors.light.muted }, currencyCode: { color: colors.light.foreground, fontWeight: "800", fontSize: 12 }, currencyName: { color: colors.light.mutedForeground, fontSize: 10, marginTop: 3 },
  addButton: { minHeight: 46, borderRadius: 12, backgroundColor: colors.light.primary, alignItems: "center", justifyContent: "center", marginTop: 12 },
  addButtonText: { color: "#fff", fontSize: 13, fontWeight: "800" }, message: { color: colors.light.mutedForeground, fontSize: 12, marginTop: 10 },
});
