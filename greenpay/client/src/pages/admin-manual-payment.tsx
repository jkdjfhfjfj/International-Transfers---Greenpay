import { useState, useEffect } from "react";
import AdminShell from "@/components/admin/admin-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Save, Smartphone, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function AdminManualPaymentPage() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<any>({
    queryKey: ["/api/admin/manual-payment-settings"],
    queryFn: async () => {
      const r = await apiRequest("GET", "/api/admin/manual-payment-settings");
      return r.json();
    },
  });

  const [paybill, setPaybill] = useState("");
  const [account, setAccount] = useState("");

  useEffect(() => {
    if (data) {
      setPaybill(String(data.paybill || ""));
      setAccount(String(data.account || ""));
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("PUT", "/api/admin/manual-payment-settings", { paybill, account });
      return r.json();
    },
    onSuccess: () => {
      toast({ title: "Saved", description: "Manual payment settings updated." });
      qc.invalidateQueries({ queryKey: ["/api/admin/manual-payment-settings"] });
    },
    onError: () => toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" }),
  });

  return (
    <AdminShell title="Manual Payment">
      <div className="max-w-2xl space-y-6">
        <Card className="rounded-2xl border-0 shadow-sm bg-white">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-green-50">
                <Smartphone className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">M-Pesa Paybill Configuration</CardTitle>
                <CardDescription className="text-xs">
                  Configure the paybill number and account customers use for manual deposits
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {isLoading ? (
              <div className="space-y-3">
                <div className="h-10 rounded-lg bg-gray-100 animate-pulse" />
                <div className="h-10 rounded-lg bg-gray-100 animate-pulse" />
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-700">Paybill Number</Label>
                  <Input
                    value={paybill}
                    onChange={(e) => setPaybill(e.target.value)}
                    placeholder="e.g., 247"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-700">Account Number</Label>
                  <Input
                    value={account}
                    onChange={(e) => setAccount(e.target.value)}
                    placeholder="e.g., 4664"
                    className="rounded-xl"
                  />
                </div>
                <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 border border-blue-100">
                  <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-700">
                    These details are shown to users when they select Manual Payment as the deposit method.
                    Changes take effect immediately on the user app.
                  </p>
                </div>
                <Button
                  onClick={() => mutation.mutate()}
                  disabled={mutation.isPending}
                  className="w-full rounded-xl bg-green-600 hover:bg-green-500"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {mutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {data && (
          <Card className="rounded-2xl border-0 shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-gray-700">Current Saved Configuration</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-4">
              <div className="flex-1 p-3 rounded-xl bg-gray-50 text-center">
                <p className="text-xs text-gray-500 mb-1">Paybill</p>
                <Badge variant="outline" className="text-sm font-mono">{data.paybill || "—"}</Badge>
              </div>
              <div className="flex-1 p-3 rounded-xl bg-gray-50 text-center">
                <p className="text-xs text-gray-500 mb-1">Account</p>
                <Badge variant="outline" className="text-sm font-mono">{data.account || "—"}</Badge>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminShell>
  );
}
