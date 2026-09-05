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
import { Save, CreditCard, Info } from "lucide-react";

interface PayHeroData {
  channelId?: string;
  username?: string;
  password?: string;
  provider?: string;
  cardPrice?: string;
}

export default function AdminPayHeroSettingsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [channelId, setChannelId] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
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
      setUsername(String(data.username || ""));
      setCardPrice(String(data.cardPrice || ""));
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("PUT", "/api/admin/payhero-settings", {
        channelId,
        username,
        password: password || undefined,
        cardPrice,
      });
      return r.json();
    },
    onSuccess: () => {
      toast({ title: "Saved", description: "PayHero settings updated successfully." });
      setPassword("");
      qc.invalidateQueries({ queryKey: ["/api/admin/payhero-settings"] });
    },
    onError: () => toast({ title: "Error", description: "Failed to save PayHero settings.", variant: "destructive" }),
  });

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
                <CardTitle>PayHero Gateway Setup</CardTitle>
                <CardDescription>Configure your PayHero credentials for card and mobile money payments</CardDescription>
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
              <Label className="text-sm font-medium">Username</Label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Your PayHero username"
                className="rounded-xl"
              />
              <p className="text-xs text-gray-500">PayHero account username</p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Password</Label>
              <Input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="Only enter if updating password"
                className="rounded-xl"
              />
              <p className="text-xs text-gray-500">Leave empty to keep current password</p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Virtual Card Price (KES)</Label>
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
              <p className="text-xs text-blue-700">Ensure all credentials are correct. PayHero enables seamless payments across multiple channels.</p>
            </div>

            <Button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="w-full rounded-xl bg-blue-600 hover:bg-blue-500">
              <Save className="w-4 h-4 mr-2" />
              {mutation.isPending ? "Saving..." : "Save PayHero Configuration"}
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
                <span className="text-xs text-gray-600">Channel ID</span>
                <Badge variant="outline" className="font-mono text-xs">{data.channelId || "—"}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Username</span>
                <Badge variant="outline" className="font-mono text-xs">{data.username ? "●●●●●●" : "—"}</Badge>
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
