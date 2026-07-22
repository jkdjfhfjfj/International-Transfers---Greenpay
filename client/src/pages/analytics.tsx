import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { WavyHeader } from "@/components/wavy-header";
import { formatNumber } from "@/lib/formatters";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import { TrendingUp, TrendingDown, ArrowDownLeft, ArrowUpRight, Activity, DollarSign } from "lucide-react";

// ── Currency helpers ────────────────────────────────────────────────────────
function getCurrencySymbol(currency?: string): string {
  const map: Record<string, string> = {
    USD: '$', EUR: '€', GBP: '£', KES: 'KSh', NGN: '₦',
    GHS: 'GH₵', UGX: 'USh', TZS: 'TSh', RWF: 'FRw',
    ZAR: 'R', XOF: 'CFA', MAD: 'MAD', EGP: 'E£', ZMW: 'ZK',
    AED: 'AED', CAD: 'CA$', AUD: 'A$', INR: '₹', CNY: '¥', JPY: '¥',
  };
  return map[(currency || '').toUpperCase()] ?? (currency?.toUpperCase() || '$');
}

function formatCurrencyAmount(amount: number, currency?: string): string {
  const sym = getCurrencySymbol(currency);
  return `${sym} ${formatNumber(amount)}`;
}

// Palette for chart bars / currency cards
const PALETTE = [
  '#10b981', '#6366f1', '#f59e0b', '#ef4444',
  '#8b5cf6', '#06b6d4', '#f97316', '#84cc16',
];

// Currency flag emoji lookup (common ones)
const CURRENCY_FLAG: Record<string, string> = {
  USD: '🇺🇸', EUR: '🇪🇺', GBP: '🇬🇧', KES: '🇰🇪', NGN: '🇳🇬',
  GHS: '🇬🇭', UGX: '🇺🇬', TZS: '🇹🇿', RWF: '🇷🇼', ZAR: '🇿🇦',
  XOF: '🌍', MAD: '🇲🇦', EGP: '🇪🇬', ZMW: '🇿🇲', AED: '🇦🇪',
  CAD: '🇨🇦', AUD: '🇦🇺', INR: '🇮🇳', CNY: '🇨🇳', JPY: '🇯🇵',
};

