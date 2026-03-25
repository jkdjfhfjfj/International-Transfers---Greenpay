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
import { Save, Smartphone, CreditCard, Info } from "lucide-react";

interface PayHeroData {
  channelId: string;
  provider: string;
  cardPrice: string;
}

interface ManualPaymentData {
  paybill: string;
  account: string;
}

export default function AdminPayHeroPage() {
  const { toast } = useToast();
  const qc = useQueryClient();

  // PayHero state
  const [channelId, setChannelId] = useState("");
  const [provider, setProvider] = useState("m-pesa");
  const [cardPrice, setCardPrice] = useState("");

  // Manual payment state
  const [paybill, setPaybill] = useState("");
  const [account, setAccount] = useState("");

  const { data: payHeroData, isLoading: payHeroLoading } = useQuery<PayHeroData>({
    queryKey: ["/api/admin/payhero-settings"],
    queryFn: async () => {
      const r = await apiRequest("GET", "/api/admin/payhero-settings");
      return r.json();
    },
  });

  const { data: manualData, isLoading: manualLoading } = useQuery<ManualPaymentData>({
    queryKey: ["/api/admin/manual-payment-settings"],
    queryFn: async () => {
      const r = await apiRequest("GET", "/api/admin/manual-payment-settings");
      return r.json();
    },
  });

  useEffect(() => {
    if (payHeroData) {
      setChannelId(String(payHeroData.channelId || ""));
      setProvider(payHeroData.provider || "m-pesa");
      setCardPrice(String(payHeroData.cardPrice || ""));
    }
  }, [payHeroData]);

  useEffect(() => {
    if (manualData) {
      setPaybill(String(manualData.paybill || ""));
      setAccount(String(manualData.account || ""));
    }
  }, [manualData]);

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

  const manualMutation = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("PUT", "/api/admin/manual-payment-settings", { paybill, account });
      return r.json();
    },
    onSuccess: () => {
      toast({ title: "Saved", description: "Manual payment settings updated." });
      qc.invalidateQueries({ queryKey: ["/api/admin/manual-payment-settings"] });
    },
    onError: () => toast({ title: "Error", description: "Failed to save manual payment settings.", variant: "destructive" }),
  });

  const isLoading = payHeroLoading || manualLoading;

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
        <Card className="rounded-2xl border-0 shadow-sm bg-white">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-50">
                <CreditCard className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">PayHero Configuration</CardTitle>
                <CardDescription className="text-xs">
                  Configure PayHero payment gateway settings for card payments
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Channel ID</Label>
              <Input
                value={channelId}
                onChange={(e) => setChannelId(e.target.value)}
                placeholder="Enter PayHero channel ID"
                className="rounded-xl"
              />
              <p className="text-xs text-gray-500">Unique identifier for your PayHero channel</p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Provider</Label>
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
              <Label className="text-sm font-medium text-gray-700">Card Price (KES)</Label>
              <Input
                value={cardPrice}
                onChange={(e) => setCardPrice(e.target.value)}
                placeholder="e.g., 100"
                className="rounded-xl"
              />
              <p className="text-xs text-gray-500">Cost charged to users for virtual card issuance</p>
            </div>

            <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 border border-blue-100">
              <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-700">
                PayHero gateway enables users to make payments using mobile money and cards.
              </p>
            </div>

            <Button
              onClick={() => payHeroMutation.mutate()}
              disabled={payHeroMutation.isPending}
              className="w-full rounded-xl bg-blue-600 hover:bg-blue-500"
            >
              <Save className="w-4 h-4 mr-2" />
              {payHeroMutation.isPending ? "Saving..." : "Save PayHero Settings"}
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm bg-white">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-green-50">
                <Smartphone className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">Manual Payment Details</CardTitle>
                <CardDescription className="text-xs">
                  Configure the M-Pesa paybill for manual deposits shown to users
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Paybill Number</Label>
              <Input
                value={paybill}
                onChange={(e) => setPaybill(e.target.value)}
                placeholder="e.g., 247"
                className="rounded-xl"
              />
              <p className="text-xs text-gray-500">M-Pesa paybill number users will send funds to</p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Account Number</Label>
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
                These details are displayed to users in the deposit section. Changes apply immediately.
              </p>
            </div>

            <Button
              onClick={() => manualMutation.mutate()}
              disabled={manualMutation.isPending}
              className="w-full rounded-xl bg-green-600 hover:bg-green-500"
            >
              <Save className="w-4 h-4 mr-2" />
              {manualMutation.isPending ? "Saving..." : "Save Manual Payment"}
            </Button>
          </CardContent>
        </Card>

        {(payHeroData || manualData) && (
          <Card className="rounded-2xl border-0 shadow-sm bg-gray-50">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-gray-700">Current Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {payHeroData && (
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">Channel ID</p>
                    <Badge variant="outline" className="text-xs font-mono">{payHeroData.channelId || "—"}</Badge>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">Provider</p>
                    <Badge variant="outline" className="text-xs font-mono">{payHeroData.provider || "—"}</Badge>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">Card Price</p>
                    <Badge variant="outline" className="text-xs font-mono">{payHeroData.cardPrice || "—"}</Badge>
                  </div>
                </div>
              )}
              {manualData && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">Paybill</p>
                    <Badge variant="outline" className="text-xs font-mono">{manualData.paybill || "—"}</Badge>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">Account</p>
                    <Badge variant="outline" className="text-xs font-mono">{manualData.account || "—"}</Badge>
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
