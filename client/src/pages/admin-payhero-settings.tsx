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
import { Save, CreditCard, Info, TestTube } from "lucide-react";

interface PayHeroData {
  channelId: string;
  provider: string;
  cardPrice: string;
}

export default function AdminPayHeroSettingsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [channelId, setChannelId] = useState("");
  const [provider, setProvider] = useState("m-pesa");
  const [cardPrice, setCardPrice] = useState("");
  const [testPhone, setTestPhone] = useState("");
  const [testAmount, setTestAmount] = useState("1");
  const [testing, setTesting] = useState(false);

  const { data, isLoading } = useQuery<PayHeroData>({
    queryKey: ["/api/admin/payhero-settings"],
    queryFn: async () => {
      const r = await apiRequest("GET", "/api/admin/payhero-settings");
      return r.json();
    },
  });

  useEffect(() => {
    if (data) {
      setChannelId(String(data.channelId || ""));
      setProvider(data.provider || "m-pesa");
      setCardPrice(String(data.cardPrice || ""));
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("PUT", "/api/admin/payhero-settings", { channelId, provider, cardPrice });
      return r.json();
    },
    onSuccess: () => {
      toast({ title: "Saved", description: "PayHero settings updated successfully." });
      qc.invalidateQueries({ queryKey: ["/api/admin/payhero-settings"] });
    },
    onError: () => toast({ title: "Error", description: "Failed to save PayHero settings.", variant: "destructive" }),
  });

  const handleTestConnection = async () => {
    if (!testPhone || !testAmount) {
      toast({ title: "Error", description: "Enter phone number and amount.", variant: "destructive" });
      return;
    }

    setTesting(true);
    try {
      const r = await apiRequest("POST", "/api/admin/test-payhero", {
        phone: testPhone,
        amount: testAmount,
        reference: `TEST-${Date.now()}`,
      });
      if (r.ok) {
        const result = await r.json();
        toast({ title: "Test Sent", description: "PayHero connection test initiated. Check logs for result." });
      } else {
        throw new Error("Test failed");
      }
    } catch {
      toast({ title: "Error", description: "Failed to test PayHero connection.", variant: "destructive" });
    } finally {
      setTesting(false);
    }
  };

  if (isLoading) {
    return (
      <AdminShell title="PayHero Settings">
        <div className="max-w-2xl">
          <div className="h-40 rounded-2xl bg-gray-200 animate-pulse" />
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell title="PayHero Settings">
      <div className="max-w-2xl space-y-6">
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-50">
                <CreditCard className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <CardTitle>PayHero Configuration</CardTitle>
                <CardDescription>Configure PayHero payment gateway for card and mobile money payments</CardDescription>
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
              <p className="text-xs text-gray-500">Your unique PayHero integration channel ID</p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Primary Provider</Label>
              <Select value={provider} onValueChange={setProvider}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="m-pesa">M-Pesa (Safaricom)</SelectItem>
                  <SelectItem value="airtel">Airtel Money</SelectItem>
                  <SelectItem value="equity">Equity Bank</SelectItem>
                  <SelectItem value="ktb">KCB Bank</SelectItem>
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
              <p className="text-xs text-blue-700">
                PayHero enables seamless mobile money and card payments. Ensure your channel ID and credentials are correct.
              </p>
            </div>

            <Button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="w-full rounded-xl bg-blue-600 hover:bg-blue-500">
              <Save className="w-4 h-4 mr-2" />
              {mutation.isPending ? "Saving..." : "Save PayHero Configuration"}
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-50">
                <TestTube className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-base">Test Connection</CardTitle>
                <CardDescription>Test PayHero integration with a sample transaction</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm">Phone Number</Label>
              <Input
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="e.g., 254700000000"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Test Amount (KES)</Label>
              <Input
                value={testAmount}
                onChange={(e) => setTestAmount(e.target.value)}
                placeholder="1"
                className="rounded-xl"
              />
            </div>

            <Button onClick={handleTestConnection} disabled={testing} className="w-full rounded-xl bg-purple-600 hover:bg-purple-500">
              <TestTube className="w-4 h-4 mr-2" />
              {testing ? "Testing..." : "Test Connection"}
            </Button>
          </CardContent>
        </Card>

        {data && (
          <Card className="rounded-2xl border-0 shadow-sm bg-gray-50">
            <CardHeader>
              <CardTitle className="text-sm">Current Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Channel ID:</span>
                <Badge variant="outline" className="font-mono">{data.channelId || "—"}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Provider:</span>
                <Badge variant="outline" className="font-mono">{data.provider || "—"}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Card Price:</span>
                <Badge variant="outline" className="font-mono">KES {data.cardPrice || "—"}</Badge>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminShell>
  );
}
