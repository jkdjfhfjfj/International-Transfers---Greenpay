import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Check, X } from "lucide-react";
import AdminShell from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type DeletionRequest = {
  id: string;
  userId: string;
  reason: string;
  status: string;
  adminNote?: string | null;
  requestedAt?: string | null;
  fullName?: string | null;
  email?: string | null;
};

export default function AdminAccountDeletionsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const { data, isLoading, isError } = useQuery<{ requests: DeletionRequest[] }>({
    queryKey: ["/api/admin/account-deletion-requests"],
    queryFn: async () => (await apiRequest("GET", "/api/admin/account-deletion-requests")).json(),
  });
  const reviewMutation = useMutation({
    mutationFn: async ({ id, decision }: { id: string; decision: "approve" | "reject" }) => {
      const response = await apiRequest("POST", `/api/admin/account-deletion-requests/${id}/review`, {
        decision,
        adminNote: notes[id] || "",
      });
      return response.json();
    },
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ["/api/admin/account-deletion-requests"] });
      toast({ title: "Request reviewed", description: result.message });
    },
    onError: (error: any) => toast({ title: "Review failed", description: error.message, variant: "destructive" }),
  });
  const requests = data?.requests || [];

  return (
    <AdminShell title="Account Deletion Requests">
      <div className="space-y-5 p-4 md:p-6">
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:bg-amber-950/30 dark:text-amber-100">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0" />
          <p>Approval disables account access and redacts identifying profile fields. KYC evidence is retained for six months after approval, then purged. Financial audit records remain. Requests cannot be approved while the account has funds or pending transactions.</p>
          </div>
        </div>
        {isLoading ? <p className="text-sm text-muted-foreground">Loading requests…</p>
          : isError ? <p className="text-sm text-destructive">Could not load deletion requests.</p>
          : requests.length === 0 ? <p className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">No account deletion requests yet.</p>
          : requests.map((request) => (
            <section key={request.id} className="space-y-3 rounded-xl border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{request.fullName || "Unknown account"}</h2>
                  <p className="text-sm text-muted-foreground">{request.email || request.userId}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Requested {request.requestedAt ? new Date(request.requestedAt).toLocaleString() : "date unavailable"} · {request.status}
                  </p>
                </div>
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-900">{request.status}</span>
              </div>
              <div className="rounded-lg bg-muted p-3 text-sm whitespace-pre-wrap">{request.reason}</div>
              {request.status === "pending" && (
                <>
                  <textarea
                    rows={2}
                    maxLength={1000}
                    value={notes[request.id] || ""}
                    onChange={(event) => setNotes((previous) => ({ ...previous, [request.id]: event.target.value }))}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Admin note (required when rejecting)"
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button disabled={reviewMutation.isPending} onClick={() => reviewMutation.mutate({ id: request.id, decision: "approve" })}>
                      <Check className="mr-2 h-4 w-4" /> Approve and redact
                    </Button>
                    <Button variant="destructive" disabled={reviewMutation.isPending || (notes[request.id] || "").trim().length < 5} onClick={() => reviewMutation.mutate({ id: request.id, decision: "reject" })}>
                      <X className="mr-2 h-4 w-4" /> Reject
                    </Button>
                  </div>
                </>
              )}
              {request.adminNote && <p className="text-sm text-muted-foreground">Admin note: {request.adminNote}</p>}
            </section>
          ))}
      </div>
    </AdminShell>
  );
}
