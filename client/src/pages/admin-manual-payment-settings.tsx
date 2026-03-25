import { useState, useEffect } from "react";
import AdminShell from "@/components/admin/admin-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Save, Smartphone, Info } from "lucide-react";

interface ManualPaymentData {
  paybill: string;
  account: string;
}

export default function AdminManualPaymentSettingsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [paybill, setPaybill] = useState("");
  const [account, setAccount] = useState("");

  const { data, isLoading } = useQuery<ManualPaymentData>({
    queryKey: ["/api/admin/manual-payment-settings"],
    queryFn: async () => {
      const r = await apiRequest("GET", "/api/admin/manual-payment-settings");
      return r.json();
    },
  });

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
      toast({ title: "Saved", description: "Manual payment settings updated successfully." });
      qc.invalidateQueries({ queryKey: ["/api/admin/manual-payment-settings"] });
    },
    onError: () => toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" }),
  });

  if (isLoading) {
    return (
      <AdminShell title="Manual Payment Settings">
        <div className="max-w-2xl">
          <div className="h-40 rounded-2xl bg-gray-200 animate-pulse" />
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell title="Manual Payment Settings">
      <div className="max-w-2xl space-y-6">
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-green-50">
                <Smartphone className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <CardTitle>M-Pesa Paybill Configuration</CardTitle>
                <CardDescription>Configure the paybill number and account shown to users for manual deposits</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm">Paybill Number</Label>
              <Input
                value={paybill}
                onChange={(e) => setPaybill(e.target.value)}
                placeholder="e.g., 247"
                className="rounded-xl"
              />
              <p className="text-xs text-gray-500">The M-Pesa paybill number users will send funds to</p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Account Number</Label>
              <Input
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                placeholder="e.g., 4664"
                className="rounded-xl"
              />
              <p className="text-xs text-gray-500">Account number for organizing deposits</p>
            </div>

            <div className="flex items-start gap-2 p-3 rounded-xl bg-green-50 border border-green-100">
              <Info className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-green-700">
                These details are displayed to users in the deposit section. Changes take effect immediately on the user app.
              </p>
            </div>

            <Button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="w-full rounded-xl bg-green-600 hover:bg-green-500">
              <Save className="w-4 h-4 mr-2" />
              {mutation.isPending ? "Saving..." : "Save Settings"}
            </Button>
          </CardContent>
        </Card>

        {data && (
          <Card className="rounded-2xl border-0 shadow-sm bg-gray-50">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Current Configuration</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-4">
              <div className="flex-1 text-center">
                <p className="text-xs text-gray-500 mb-2">Paybill Number</p>
                <Badge variant="outline" className="text-sm font-mono">{data.paybill || "—"}</Badge>
              </div>
              <div className="flex-1 text-center">
                <p className="text-xs text-gray-500 mb-2">Account Number</p>
                <Badge variant="outline" className="text-sm font-mono">{data.account || "—"}</Badge>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminShell>
  );
}
