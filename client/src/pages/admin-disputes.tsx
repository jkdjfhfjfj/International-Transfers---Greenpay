import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AdminShell from "@/components/admin/admin-shell";
import { AlertTriangle, CheckCircle, Clock, XCircle, Eye, ChevronDown } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  open: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  under_review: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  resolved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const REASON_LABELS: Record<string, string> = {
  unauthorized: "Unauthorized transaction",
  duplicate: "Duplicate charge",
  wrong_amount: "Wrong amount",
  fraud: "Fraud / Suspicious",
  other: "Other",
};

function DisputesManagement() {
  const [filterStatus, setFilterStatus] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["/api/admin/disputes"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/disputes");
      return res.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/disputes/${id}`, { status, adminNotes: notes });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Dispute Updated", description: "Dispute status has been updated." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/disputes"] });
      setExpandedId(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update dispute", variant: "destructive" });
    },
  });

  const disputes: any[] = (data as any)?.disputes || [];
  const filtered = filterStatus === "all" ? disputes : disputes.filter(d => d.status === filterStatus);

  const statusCounts = {
    all: disputes.length,
    open: disputes.filter(d => d.status === "open").length,
    under_review: disputes.filter(d => d.status === "under_review").length,
    resolved: disputes.filter(d => d.status === "resolved").length,
    rejected: disputes.filter(d => d.status === "rejected").length,
  };

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Open", count: statusCounts.open, color: "text-yellow-600", icon: <Clock className="w-4 h-4" /> },
          { label: "Under Review", count: statusCounts.under_review, color: "text-blue-600", icon: <Eye className="w-4 h-4" /> },
          { label: "Resolved", count: statusCounts.resolved, color: "text-green-600", icon: <CheckCircle className="w-4 h-4" /> },
          { label: "Rejected", count: statusCounts.rejected, color: "text-red-500", icon: <XCircle className="w-4 h-4" /> },
        ].map(stat => (
          <div key={stat.label} className="bg-card border border-border rounded-xl p-3">
            <div className={`flex items-center gap-1.5 ${stat.color} mb-1`}>
              {stat.icon}
              <span className="text-xs font-medium">{stat.label}</span>
            </div>
            <p className="text-2xl font-bold">{stat.count}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {["all", "open", "under_review", "resolved", "rejected"].map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterStatus === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
          >
            {s === "all" ? "All" : s.replace("_", " ")} ({statusCounts[s as keyof typeof statusCounts] ?? 0})
          </button>
        ))}
      </div>

      {/* Dispute List */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground text-sm">Loading disputes...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <AlertTriangle className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground text-sm">No disputes found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((dispute: any) => (
            <div key={dispute.id} className="bg-card border border-border rounded-xl overflow-hidden">
              <div
                className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => setExpandedId(expandedId === dispute.id ? null : dispute.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${STATUS_COLORS[dispute.status] || "bg-muted text-muted-foreground"}`}>
                        {dispute.status.replace("_", " ")}
                      </span>
                      <span className="text-xs text-muted-foreground">{REASON_LABELS[dispute.reason] || dispute.reason}</span>
                    </div>
                    <p className="font-medium text-sm">{dispute.userFullName || "Unknown User"}</p>
                    <p className="text-xs text-muted-foreground">{dispute.userEmail}</p>
                    {dispute.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{dispute.description}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground">{new Date(dispute.createdAt).toLocaleDateString()}</p>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground mt-1 ml-auto transition-transform ${expandedId === dispute.id ? "rotate-180" : ""}`} />
                  </div>
                </div>
              </div>

              {expandedId === dispute.id && (
                <div className="border-t border-border p-4 space-y-4 bg-muted/20">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Transaction ID</p>
                      <p className="font-mono text-xs break-all">{dispute.transactionId}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Filed On</p>
                      <p>{new Date(dispute.createdAt).toLocaleString()}</p>
                    </div>
                    {dispute.description && (
                      <div className="md:col-span-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">User Description</p>
                        <p className="text-sm">{dispute.description}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Admin Notes</label>
                    <textarea
                      rows={3}
                      value={adminNotes[dispute.id] ?? (dispute.adminNotes || "")}
                      onChange={e => setAdminNotes(prev => ({ ...prev, [dispute.id]: e.target.value }))}
                      placeholder="Add internal notes..."
                      className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background resize-none"
                    />
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {["open", "under_review", "resolved", "rejected"].map(s => (
                      <button
                        key={s}
                        onClick={() => updateMutation.mutate({ id: dispute.id, status: s, notes: adminNotes[dispute.id] ?? (dispute.adminNotes || "") })}
                        disabled={updateMutation.isPending || dispute.status === s}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-40 transition-colors ${
                          s === "resolved" ? "bg-green-600 text-white hover:bg-green-700" :
                          s === "rejected" ? "bg-red-600 text-white hover:bg-red-700" :
                          s === "under_review" ? "bg-blue-600 text-white hover:bg-blue-700" :
                          "bg-muted text-foreground hover:bg-muted/80"
                        }`}
                      >
                        {s.replace("_", " ")}
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

export default function AdminDisputesPage() {
  return <AdminShell title="Transaction Disputes"><DisputesManagement /></AdminShell>;
}
