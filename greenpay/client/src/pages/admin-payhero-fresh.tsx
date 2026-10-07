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
import { Save, CreditCard, Info, CheckCircle2, CircleAlert } from "lucide-react";

interface PayHeroData {
  channelId?: string;
  payheroConfigured?: boolean;
  nexuspayConfigured?: boolean;
  payzaConfigured?: boolean;
  paystackConfigured?: boolean;
  cardPrice?: string;
}

export default function AdminPayHeroSettingsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [channelId, setChannelId] = useState("");
  const [cardPrice, setCardPrice] = useState("");

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
      setCardPrice(String(data.cardPrice || ""));
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("PUT", "/api/admin/payhero-settings", {
        channelId,
        cardPrice,
      });
      const result = await r.json();
      if (!r.ok) throw new Error(result.message || "Failed to save PayHero settings.");
      return result;
    },
    onSuccess: () => {
      toast({ title: "Saved", description: "PayHero settings updated successfully." });
      qc.invalidateQueries({ queryKey: ["/api/admin/payhero-settings"] });
    },
    onError: (error: any) => toast({ title: "Error", description: error.message || "Failed to save PayHero settings.", variant: "destructive" }),
  });

  const readinessMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/test-payhero");
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Readiness check failed");
      return result;
    },
    onSuccess: (result) => {
      toast({
        title: result.configured ? "PayHero is ready" : "PayHero setup incomplete",
        description: `${result.message} This check never sends a payment.`,
        variant: result.configured ? "default" : "destructive",
      });
      qc.invalidateQueries({ queryKey: ["/api/admin/payhero-settings"] });
    },
    onError: (error: any) => toast({ title: "Readiness check failed", description: error.message, variant: "destructive" }),
  });
  const providerStatusRows: Array<{ label: string; configured?: boolean }> = [
    { label: "PayHero (KES)", configured: data?.payheroConfigured },
    { label: "PayzaAPI (other supported deposit currencies)", configured: data?.payzaConfigured },
    { label: "Paystack (separate card deposits)", configured: data?.paystackConfigured },
    { label: "NexusPay (legacy integrations)", configured: data?.nexuspayConfigured },
  ];

  if (isLoading) {
    return (
      <AdminShell title="PayHero Configuration">
        <div className="h-40 rounded-2xl bg-gray-200 animate-pulse" />
      </AdminShell>
    );
  }

  return (
    <AdminShell title="PayHero Configuration">
      <div className="max-w-2xl space-y-6">
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-50">
                <CreditCard className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <CardTitle>PayHero KES deposits</CardTitle>
                <CardDescription>Configure the PayHero channel used for Kenyan shilling M-Pesa deposits.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Channel ID</Label>
              <Input
                value={channelId}
                onChange={(e) => setChannelId(e.target.value)}
                placeholder="e.g., 133"
                className="rounded-xl"
              />
              <p className="text-xs text-gray-500">Your PayHero channel ID from the dashboard</p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Virtual Card Price (KES)</Label>
              <Input
                value={cardPrice}
                onChange={(e) => setCardPrice(e.target.value)}
                placeholder="e.g., 100"
                className="rounded-xl"
              />
              <p className="text-xs text-gray-500">Price charged when a user requests a virtual card.</p>
            </div>

            <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 border border-blue-100">
              <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-700">Store PAYHERO_USERNAME and PAYHERO_PASSWORD in Replit Secrets. Wallet deposits route KES through PayHero, other supported currencies through PayzaAPI, and card deposits through Paystack. Provider keys are not stored in this admin form.</p>
            </div>

            <div className="flex gap-2">
              <Button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-500">
                <Save className="w-4 h-4 mr-2" />
                {mutation.isPending ? "Saving..." : "Save settings"}
              </Button>
              <Button onClick={() => readinessMutation.mutate()} disabled={readinessMutation.isPending} variant="outline" className="flex-1 rounded-xl">
                {readinessMutation.isPending ? "Checking…" : "Check readiness"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Provider readiness</CardTitle>
            <CardDescription>Only status is shown here; secrets never leave Replit Secrets.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {providerStatusRows.map(({ label, configured }) => (
              <div key={label} className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 p-3">
                <span className="text-sm">{label}</span>
                <Badge variant="outline" className={configured ? "text-green-700 border-green-200" : "text-amber-700 border-amber-200"}>
                  {configured ? <><CheckCircle2 className="mr-1 h-3 w-3" />Ready</> : <><CircleAlert className="mr-1 h-3 w-3" />Not configured</>}
                </Badge>
              </div>
            ))}
            <p className="text-xs text-muted-foreground">Readiness checks only inspect local configuration. They do not call payment providers or initiate charges.</p>
          </CardContent>
        </Card>

        {data && (
          <Card className="rounded-2xl border-0 shadow-sm bg-gray-50">
            <CardHeader>
              <CardTitle className="text-sm">Current Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Channel ID</span>
                <Badge variant="outline" className="font-mono text-xs">{data.channelId || "—"}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Card Price</span>
                <Badge variant="outline" className="font-mono text-xs">KES {data.cardPrice || "—"}</Badge>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminShell>
  );
}