// ── Component ────────────────────────────────────────────────────────────────
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

  const monthlyData   = (analyticsData as any)?.monthlyData  || [];
  const categoryData  = (analyticsData as any)?.categoryData || [];
  const summary       = (analyticsData as any)?.summary      || { totalIn: 0, totalOut: 0, txCount: 0, netFlow: 0 };
  const transactions  = (transactionData  as any)?.transactions || [];

  const isPositiveFlow = summary.netFlow >= 0;

  // ── Compute spend per currency from raw transactions ───────────────────────
  const SENT_TYPES = new Set(["send", "withdraw", "card_purchase", "exchange", "airtime", "bill"]);
  const currencyMap: Record<string, { sent: number; received: number; txCount: number }> = {};
  for (const t of transactions) {
    const cur = (t.currency || 'USD').toUpperCase();
    if (!currencyMap[cur]) currencyMap[cur] = { sent: 0, received: 0, txCount: 0 };
    currencyMap[cur].txCount += 1;
    const amt = parseFloat(t.amount) || 0;
    if (SENT_TYPES.has(t.type)) currencyMap[cur].sent += amt;
    else currencyMap[cur].received += amt;
  }
  const currencyBreakdown = Object.entries(currencyMap)
    .map(([code, val]) => ({ code, ...val }))
    .sort((a, b) => (b.sent + b.received) - (a.sent + a.received));

  const maxCurrencyTotal = Math.max(...currencyBreakdown.map(c => c.sent + c.received), 1);

  // ── Custom tooltips ────────────────────────────────────────────────────────
  const AreaTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-card border border-border rounded-xl p-3 shadow-lg text-xs space-y-1">
        <p className="font-semibold mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }}>
            {p.name}: ${formatNumber(p.value)}
          </p>
        ))}
      </div>
    );
  };

  const BarTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-card border border-border rounded-xl p-3 shadow-lg text-xs">
        <p className="font-semibold mb-1">{label}</p>
        <p style={{ color: payload[0].color }}>${formatNumber(payload[0].value)}</p>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <WavyHeader size="sm" />
        <div className="p-4 text-center py-16 text-muted-foreground text-sm">Loading analytics…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <WavyHeader size="sm" />

      <div className="p-4 space-y-5">

        {/* ── Header ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-xl font-bold">My Analytics</h1>
          <p className="text-sm text-muted-foreground">Insights across your last 6 months</p>
        </motion.div>

        {/* ── Summary Cards ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 gap-3"
        >
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white p-4 rounded-2xl">
            <div className="flex items-center gap-1.5 mb-1">
              <ArrowDownLeft className="w-4 h-4" />
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

          <div className={`${isPositiveFlow
            ? "bg-gradient-to-br from-blue-500 to-indigo-600"
            : "bg-gradient-to-br from-orange-500 to-amber-600"
          } text-white p-4 rounded-2xl`}>
            <div className="flex items-center gap-1.5 mb-1">
              {isPositiveFlow
                ? <TrendingUp className="w-4 h-4" />
                : <TrendingDown className="w-4 h-4" />}
              <p className="text-xs opacity-80">Net Flow</p>
            </div>
            <p className="text-xl font-bold">
              {isPositiveFlow ? "+" : ""}${formatNumber(Math.abs(summary.netFlow))}
            </p>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-4 rounded-2xl">
            <div className="flex items-center gap-1.5 mb-1">
              <Activity className="w-4 h-4" />
              <p className="text-xs text-emerald-100">Transactions</p>
            </div>
            <p className="text-xl font-bold">{summary.txCount}</p>
          </div>
        </motion.div>

        {/* ── Money Flow Area Chart ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-2xl p-4 elevation-1"
        >
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
                    <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.1} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
                <Tooltip content={<AreaTooltip />} />
                <Area type="monotone" dataKey="received" name="Received" stroke="#10b981" strokeWidth={2} fill="url(#colorReceived)" />
                <Area type="monotone" dataKey="sent"     name="Sent"     stroke="#ef4444" strokeWidth={2} fill="url(#colorSent)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* ── Spend per Currency ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-card border border-border rounded-2xl overflow-hidden elevation-1"
        >
          {/* Section header */}
          <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border">
            <div>
              <h2 className="text-sm font-semibold">Activity by Currency</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Sent &amp; received across all wallets</p>
            </div>
            <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
              {currencyBreakdown.length} {currencyBreakdown.length === 1 ? 'currency' : 'currencies'}
            </span>
          </div>

          {currencyBreakdown.length === 0 ? (
            <div className="text-center py-10 text-sm text-muted-foreground">
              <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-30" />
              No transactions yet
            </div>
          ) : (
            <div className="divide-y divide-border">
              {currencyBreakdown.map((c, i) => {
                const total     = c.sent + c.received;
                const sentPct   = total > 0 ? (c.sent     / total) * 100 : 0;
                const recvPct   = total > 0 ? (c.received / total) * 100 : 0;
                const trackPct  = total / maxCurrencyTotal; // width of the whole bar track
                const color     = PALETTE[i % PALETTE.length];
                const flag      = CURRENCY_FLAG[c.code] ?? '🌐';
                const sym       = getCurrencySymbol(c.code);

                return (
                  <div key={c.code} className="px-4 py-3.5">
                    {/* Row 1: flag + code + total */}
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xl leading-none">{flag}</span>
                        <div>
                          <p className="text-sm font-semibold">{c.code}</p>
                          <p className="text-xs text-muted-foreground">{c.txCount} {c.txCount === 1 ? 'transaction' : 'transactions'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">{sym}&thinsp;{formatNumber(total)}</p>
                        <p className="text-xs text-muted-foreground">total</p>
                      </div>
                    </div>

                    {/* Stacked bar: green = received, red = sent */}
                    <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                      {/* track width proportional to largest currency */}
                      <div
                        className="absolute inset-y-0 left-0 flex rounded-full overflow-hidden"
                        style={{ width: `${trackPct * 100}%` }}
                      >
                        <div className="h-full bg-green-500" style={{ width: `${recvPct}%` }} />
                        <div className="h-full bg-red-400"   style={{ width: `${sentPct}%`  }} />
                      </div>
                    </div>

                    {/* Row 3: received / sent breakdown */}
                    <div className="flex items-center gap-4 mt-2">
                      {c.received > 0 && (
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                          <span className="text-xs text-muted-foreground">In&nbsp;</span>
                          <span className="text-xs font-medium text-green-600">
                            {sym}&thinsp;{formatNumber(c.received)}
                          </span>
                        </div>
                      )}
                      {c.sent > 0 && (
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                          <span className="text-xs text-muted-foreground">Out&nbsp;</span>
                          <span className="text-xs font-medium text-red-500">
                            {sym}&thinsp;{formatNumber(c.sent)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* ── Spending by Category Bar Chart ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-2xl p-4 elevation-1"
        >
          <h2 className="text-sm font-semibold mb-1">Spending by Category</h2>
          <p className="text-xs text-muted-foreground mb-4">Normalised to USD equivalent</p>
          {categoryData.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">No category data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={categoryData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.1} />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
                <Tooltip content={<BarTooltip />} />
                <Bar dataKey="value" name="Amount" radius={[4, 4, 0, 0]}>
                  {categoryData.map((_: any, i: number) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* ── Recent Transactions ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-card border border-border rounded-2xl p-4 elevation-1"
        >
          <h2 className="text-sm font-semibold mb-3">Recent Transactions</h2>
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No transactions yet</p>
          ) : (
            transactions.slice(0, 5).map((txn: any) => {
              const isOut = SENT_TYPES.has(txn.type);
              const sym   = getCurrencySymbol(txn.currency);
              return (
                <div key={txn.id} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isOut
                        ? "bg-red-100 dark:bg-red-900/30"
                        : "bg-green-100 dark:bg-green-900/30"
                    }`}>
                      <span className={`material-icons text-sm ${isOut ? "text-red-600" : "text-green-600"}`}>
                        {isOut ? "arrow_upward" : "arrow_downward"}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium capitalize">{txn.type.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-muted-foreground">{new Date(txn.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <p className={`text-sm font-semibold ${isOut ? "text-red-500" : "text-green-500"}`}>
                    {isOut ? "−" : "+"}{sym}&thinsp;{formatNumber(txn.amount)}
                  </p>
                </div>
              );
            })
          )}
        </motion.div>

      </div>
    </div>
  );
}
