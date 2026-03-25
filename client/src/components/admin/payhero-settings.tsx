import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Settings, Save, TestTube, CheckCircle, XCircle } from "lucide-react";

interface PayHeroSettingsData {
  channelId: string;
  provider: string;
  cardPrice: string;
  username?: string;
  password?: string;
}

interface ManualPaymentData {
  paybill: string;
  account: string;
}

export default function PayHeroSettings() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [settings, setSettings] = useState<PayHeroSettingsData>({
    channelId: "",
    provider: "m-pesa",
    cardPrice: ""
  });
  const [manualPayment, setManualPayment] = useState<ManualPaymentData>({
    paybill: "",
    account: ""
  });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const { data: payheroData, isLoading: payheroLoading } = useQuery<PayHeroSettingsData>({
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
    if (payheroData) {
      setSettings({
        channelId: String(payheroData.channelId || ""),
        provider: payheroData.provider || "m-pesa",
        cardPrice: String(payheroData.cardPrice || ""),
      });
    }
  }, [payheroData]);

  useEffect(() => {
    if (manualData) {
      setManualPayment({
        paybill: String(manualData.paybill || ""),
        account: String(manualData.account || ""),
      });
    }
  }, [manualData]);

  const savePayheroMutation = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("PUT", "/api/admin/payhero-settings", settings);
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/payhero-settings"] });
      toast({ title: "Settings Updated", description: "PayHero configuration has been saved successfully." });
    },
    onError: () => toast({ title: "Update Failed", description: "Failed to update PayHero settings.", variant: "destructive" }),
  });

  const saveManualMutation = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("PUT", "/api/admin/manual-payment-settings", manualPayment);
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/manual-payment-settings"] });
      toast({ title: "Settings Updated", description: "Manual payment configuration has been saved. Users will see these new payment details immediately." });
    },
    onError: () => toast({ title: "Update Failed", description: "Failed to update manual payment settings.", variant: "destructive" }),
  });

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const response = await apiRequest("POST", "/api/admin/test-payhero", {
        amount: 1,
        phone: "0700000000",
        reference: "TEST-" + Date.now()
      });
      const result = await response.json();
      setTestResult({
        success: result.success,
        message: result.success ? "PayHero connection successful!" : result.message || "Connection test failed"
      });
    } catch {
      setTestResult({ success: false, message: "Failed to test connection" });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">PayHero Settings</h2>
          <p className="text-gray-600 mt-1">Configure M-Pesa payment processing settings</p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Payment Gateway
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Configuration
            </CardTitle>
            <CardDescription>
              Update PayHero API settings for M-Pesa integration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {payheroLoading ? (
              <div className="space-y-3">
                <div className="h-10 rounded-lg bg-gray-100 animate-pulse" />
                <div className="h-10 rounded-lg bg-gray-100 animate-pulse" />
                <div className="h-10 rounded-lg bg-gray-100 animate-pulse" />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="channelId">Channel ID</Label>
                  <Input
                    id="channelId"
                    type="number"
                    value={settings.channelId}
                    onChange={(e) => setSettings({ ...settings, channelId: e.target.value })}
                    placeholder="e.g., 608"
                    data-testid="input-channel-id"
                  />
                  <p className="text-sm text-gray-500">Your PayHero payment channel ID from dashboard</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="provider">Provider</Label>
                  <Select
                    value={settings.provider}
                    onValueChange={(value) => setSettings({ ...settings, provider: value })}
                  >
                    <SelectTrigger data-testid="select-provider">
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="m-pesa">M-Pesa</SelectItem>
                      <SelectItem value="sasapay">SasaPay</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-500">Payment provider for processing transactions</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cardPrice">Virtual Card Price (USD)</Label>
                  <Input
                    id="cardPrice"
                    type="number"
                    step="0.01"
                    value={settings.cardPrice}
                    onChange={(e) => setSettings({ ...settings, cardPrice: e.target.value })}
                    placeholder="60.00"
                    data-testid="input-card-price"
                  />
                  <p className="text-sm text-gray-500">Price for purchasing virtual cards (automatically synced to user side)</p>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => savePayheroMutation.mutate()}
                    disabled={savePayheroMutation.isPending}
                    className="flex-1"
                    data-testid="button-save-settings"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {savePayheroMutation.isPending ? "Saving..." : "Save Settings"}
                  </Button>

                  <Button
                    onClick={handleTest}
                    variant="outline"
                    disabled={testing}
                    className="flex-1"
                    data-testid="button-test-connection"
                  >
                    <TestTube className="w-4 h-4 mr-2" />
                    {testing ? "Testing..." : "Test Connection"}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Connection Status & Test Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="w-5 h-5" />
              Connection Status
            </CardTitle>
            <CardDescription>
              Test PayHero API connectivity and monitor status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {testResult && (
              <div className={`p-4 rounded-lg border ${testResult.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                <div className="flex items-center gap-2 mb-2">
                  {testResult.success ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span className={`font-medium ${testResult.success ? "text-green-800" : "text-red-800"}`}>
                    {testResult.success ? "Connection Successful" : "Connection Failed"}
                  </span>
                </div>
                <p className={`text-sm ${testResult.success ? "text-green-700" : "text-red-700"}`}>
                  {testResult.message}
                </p>
              </div>
            )}

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Current Channel ID:</span>
                <Badge variant="outline">{settings.channelId || "—"}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Provider:</span>
                <Badge variant="outline" className="capitalize">{settings.provider}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Card Price:</span>
                <Badge variant="outline">${settings.cardPrice || "—"}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">API Endpoint:</span>
                <Badge variant="secondary">backend.payhero.co.ke</Badge>
              </div>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-medium text-gray-900 mb-2">Test Instructions:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Click "Test Connection" to verify API connectivity</li>
                <li>• Test uses a minimal 1 KES transaction</li>
                <li>• Successful test confirms channel is active</li>
                <li>• Failed tests indicate configuration issues</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Manual M-Pesa Payment Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Manual M-Pesa Payment Settings
          </CardTitle>
          <CardDescription>
            Configure alternative manual payment method for virtual card purchases (second priority after PayHero)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {manualLoading ? (
            <div className="space-y-3">
              <div className="h-10 rounded-lg bg-gray-100 animate-pulse" />
              <div className="h-10 rounded-lg bg-gray-100 animate-pulse" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="paybill">Paybill Number</Label>
                  <Input
                    id="paybill"
                    value={manualPayment.paybill}
                    onChange={(e) => setManualPayment({ ...manualPayment, paybill: e.target.value })}
                    placeholder="e.g., 247"
                    data-testid="input-paybill"
                  />
                  <p className="text-sm text-gray-500">M-Pesa paybill number for manual payments</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="account">Account Number</Label>
                  <Input
                    id="account"
                    value={manualPayment.account}
                    onChange={(e) => setManualPayment({ ...manualPayment, account: e.target.value })}
                    placeholder="e.g., 4664"
                    data-testid="input-account"
                  />
                  <p className="text-sm text-gray-500">Account number for manual M-Pesa payments</p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800 flex items-start gap-2">
                  <span className="material-icons text-sm mt-0.5">info</span>
                  <span>
                    These settings are displayed to users as an alternative payment method on the virtual card purchase page.
                    Changes take effect immediately for all users.
                  </span>
                </p>
              </div>

              <Button
                onClick={() => saveManualMutation.mutate()}
                disabled={saveManualMutation.isPending}
                data-testid="button-save-manual-payment"
              >
                <Save className="w-4 h-4 mr-2" />
                {saveManualMutation.isPending ? "Saving..." : "Save Manual Payment Settings"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Additional Info */}
      <Card>
        <CardHeader>
          <CardTitle>Important Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Channel ID Requirements:</h4>
              <ul className="space-y-1">
                <li>• Must be a valid PayHero channel ID</li>
                <li>• Found in PayHero dashboard under "Payment Channels"</li>
                <li>• Each channel has specific settings and limits</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Provider Options:</h4>
              <ul className="space-y-1">
                <li>• <strong>M-Pesa:</strong> Standard mobile money (most common)</li>
                <li>• <strong>SasaPay:</strong> Alternative mobile payment platform</li>
                <li>• Provider must match your PayHero channel setup</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
