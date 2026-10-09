import { useState, useEffect } from "react";
import AdminShell from "@/components/admin/admin-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Save, CreditCard, Info, CheckCircle2, CircleAlert, Copy } from "lucide-react";

interface PayHeroData {
  channelId?: string;
  virtualCardGateway?: string;
  kenyaMobileMoneyGateway?: string;
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
  const [kenyaMobileMoneyGateway, setKenyaMobileMoneyGateway] = useState("payhero");
  const [copiedCallbackUrl, setCopiedCallbackUrl] = useState<string | null>(null);

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
      setKenyaMobileMoneyGateway(String(data.kenyaMobileMoneyGateway || data.virtualCardGateway || "payhero"));
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("PUT", "/api/admin/payhero-settings", {
        channelId,
        cardPrice,
        kenyaMobileMoneyGateway,
      });
      const result = await r.json();
      if (!r.ok) throw new Error(result.message || "Failed to save payment settings.");
      return result;
    },
    onSuccess: () => {
      toast({ title: "Saved", description: "Payment settings updated successfully." });
      qc.invalidateQueries({ queryKey: ["/api/admin/payhero-settings"] });
    },
    onError: () => toast({ title: "Error", description: "Failed to save payment settings.", variant: "destructive" }),
  });

  const readinessMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/test-payment-providers");
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Readiness check failed");
      return result;
    },
    onSuccess: (result) => {
      toast({
        title: result.configured ? "Payment settings are ready" : "Payment setup is incomplete",
        description: result.configured
          ? "Required settings are present. This check does not send a payment."
          : "Some required settings are missing. This check does not send a payment.",
        variant: result.configured ? "default" : "destructive",
      });
      qc.invalidateQueries({ queryKey: ["/api/admin/payhero-settings"] });
    },
    onError: () => toast({ title: "Readiness check failed", description: "Unable to check payment settings.", variant: "destructive" }),
  });
  const providerStatusRows: Array<{ label: string; configured?: boolean }> = [
    { label: "PayHero mobile-money service", configured: data?.payheroConfigured },
    { label: "MakamescoPay mobile-money service", configured: data?.nexuspayConfigured },
    { label: "PayzaAPI hosted checkout", configured: data?.payzaConfigured },
    { label: "Paystack checkout", configured: data?.paystackConfigured },
  ];
  const appOrigin = typeof window === "undefined" ? "" : window.location.origin;
  const callbackUrls = [
    {
      id: "payzaapi",
      provider: "PayzaAPI",
      label: "Webhook callback (POST)",
      path: "/api/payzaapi/callback",
    },
    {
      id: "payzaapi-card-return",
      provider: "PayzaAPI",
      label: "Virtual-card checkout return",
      path: "/payment-processing?reference={reference}&type=virtual-card",
    },
    {
      id: "payzaapi-deposit-return",
      provider: "PayzaAPI",
      label: "Wallet-deposit checkout return",
      path: "/payment-processing?reference={reference}&type=deposit",
    },
    {
      id: "paystack-card",
      provider: "Paystack",
      label: "Virtual-card checkout return (GET)",
      path: "/api/payment-callback?type=virtual-card",
    },
    {
      id: "paystack-deposit",
      provider: "Paystack",
      label: "Wallet card-deposit return (GET)",
      path: "/api/payment-callback?reference={reference}&type=deposit",
    },
  ];

  const copyCallbackUrl = async (url: string, id: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedCallbackUrl(id);
      toast({ title: "Callback URL copied" });
      window.setTimeout(() => setCopiedCallbackUrl(null), 2000);
    } catch {
      toast({ title: "Copy failed", description: "Select and copy the callback URL manually.", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <AdminShell title="Payment Setup & Keys">
        <div className="h-40 rounded-2xl bg-gray-200 animate-pulse" />
      </AdminShell>
    );
  }

  return (
    <AdminShell title="Payment Setup & Keys">
      <div className="max-w-2xl space-y-6">
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-50">
                <CreditCard className="w-5 h-5 text-blue-600" />
              </div>
              <div>
              <CardTitle>Kenyan payments and card pricing</CardTitle>
              <CardDescription>Customers in Kenya can choose mobile money or card. Other countries use hosted checkout in the currency supported for their profile country.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {kenyaMobileMoneyGateway === "payhero" && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Channel ID</Label>
              <Input
                value={channelId}
                onChange={(e) => setChannelId(e.target.value)}
                placeholder="e.g., 133"
                className="rounded-xl"
              />
              <p className="text-xs text-gray-500">The channel ID for M-Pesa payments in Kenya.</p>
            </div>
            )}

            <div className="space-y-2">
              <Label className="text-sm font-medium">Virtual Card Price (USD)</Label>
              <Input
                value={cardPrice}
                onChange={(e) => setCardPrice(e.target.value)}
                placeholder="e.g., 60"
                className="rounded-xl"
              />
              <p className="text-xs text-gray-500">Base card price; checkout converts it to the payment currency for the customer’s profile country.</p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Kenyan mobile-money provider</Label>
              <Select value={kenyaMobileMoneyGateway} onValueChange={setKenyaMobileMoneyGateway}>
                <SelectTrigger className="rounded-xl" data-testid="select-kenya-mobile-money-provider">
                  <SelectValue placeholder="Choose a provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="payhero">PayHero — M-Pesa prompt</SelectItem>
                  <SelectItem value="nexuspay">MakamescoPay — mobile-money checkout</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">This choice applies to Kenyan mobile-money deposits and virtual-card purchases. Card payments and international hosted checkout use their designated flows.</p>
            </div>

            <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 border border-blue-100">
              <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-700">Store payment credentials in Replit Secrets. This form stores only non-secret pricing and provider selection.</p>
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

        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Provider credential setup</CardTitle>
            <CardDescription>Add these values in Replit Secrets for this project. This page only shows readiness and never stores or displays secret values.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <section className="space-y-2">
              <h3 className="text-sm font-semibold">PayHero mobile money</h3>
              <p className="text-xs text-muted-foreground">
                Add <code>PAYHERO_USERNAME</code> and <code>PAYHERO_PASSWORD</code>. Set the non-secret channel ID in the payment settings above.
              </p>
            </section>
            <section className="space-y-2">
              <h3 className="text-sm font-semibold">MakamescoPay mobile money</h3>
              <p className="text-xs text-muted-foreground">
                Add <code>NEXUSPAY_API_KEY</code> if this is the selected Kenyan mobile-money service.
              </p>
            </section>
            <section className="space-y-2">
              <h3 className="text-sm font-semibold">PayzaAPI requirements</h3>
              <p className="text-xs text-muted-foreground">
                Add PAYZA_PUBLIC_KEY, PAYZA_SECRET_KEY, and PAYZA_WEBHOOK_SECRET. The webhook signing secret is separate from the API key pair.
              </p>
              <p className="text-xs text-muted-foreground">
                Use matching test or live keys. Configure the same webhook signing secret in Replit Secrets as in the PayzaAPI dashboard.
              </p>
              <p className="text-xs text-muted-foreground">
                Hosted checkout uses the customer’s profile-country currency, disables STK push, and lets the customer choose an available method on the hosted page.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-semibold">Paystack requirements</h3>
              <p className="text-xs text-muted-foreground">
                Add PAYSTACK_SECRET_KEY_KES or PAYSTACK_SECRET_KEY. Virtual-card checkout is restricted to the card payment channel.
              </p>
            </section>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Callback URLs for this app host</h3>
              {callbackUrls.map(({ id, provider, label, path }) => {
                const url = `${appOrigin}${path}`;
                return (
                  <div key={id} className="space-y-2 rounded-xl border border-border p-3" data-testid={`callback-row-${id}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-medium">{provider} · {label}</p>
                        {id === "payzaapi" && (
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            Validates X-Payza-Signature as HMAC-SHA256 of the raw JSON body.
                          </p>
                        )}
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="shrink-0"
                        onClick={() => void copyCallbackUrl(url, id)}
                        data-testid={`button-copy-callback-${id}`}
                      >
                        <Copy className="mr-1 h-3.5 w-3.5" />
                        {copiedCallbackUrl === id ? "Copied" : "Copy"}
                      </Button>
                    </div>
                    <code className="block break-all rounded-lg bg-muted px-2 py-1.5 text-[11px]" data-testid={`text-callback-url-${id}`}>
                      {url || path}
                    </code>
                  </div>
                );
              })}
              <p className="text-xs text-muted-foreground">
                Use the HTTPS production host for live payments. These URLs are passed automatically when checkout is created; preview hosts are for development only.
              </p>
            </div>
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
                <Badge variant="outline" className="font-mono text-xs">USD {data.cardPrice || "—"}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Kenyan mobile-money provider</span>
                <Badge variant="outline" className="font-mono text-xs">{data.kenyaMobileMoneyGateway || data.virtualCardGateway || "—"}</Badge>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminShell>
  );
}
