import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/lib/api";
import { useAuth } from "@/context/auth";
import colors from "@/constants/colors";
type Summary = { totalIn?: number; totalOut?: number; txCount?: number; netFlow?: number };
type Monthly = { label?: string; sent?: number; received?: number };
type Transaction = { currency?: string; type?: string; amount?: number | string };
export default function AnalyticsScreen() {
  const { user } = useAuth();
  const summaryQuery = useQuery({ queryKey: ["mobile-analytics", user?.id], queryFn: () => api<{ summary?: Summary; monthlyData?: Monthly[]; categoryData?: { name?: string; value?: number }[] }>("/api/analytics/summary"), enabled: !!user });
  const txQuery = useQuery({ queryKey: ["mobile-transactions", user?.id], queryFn: () => api<{ transactions: Transaction[] }>(`/api/transactions/${user?.id}`), enabled: !!user });
  const summary = summaryQuery.data?.summary || {};
  const sentTypes = new Set(["send", "withdraw", "card_purchase", "exchange", "airtime", "bill"]);
  const currencies = new Map<string, { sent: number; received: number; count: number }>();
  for (const transaction of txQuery.data?.transactions || []) {
    const code = (transaction.currency || "KES").toUpperCase(); const row = currencies.get(code) || { sent: 0, received: 0, count: 0 };
    const amount = Number(transaction.amount || 0); row.count += 1;
    if (sentTypes.has(transaction.type || "")) row.sent += amount; else row.received += amount;
    currencies.set(code, row);
  }
  const monthly = summaryQuery.data?.monthlyData || [];
  const categories = summaryQuery.data?.categoryData || [];
  const currencyRows = [...currencies.entries()].sort((a, b) => (b[1].sent + b[1].received) - (a[1].sent + a[1].received));
  return <SafeAreaView style={s.safe} edges={["top"]}><ScrollView contentContainerStyle={s.page}>
    <Text style={s.kicker}>ACCOUNT OVERVIEW</Text><Text style={s.title}>Analytics</Text><Text style={s.sub}>A summary of your GreenPay activity.</Text>
    {summaryQuery.isLoading ? <ActivityIndicator color={colors.light.primary} style={{ margin: 20 }} /> : summaryQuery.isError ? <Text style={s.error}>Analytics are unavailable. Pull to refresh or try again later.</Text> : <>
      <View style={s.grid}>
        <Metric label="TOTAL RECEIVED" value={summary.totalIn} />
        <Metric label="TOTAL SENT" value={summary.totalOut} />
        <Metric label="NET FLOW" value={summary.netFlow} />
        <Metric label="TRANSACTIONS" value={summary.txCount} />
      </View>
      <Text style={s.section}>MONTHLY ACTIVITY</Text>
      {monthly.length ? monthly.map((item, i) => <View key={`${item.label || "month"}-${i}`} style={s.row}><Text style={s.rowTitle}>{item.label || `Period ${i + 1}`}</Text><Text style={s.rowValue}>In {fmt(item.received)} · Out {fmt(item.sent)}</Text></View>) : <Text style={s.empty}>Monthly activity will appear as you use your account.</Text>}
      <Text style={s.section}>BY CURRENCY</Text>
      {txQuery.isLoading ? <ActivityIndicator color={colors.light.primary} /> : currencyRows.length ? currencyRows.map(([code, row]) => <View key={code} style={s.row}><View><Text style={s.rowTitle}>{code}</Text><Text style={s.rowValue}>{row.count} transactions</Text></View><Text style={s.rowValue}>In {fmt(row.received)} · Out {fmt(row.sent)}</Text></View>) : <Text style={s.empty}>No transaction activity yet.</Text>}
      {categories.length > 0 ? <><Text style={s.section}>CATEGORIES</Text>{categories.map((item, i) => <View key={`${item.name || "category"}-${i}`} style={s.row}><Text style={s.rowTitle}>{item.name || "Other"}</Text><Text style={s.rowValue}>{fmt(item.value)}</Text></View>)}</> : null}
    </>}
  </ScrollView></SafeAreaView>;
}
function fmt(value?: number) { const n = Number(value || 0); return Number.isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "0"; }
function Metric({ label, value }: { label: string; value?: number }) { return <View style={s.metric}><Text style={s.metricLabel}>{label}</Text><Text style={s.metricValue}>{fmt(value)}</Text></View>; }
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.light.background }, page: { padding: 20, paddingBottom: 34 }, kicker: { color: colors.light.primary, fontSize: 10, fontWeight: "800", letterSpacing: 1.4, marginTop: 10 },
  title: { color: colors.light.foreground, fontSize: 28, fontWeight: "800", marginTop: 5 }, sub: { color: colors.light.mutedForeground, fontSize: 13, marginTop: 6, marginBottom: 18 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 9 }, metric: { width: "48%", minHeight: 86, padding: 13, borderRadius: 15, borderWidth: 1, borderColor: colors.light.border, backgroundColor: colors.light.card },
  metricLabel: { color: colors.light.mutedForeground, fontSize: 9, fontWeight: "800", letterSpacing: .6 }, metricValue: { color: colors.light.foreground, fontSize: 19, fontWeight: "800", marginTop: 10 },
  section: { color: colors.light.mutedForeground, fontSize: 10, fontWeight: "800", letterSpacing: 1, marginTop: 23, marginBottom: 8 },
  row: { minHeight: 54, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.light.border, flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  rowTitle: { color: colors.light.foreground, fontSize: 12, fontWeight: "700" }, rowValue: { color: colors.light.mutedForeground, fontSize: 10, textAlign: "right" },
  empty: { color: colors.light.mutedForeground, fontSize: 12, paddingVertical: 10 }, error: { color: colors.light.destructive, fontSize: 13 },
});
