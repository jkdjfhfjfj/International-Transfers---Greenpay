import { useState, useEffect } from "react";
import AdminShell from "@/components/admin/admin-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Save, Smartphone, CreditCard, Info, TestTube } from "lucide-react";

interface PaymentData {
  paybill: string;
  account: string;
  channelId?: string;
  provider?: string;
  cardPrice?: string;
}

export default function AdminPaymentMethodsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();

  // Manual Payment state
  const [paybill, setPaybill] = useState("");
  const [account, setAccount] = useState("");

  // PayHero state
  const [channelId, setChannelId] = useState("");
  const [provider, setProvider] = useState("m-pesa");
  const [cardPrice, setCardPrice] = useState("");

  const { data: manualData, isLoading: manualLoading } = useQuery({
    queryKey: ["/api/admin/manual-payment-settings"],
    queryFn: async () => {
      const r = await apiRequest("GET", "/api/admin/manual-payment-settings");
      return r.json();
    },
  });

  const { data: payHeroData, isLoading: payHeroLoading } = useQuery({
    queryKey: ["/api/admin/payhero-settings"],
    queryFn: async () => {
      const r = await apiRequest("GET", "/api/admin/payhero-settings");
      return r.json();
    },
  });

  useEffect(() => {
    if (manualData) {
      setPaybill(String(manualData.paybill || ""));
      setAccount(String(manualData.account || ""));
    }
  }, [manualData]);

  useEffect(() => {
    if (payHeroData) {
      setChannelId(String(payHeroData.channelId || ""));
      setProvider(payHeroData.provider || "m-pesa");
      setCardPrice(String(payHeroData.cardPrice || ""));
    }
  }, [payHeroData]);

  const manualMutation = useMutation({
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

  const payHeroMutation = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("PUT", "/api/admin/payhero-settings", { channelId, provider, cardPrice });
      return r.json();
    },
    onSuccess: () => {
      toast({ title: "Saved", description: "PayHero settings updated." });
      qc.invalidateQueries({ queryKey: ["/api/admin/payhero-settings"] });
    },
    onError: () => toast({ title: "Error", description: "Failed to save PayHero settings.", variant: "destructive" }),
  });

  const isLoading = manualLoading || payHeroLoading;

  if (isLoading) {
    return (
      <AdminShell title="Payment Methods">
        <div className="space-y-6">
          <div className="h-40 rounded-2xl bg-gray-200 animate-pulse" />
          <div className="h-40 rounded-2xl bg-gray-200 animate-pulse" />
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell title="Payment Methods">
      <div className="max-w-2xl space-y-6">
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-green-50">
                <Smartphone className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <CardTitle>M-Pesa Manual Payment</CardTitle>
                <CardDescription>Configure paybill number and account for manual M-Pesa deposits</CardDescription>
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
              <p className="text-xs text-gray-500">M-Pesa paybill users will send funds to</p>
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
              <p className="text-xs text-green-700">These details are displayed to users in the deposit section. Changes take effect immediately.</p>
            </div>

            <Button onClick={() => manualMutation.mutate()} disabled={manualMutation.isPending} className="w-full rounded-xl bg-green-600 hover:bg-green-500">
              <Save className="w-4 h-4 mr-2" />
              {manualMutation.isPending ? "Saving..." : "Save Manual Payment"}
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-50">
                <CreditCard className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <CardTitle>PayHero Configuration</CardTitle>
                <CardDescription>Configure PayHero gateway for card and mobile money payments</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm">Channel ID</Label>
              <Input
                value={channelId}
                onChange={(e) => setChannelId(e.target.value)}
                placeholder="Enter PayHero channel ID"
                className="rounded-xl"
              />
              <p className="text-xs text-gray-500">Your PayHero integration channel ID</p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Primary Provider</Label>
              <Select value={provider} onValueChange={setProvider}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="m-pesa">M-Pesa</SelectItem>
                  <SelectItem value="airtel">Airtel Money</SelectItem>
                  <SelectItem value="equity">Equity Bank</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Virtual Card Price (KES)</Label>
              <Input
                value={cardPrice}
                onChange={(e) => setCardPrice(e.target.value)}
                placeholder="e.g., 100"
                className="rounded-xl"
              />
              <p className="text-xs text-gray-500">Cost charged to users for virtual card issuance</p>
            </div>

            <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 border border-blue-100">
              <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-700">PayHero enables seamless payments. Ensure your channel ID and credentials are correct.</p>
            </div>

            <Button onClick={() => payHeroMutation.mutate()} disabled={payHeroMutation.isPending} className="w-full rounded-xl bg-blue-600 hover:bg-blue-500">
              <Save className="w-4 h-4 mr-2" />
              {payHeroMutation.isPending ? "Saving..." : "Save PayHero Configuration"}
            </Button>
          </CardContent>
        </Card>

        {(manualData || payHeroData) && (
          <Card className="rounded-2xl border-0 shadow-sm bg-gray-50">
            <CardHeader>
              <CardTitle className="text-sm">Current Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {manualData && (
                <div>
                  <p className="text-xs font-semibold text-gray-700 mb-2">Manual Payment</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div><p className="text-xs text-gray-500">Paybill</p><Badge variant="outline" className="text-xs font-mono">{manualData.paybill || "—"}</Badge></div>
                    <div><p className="text-xs text-gray-500">Account</p><Badge variant="outline" className="text-xs font-mono">{manualData.account || "—"}</Badge></div>
                  </div>
                </div>
              )}
              {payHeroData && (
                <div>
                  <p className="text-xs font-semibold text-gray-700 mb-2">PayHero</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div><p className="text-xs text-gray-500">Channel</p><Badge variant="outline" className="text-xs font-mono">{payHeroData.channelId || "—"}</Badge></div>
                    <div><p className="text-xs text-gray-500">Provider</p><Badge variant="outline" className="text-xs font-mono">{payHeroData.provider || "—"}</Badge></div>
                    <div><p className="text-xs text-gray-500">Card Price</p><Badge variant="outline" className="text-xs font-mono">KES {payHeroData.cardPrice || "—"}</Badge></div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AdminShell>
  );
}
