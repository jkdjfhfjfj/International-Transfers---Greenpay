import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AdminShell from "@/components/admin/admin-shell";
import { CheckCircle2, Clock, XCircle, RefreshCw, ChevronDown } from "lucide-react";

const COIN_COLORS: Record<string, string> = {
  BTC: "text-orange-500",
  ETH: "text-purple-500",
  USDT: "text-green-500",
  USDC: "text-blue-500",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  confirming: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  failed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

function CryptoManagement() {
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<Record<string, string>>({});
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["/api/admin/crypto/transactions"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/crypto/transactions");
      return res.json();
    },
    refetchInterval: 30000,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, hash, notes }: { id: string; status: string; hash?: string; notes?: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/crypto/transactions/${id}`, {
        status,
        txHash: hash || undefined,
        adminNotes: notes || undefined,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Transaction Updated", description: "Crypto transaction has been updated." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/crypto/transactions"] });
      setExpandedId(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update transaction", variant: "destructive" });
    },
  });

  const txns: any[] = (data as any)?.transactions || [];

  let filtered = txns;
  if (filterStatus !== "all") filtered = filtered.filter(t => t.status === filterStatus);
  if (filterType !== "all") filtered = filtered.filter(t => t.type === filterType);

  const totalVolume = txns.filter(t => t.status === "completed").reduce((s, t) => s + parseFloat(t.usdValue || "0"), 0);
  const pendingCount = txns.filter(t => t.status === "pending" || t.status === "confirming").length;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-xl p-3">
          <p className="text-xs text-muted-foreground">Total Transactions</p>
          <p className="text-2xl font-bold">{txns.length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-3">
          <p className="text-xs text-yellow-600">Pending / Confirming</p>
          <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-3">
          <p className="text-xs text-green-600">Completed Volume</p>
          <p className="text-2xl font-bold text-green-600">${totalVolume.toFixed(2)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-3">
          <p className="text-xs text-muted-foreground">Deposits</p>
          <p className="text-2xl font-bold">{txns.filter(t => t.type === "deposit").length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {["all", "pending", "confirming", "completed", "failed"].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterStatus === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
            {s}
          </button>
        ))}
        <div className="w-px bg-border mx-1" />
        {["all", "deposit", "withdrawal", "card_purchase"].map(t => (
          <button key={t} onClick={() => setFilterType(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterType === t ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground"}`}>
            {t.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Transaction List */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground text-sm">Loading transactions...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">No crypto transactions found</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((tx: any) => (
            <div key={tx.id} className="bg-card border border-border rounded-xl overflow-hidden">
              <div
                className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => setExpandedId(expandedId === tx.id ? null : tx.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <span className={`text-sm font-bold ${COIN_COLORS[tx.coin] || ""}`}>{tx.coin?.[0]}</span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${STATUS_COLORS[tx.status] || "bg-muted"}`}>{tx.status}</span>
                        <span className="text-xs text-muted-foreground capitalize">{tx.type.replace("_", " ")}</span>
                        <span className={`text-xs font-bold ${COIN_COLORS[tx.coin] || ""}`}>{tx.coin}</span>
                      </div>
                      <p className="font-medium text-sm mt-0.5">{tx.userFullName || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">{tx.userEmail}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-sm">${tx.usdValue}</p>
                    <p className="text-xs text-muted-foreground">{parseFloat(tx.amount).toFixed(6)} {tx.coin}</p>
                    <p className="text-xs text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {expandedId === tx.id && (
                <div className="border-t border-border p-4 space-y-4 bg-muted/20">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Transaction ID</p>
                      <p className="font-mono text-xs break-all">{tx.id}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Network</p>
                      <p>{tx.network}</p>
                    </div>
                    {tx.toAddress && (
                      <div className="md:col-span-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">To Address</p>
                        <p className="font-mono text-xs break-all">{tx.toAddress}</p>
                      </div>
                    )}
                    {tx.fromAddress && (
                      <div className="md:col-span-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">From Address</p>
                        <p className="font-mono text-xs break-all">{tx.fromAddress}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Confirmations</p>
                      <p>{tx.confirmations} / {tx.requiredConfirmations} required</p>
                    </div>
                    {tx.txHash && (
                      <div className="md:col-span-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">TX Hash</p>
                        <p className="font-mono text-xs break-all">{tx.txHash}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">TX Hash (if confirming)</label>
                    <input
                      type="text"
                      value={txHash[tx.id] ?? (tx.txHash || "")}
                      onChange={e => setTxHash(prev => ({ ...prev, [tx.id]: e.target.value }))}
                      placeholder="0x..."
                      className="w-full text-xs border border-border rounded-lg px-3 py-2 bg-background font-mono"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Admin Notes</label>
                    <textarea
                      rows={2}
                      value={adminNotes[tx.id] ?? (tx.adminNotes || "")}
                      onChange={e => setAdminNotes(prev => ({ ...prev, [tx.id]: e.target.value }))}
                      placeholder="Internal notes..."
                      className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background resize-none"
                    />
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {["confirming", "completed", "failed"].map(s => (
                      <button
                        key={s}
                        onClick={() => updateMutation.mutate({
                          id: tx.id,
                          status: s,
                          hash: txHash[tx.id] || undefined,
                          notes: adminNotes[tx.id] || undefined,
                        })}
                        disabled={updateMutation.isPending || tx.status === s}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-40 transition-colors ${
                          s === "completed" ? "bg-green-600 text-white hover:bg-green-700" :
                          s === "failed" ? "bg-red-600 text-white hover:bg-red-700" :
                          "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                      >
                        {updateMutation.isPending ? <RefreshCw className="w-3 h-3 animate-spin inline mr-1" /> : null}
                        Mark {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminCryptoPage() {
  return <AdminShell title="Crypto Management"><CryptoManagement /></AdminShell>;
}
