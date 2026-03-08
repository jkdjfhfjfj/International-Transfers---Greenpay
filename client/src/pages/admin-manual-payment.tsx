import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ManualPaymentSettings {
  paybill: string;
  account: string;
}

export default function AdminManualPaymentPage() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth();
  const [settings, setSettings] = useState<ManualPaymentSettings>({
    paybill: "",
    account: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/admin/login");
      return;
    }
    if (!authLoading && isAuthenticated) {
      loadSettings();
    }
  }, [authLoading, isAuthenticated, setLocation]);

  const loadSettings = async () => {
    try {
      const response = await apiRequest("/api/admin/settings", "GET");
      const payBill = response.find((s: any) => s.key === "manual_payment_paybill");
      const account = response.find((s: any) => s.key === "manual_payment_account");
      setSettings({
        paybill: payBill?.value || "",
        account: account?.value || ""
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load manual payment settings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiRequest("/api/admin/settings", "POST", {
        settings: [
          { key: "manual_payment_paybill", value: settings.paybill, category: "payments" },
          { key: "manual_payment_account", value: settings.account, category: "payments" }
        ]
      });
      toast({
        title: "Success",
        description: "Manual payment settings saved successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save manual payment settings",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/admin/dashboard")}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-3xl font-bold">Manual Payment Settings</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>M-Pesa Paybill Configuration</CardTitle>
            <CardDescription>
              Configure the M-Pesa paybill number and account for manual payment processing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="paybill">Paybill Number</Label>
              <Input
                id="paybill"
                value={settings.paybill}
                onChange={(e) => setSettings({ ...settings, paybill: e.target.value })}
                placeholder="e.g., 247"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="account">Account Number</Label>
              <Input
                id="account"
                value={settings.account}
                onChange={(e) => setSettings({ ...settings, account: e.target.value })}
                placeholder="e.g., 4664"
              />
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Saving..." : "Save Settings"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
