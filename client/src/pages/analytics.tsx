import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { WavyHeader } from "@/components/wavy-header";
import { formatNumber } from "@/lib/formatters";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, DollarSign, Activity } from "lucide-react";

const PIE_COLORS = ["#10b981", "#6366f1", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316", "#84cc16"];

export default function AnalyticsPage() {
  const { user } = useAuth();

  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ["/api/analytics/summary"],
    enabled: !!user?.id,
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/analytics/summary");
      return res.json();
    },
  });

  const { data: transactionData } = useQuery({
    queryKey: ["/api/transactions", user?.id],
    enabled: !!user?.id,
  });

  const monthlyData = (analyticsData as any)?.monthlyData || [];
  const categoryData = (analyticsData as any)?.categoryData || [];
  const summary = (analyticsData as any)?.summary || { totalIn: 0, totalOut: 0, txCount: 0, netFlow: 0 };
  const transactions = (transactionData as any)?.transactions || [];

  const isPositiveFlow = summary.netFlow >= 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-xl p-3 shadow-lg text-xs space-y-1">
          <p className="font-semibold text-foreground mb-1">{label}</p>
          {payload.map((p: any) => (
            <p key={p.name} style={{ color: p.color }}>{p.name}: ${formatNumber(p.value)}</p>
          ))}
        </div>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const total = categoryData.reduce((s: number, d: any) => s + d.value, 0);
      return (
        <div className="bg-card border border-border rounded-xl p-3 shadow-lg text-xs">
          <p className="font-semibold">{payload[0].name}</p>
          <p className="text-muted-foreground">${formatNumber(payload[0].value)} ({((payload[0].value / total) * 100).toFixed(1)}%)</p>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <WavyHeader size="sm" />
        <div className="p-4 text-center py-16 text-muted-foreground text-sm">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <WavyHeader size="sm" />

      <div className="p-4 space-y-5">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-xl font-bold">My Analytics</h1>
          <p className="text-sm text-muted-foreground">Insights across your last 6 months</p>
        </motion.div>

        {/* Summary Cards */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white p-4 rounded-2xl">
            <div className="flex items-center gap-1.5 mb-1">
              <ArrowDownRight className="w-4 h-4" />
              <p className="text-xs text-green-100">Total In</p>
            </div>
            <p className="text-xl font-bold">${formatNumber(summary.totalIn)}</p>
          </div>
          <div className="bg-gradient-to-br from-red-500 to-rose-600 text-white p-4 rounded-2xl">
            <div className="flex items-center gap-1.5 mb-1">
              <ArrowUpRight className="w-4 h-4" />
              <p className="text-xs text-red-100">Total Out</p>
            </div>
            <p className="text-xl font-bold">${formatNumber(summary.totalOut)}</p>
          </div>
          <div className={`${isPositiveFlow ? "bg-gradient-to-br from-blue-500 to-indigo-600" : "bg-gradient-to-br from-orange-500 to-amber-600"} text-white p-4 rounded-2xl`}>
            <div className="flex items-center gap-1.5 mb-1">
              {isPositiveFlow ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <p className="text-xs opacity-80">Net Flow</p>
            </div>
            <p className="text-xl font-bold">{isPositiveFlow ? "+" : ""}${formatNumber(Math.abs(summary.netFlow))}</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-4 rounded-2xl">
            <div className="flex items-center gap-1.5 mb-1">
              <Activity className="w-4 h-4" />
              <p className="text-xs text-emerald-100">Transactions</p>
            </div>
            <p className="text-xl font-bold">{summary.txCount}</p>
          </div>
        </motion.div>

        {/* Monthly Area Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card border border-border rounded-2xl p-4 elevation-1">
          <h2 className="text-sm font-semibold mb-4">Money Flow · Last 6 Months</h2>
          {monthlyData.length === 0 || monthlyData.every((d: any) => d.sent === 0 && d.received === 0) ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-30" />
              No transaction data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={monthlyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorReceived" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.1} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="received" name="Received" stroke="#10b981" strokeWidth={2} fill="url(#colorReceived)" />
                <Area type="monotone" dataKey="sent" name="Sent" stroke="#ef4444" strokeWidth={2} fill="url(#colorSent)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Category Bar Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-card border border-border rounded-2xl p-4 elevation-1">
          <h2 className="text-sm font-semibold mb-4">Spending by Category</h2>
          {categoryData.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">No category data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={categoryData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.1} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Amount" radius={[4, 4, 0, 0]}>
                  {categoryData.map((_: any, i: number) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Pie Chart */}
        {categoryData.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card border border-border rounded-2xl p-4 elevation-1">
            <h2 className="text-sm font-semibold mb-4">Spending Distribution</h2>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={35} outerRadius={65} dataKey="value" paddingAngle={3}>
                    {categoryData.map((_: any, i: number) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {categoryData.map((item: any, i: number) => {
                  const total = categoryData.reduce((s: number, d: any) => s + d.value, 0);
                  const pct = total > 0 ? ((item.value / total) * 100).toFixed(0) : 0;
                  return (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <p className="text-xs text-muted-foreground flex-1 truncate">{item.name}</p>
                      <p className="text-xs font-semibold">{pct}%</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* Recent Activity Summary */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-card border border-border rounded-2xl p-4 elevation-1">
          <h2 className="text-sm font-semibold mb-3">Recent Transactions</h2>
          {transactions.slice(0, 5).map((txn: any) => {
            const isOut = ["send", "withdraw", "card_purchase", "exchange", "airtime", "bill"].includes(txn.type);
            return (
              <div key={txn.id} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isOut ? "bg-red-100 dark:bg-red-900/30" : "bg-green-100 dark:bg-green-900/30"}`}>
                    <span className={`material-icons text-sm ${isOut ? "text-red-600" : "text-green-600"}`}>{isOut ? "arrow_upward" : "arrow_downward"}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium capitalize">{txn.type.replace("_", " ")}</p>
                    <p className="text-xs text-muted-foreground">{new Date(txn.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <p className={`text-sm font-semibold ${isOut ? "text-red-500" : "text-green-500"}`}>
                  {isOut ? "-" : "+"}${formatNumber(txn.amount)}
                </p>
              </div>
            );
          })}
          {transactions.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No transactions yet</p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
