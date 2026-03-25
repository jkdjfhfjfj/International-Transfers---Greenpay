import AdminShell from "@/components/admin/admin-shell";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users, DollarSign, TrendingUp, FileCheck, CreditCard,
  UserCheck, UserX, ArrowUpRight, Clock, Activity, BarChart3
} from "lucide-react";
import { useLocation } from "wouter";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, AreaChart, Area
} from "recharts";

interface DashboardMetrics {
  totalUsers: number; activeUsers: number; blockedUsers: number;
  totalTransactions: number; completedTransactions: number; pendingTransactions: number;
  totalVolume: number; totalRevenue: number; pendingKyc: number;
}
interface DashboardData {
  metrics: DashboardMetrics;
  transactionTrends: { date: string; count: number; volume: number }[];
  recentTransactions: any[];
}

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { data, isLoading } = useQuery<DashboardData>({ queryKey: ["/api/admin/dashboard"] });

  const metrics = data?.metrics;
  const trends = data?.transactionTrends || [];
  const recent = data?.recentTransactions || [];

  const statCards = [
    {
      label: "Total Users", value: metrics?.totalUsers ?? 0,
      sub: `${metrics?.activeUsers ?? 0} active · ${metrics?.blockedUsers ?? 0} blocked`,
      icon: Users, color: "blue", href: "/admin/users",
    },
    {
      label: "Transaction Volume", value: `$${(metrics?.totalVolume ?? 0).toLocaleString()}`,
      sub: `${metrics?.completedTransactions ?? 0} completed`,
      icon: DollarSign, color: "green", href: "/admin/transactions",
    },
    {
      label: "Revenue", value: `$${(metrics?.totalRevenue ?? 0).toLocaleString()}`,
      sub: "Platform earnings",
      icon: TrendingUp, color: "purple", href: "/admin/transactions",
    },
    {
      label: "Pending KYC", value: metrics?.pendingKyc ?? 0,
      sub: "Awaiting review",
      icon: FileCheck, color: "orange", href: "/admin/kyc",
    },
  ];

  const colorMap: Record<string, string> = {
    blue: "from-blue-500 to-blue-600",
    green: "from-emerald-500 to-green-600",
    purple: "from-violet-500 to-purple-600",
    orange: "from-orange-500 to-amber-500",
  };

  return (
    <AdminShell title="Dashboard">
      <div className="space-y-6">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-gray-200 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {statCards.map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.label}
                  onClick={() => setLocation(s.href)}
                  className={`relative bg-gradient-to-br ${colorMap[s.color]} text-white rounded-2xl p-5 text-left shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all group overflow-hidden`}
                >
                  <div className="absolute right-4 top-4 opacity-20 group-hover:opacity-30 transition-opacity">
                    <Icon className="w-12 h-12" />
                  </div>
                  <p className="text-white/80 text-xs font-medium uppercase tracking-wide mb-1">{s.label}</p>
                  <p className="text-3xl font-bold mb-1">{s.value}</p>
                  <p className="text-white/70 text-xs">{s.sub}</p>
                  <ArrowUpRight className="absolute right-4 bottom-4 w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              );
            })}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="rounded-2xl shadow-sm border-0 bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-gray-800">Transaction Volume</CardTitle>
              <CardDescription className="text-xs">Daily USD volume trend</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trends}>
                    <defs>
                      <linearGradient id="volumeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    <Area type="monotone" dataKey="volume" stroke="#10b981" strokeWidth={2} fill="url(#volumeGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-sm border-0 bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-gray-800">Transaction Count</CardTitle>
              <CardDescription className="text-xs">Daily count per day</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 rounded-2xl shadow-sm border-0 bg-white">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-gray-800">Recent Transactions</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setLocation("/admin/transactions")} className="text-xs text-green-600 hover:text-green-700">
                  View all <ArrowUpRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recent.length === 0 ? (
                <p className="text-center text-gray-400 py-8 text-sm">No recent transactions</p>
              ) : (
                <div className="divide-y divide-gray-50">
                  {recent.slice(0, 8).map((tx: any, i: number) => (
                    <div key={i} className="flex items-center justify-between py-2.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-600">
                          {tx.type?.charAt(0)?.toUpperCase() || "T"}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{tx.type || "Transaction"}</p>
                          <p className="text-xs text-gray-400">{tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : "—"}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-800">${Number(tx.amount || 0).toFixed(2)}</p>
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            tx.status === "completed" ? "border-green-200 text-green-700 bg-green-50" :
                            tx.status === "pending" ? "border-yellow-200 text-yellow-700 bg-yellow-50" :
                            "border-red-200 text-red-700 bg-red-50"
                          }`}
                        >
                          {tx.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-sm border-0 bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-gray-800">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { label: "Review KYC", icon: UserCheck, href: "/admin/kyc", color: "text-blue-600 bg-blue-50 hover:bg-blue-100" },
                { label: "Manage Users", icon: Users, href: "/admin/users", color: "text-purple-600 bg-purple-50 hover:bg-purple-100" },
                { label: "Withdrawals", icon: DollarSign, href: "/admin/withdrawals", color: "text-green-600 bg-green-50 hover:bg-green-100" },
                { label: "Virtual Cards", icon: CreditCard, href: "/admin/cards", color: "text-orange-600 bg-orange-50 hover:bg-orange-100" },
                { label: "System Logs", icon: Activity, href: "/admin/logs", color: "text-gray-600 bg-gray-50 hover:bg-gray-100" },
                { label: "Analytics", icon: BarChart3, href: "/admin/analytics", color: "text-indigo-600 bg-indigo-50 hover:bg-indigo-100" },
              ].map((a) => {
                const Icon = a.icon;
                return (
                  <button
                    key={a.href}
                    onClick={() => setLocation(a.href)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${a.color}`}
                  >
                    <Icon className="w-4 h-4" />
                    {a.label}
                    <ArrowUpRight className="w-3 h-3 ml-auto" />
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminShell>
  );
}
