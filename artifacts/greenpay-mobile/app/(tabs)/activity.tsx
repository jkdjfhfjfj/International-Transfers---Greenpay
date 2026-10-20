import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/lib/api";
import { useAuth } from "@/context/auth";
import colors from "@/constants/colors";

type Transaction = { id: string; type: string; description?: string; amount: string | number; currency?: string; status?: string; createdAt?: string };

export default function ActivityScreen() {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ["mobile-transactions", user?.id],
    enabled: Boolean(user?.id),
    queryFn: () => api<{ transactions: Transaction[] }>(`/api/transactions/${encodeURIComponent(user!.id)}`),
  });
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <FlatList
        data={query.data?.transactions || []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} tintColor={colors.light.primary} />}
        ListHeaderComponent={<><Text style={styles.kicker}>ACCOUNT</Text><Text style={styles.title}>Activity</Text><Text style={styles.sub}>A clear record of your latest account movements.</Text>{query.isError && <Text style={styles.error}>Activity could not load. Pull down to try again.</Text>}</>}
        renderItem={({ item }) => <View style={styles.row}><View style={styles.icon}><Feather name={item.type === "deposit" ? "arrow-down-left" : "arrow-up-right"} size={18} color={colors.light.primary} /></View><View style={{ flex: 1 }}><Text numberOfLines={1} style={styles.label}>{item.description || item.type}</Text><Text style={styles.meta}>{item.status || "pending"}{item.createdAt ? ` · ${new Date(item.createdAt).toLocaleString()}` : ""}</Text></View><Text style={styles.amount}>{Number(item.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {item.currency || ""}</Text></View>}
        ListEmptyComponent={query.isLoading ? <ActivityIndicator color={colors.light.primary} style={{ marginTop: 48 }} /> : !query.isError ? <Text style={styles.empty}>No activity to show yet.</Text> : null}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.light.background },
  content: { paddingHorizontal: 20, paddingBottom: 32, flexGrow: 1 },
  kicker: { color: colors.light.primary, fontSize: 10, fontWeight: "700", letterSpacing: 1.6, marginTop: 14 },
  title: { color: colors.light.foreground, fontSize: 28, fontWeight: "700", marginTop: 5 },
  sub: { color: colors.light.mutedForeground, fontSize: 13, lineHeight: 19, marginTop: 6, marginBottom: 20 },
  error: { color: colors.light.destructive, fontSize: 13, marginBottom: 12 },
  row: { flexDirection: "row", gap: 12, alignItems: "center", minHeight: 72, borderBottomWidth: 1, borderBottomColor: colors.light.border },
  icon: { width: 38, height: 38, borderRadius: 13, backgroundColor: colors.light.muted, alignItems: "center", justifyContent: "center" },
  label: { color: colors.light.foreground, fontSize: 13, fontWeight: "600" },
  meta: { color: colors.light.mutedForeground, fontSize: 10, marginTop: 4, textTransform: "capitalize" },
  amount: { color: colors.light.foreground, fontSize: 11, fontWeight: "700" },
  empty: { color: colors.light.mutedForeground, textAlign: "center", marginTop: 48, fontSize: 13 },
});
