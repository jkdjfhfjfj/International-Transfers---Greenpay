import { useState, useEffect } from "react";
import AdminShell from "@/components/admin/admin-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Save, DollarSign, Shield, Bell, Settings, Globe, MessageCircle } from "lucide-react";

interface SystemSettings {
  fees?: {
    transfer_fee: string;
    exchange_rate_margin: string;
    virtual_card_fee: string;
    withdrawal_fee: string;
  };
  security?: {
    two_factor_required: boolean;
    kyc_auto_approval: boolean;
    pin_required: boolean;
    enable_otp_feature: boolean;
    otp_email_enabled: boolean;
    otp_sms_enabled: boolean;
    otp_whatsapp_enabled: boolean;
    max_daily_limit: string;
  };
  notifications?: {
    email_notifications: boolean;
    sms_notifications: boolean;
    push_notifications: boolean;
    admin_alerts: boolean;
  };
  general?: {
    platform_name: string;
    support_email: string;
    default_currency: string;
    session_timeout: string;
    terms_url: string;
    maintenance_message: string;
    maintenance_mode: boolean;
  };
  whatsapp?: {
    phone_number_id: string;
    business_account_id: string;
    access_token: string;
    is_active: boolean;
  };
}

export default function AdminSystemSettingsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();

  // Fees state
  const [transferFee, setTransferFee] = useState("");
  const [exchangeMargin, setExchangeMargin] = useState("");
  const [cardFee, setCardFee] = useState("");
  const [withdrawalFee, setWithdrawalFee] = useState("");

  // Security state
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [kycAutoApproval, setKycAutoApproval] = useState(true);
  const [pinRequired, setPinRequired] = useState(false);
  const [enableOtp, setEnableOtp] = useState(true);
  const [otpEmail, setOtpEmail] = useState(true);
  const [otpSms, setOtpSms] = useState(true);
  const [otpWhatsapp, setOtpWhatsapp] = useState(false);
  const [maxDailyLimit, setMaxDailyLimit] = useState("");

  // Notifications state
  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);
  const [adminAlerts, setAdminAlerts] = useState(true);

  // General state
  const [platformName, setPlatformName] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [currency, setCurrency] = useState("");
  const [sessionTimeout, setSessionTimeout] = useState("");
  const [termsUrl, setTermsUrl] = useState("");
  const [maintenanceMsg, setMaintenanceMsg] = useState("");
  const [maintenance, setMaintenance] = useState(false);

  // WhatsApp state
  const [waPhoneId, setWaPhoneId] = useState("");
  const [waBusinessId, setWaBusinessId] = useState("");
  const [waToken, setWaToken] = useState("");
  const [waActive, setWaActive] = useState(false);

  const { data: settingsData, isLoading } = useQuery<SystemSettings>({
    queryKey: ["/api/admin/settings"],
    queryFn: async () => {
      const r = await apiRequest("GET", "/api/admin/settings");
      return r.json();
    },
  });

  useEffect(() => {
    if (settingsData) {
      setTransferFee(settingsData.fees?.transfer_fee || "");
      setExchangeMargin(settingsData.fees?.exchange_rate_margin || "");
      setCardFee(settingsData.fees?.virtual_card_fee || "");
      setWithdrawalFee(settingsData.fees?.withdrawal_fee || "");

      setTwoFactorRequired(settingsData.security?.two_factor_required || false);
      setKycAutoApproval(settingsData.security?.kyc_auto_approval || true);
      setPinRequired(settingsData.security?.pin_required || false);
      setEnableOtp(settingsData.security?.enable_otp_feature || true);
      setOtpEmail(settingsData.security?.otp_email_enabled || true);
      setOtpSms(settingsData.security?.otp_sms_enabled || true);
      setOtpWhatsapp(settingsData.security?.otp_whatsapp_enabled || false);
      setMaxDailyLimit(settingsData.security?.max_daily_limit || "");

      setEmailNotif(settingsData.notifications?.email_notifications || true);
      setSmsNotif(settingsData.notifications?.sms_notifications || true);
      setPushNotif(settingsData.notifications?.push_notifications || true);
      setAdminAlerts(settingsData.notifications?.admin_alerts || true);

      setPlatformName(settingsData.general?.platform_name || "");
      setSupportEmail(settingsData.general?.support_email || "");
      setCurrency(settingsData.general?.default_currency || "");
      setSessionTimeout(settingsData.general?.session_timeout || "");
      setTermsUrl(settingsData.general?.terms_url || "");
      setMaintenanceMsg(settingsData.general?.maintenance_message || "");
      setMaintenance(settingsData.general?.maintenance_mode || false);

      setWaPhoneId(settingsData.whatsapp?.phone_number_id || "");
      setWaBusinessId(settingsData.whatsapp?.business_account_id || "");
      setWaToken(settingsData.whatsapp?.access_token || "");
      setWaActive(settingsData.whatsapp?.is_active || false);
    }
  }, [settingsData]);

  const feesMutation = useMutation({
    mutationFn: async () => {
      const requests = [
        apiRequest("PUT", "/api/admin/settings/transfer_fee", { value: transferFee, category: "fees" }),
        apiRequest("PUT", "/api/admin/settings/exchange_rate_margin", { value: exchangeMargin, category: "fees" }),
        apiRequest("PUT", "/api/admin/settings/virtual_card_fee", { value: cardFee, category: "fees" }),
        apiRequest("PUT", "/api/admin/settings/withdrawal_fee", { value: withdrawalFee, category: "fees" }),
      ];
      const results = await Promise.all(requests);
      return { success: true, results };
    },
    onSuccess: () => {
      toast({ title: "Saved", description: "Fee settings updated." });
      qc.invalidateQueries({ queryKey: ["/api/admin/settings"] });
    },
    onError: () => toast({ title: "Error", description: "Failed to save fees.", variant: "destructive" }),
  });

  const securityMutation = useMutation({
    mutationFn: async () => {
      const requests = [
        apiRequest("PUT", "/api/admin/settings/two_factor_required", { value: String(twoFactorRequired), category: "security" }),
        apiRequest("PUT", "/api/admin/settings/kyc_auto_approval", { value: String(kycAutoApproval), category: "security" }),
        apiRequest("PUT", "/api/admin/settings/pin_required", { value: String(pinRequired), category: "security" }),
        apiRequest("PUT", "/api/admin/settings/enable_otp_feature", { value: String(enableOtp), category: "security" }),
        apiRequest("PUT", "/api/admin/settings/otp_email_enabled", { value: String(otpEmail), category: "security" }),
        apiRequest("PUT", "/api/admin/settings/otp_sms_enabled", { value: String(otpSms), category: "security" }),
        apiRequest("PUT", "/api/admin/settings/otp_whatsapp_enabled", { value: String(otpWhatsapp), category: "security" }),
        apiRequest("PUT", "/api/admin/settings/max_daily_limit", { value: String(maxDailyLimit), category: "security" }),
      ];
      const results = await Promise.all(requests);
      return { success: true, results };
    },
    onSuccess: () => {
      toast({ title: "Saved", description: "Security settings updated." });
      qc.invalidateQueries({ queryKey: ["/api/admin/settings"] });
    },
    onError: () => toast({ title: "Error", description: "Failed to save security settings.", variant: "destructive" }),
  });

  const notificationsMutation = useMutation({
    mutationFn: async () => {
      const requests = [
        apiRequest("PUT", "/api/admin/settings/email_notifications", { value: String(emailNotif), category: "notifications" }),
        apiRequest("PUT", "/api/admin/settings/sms_notifications", { value: String(smsNotif), category: "notifications" }),
        apiRequest("PUT", "/api/admin/settings/push_notifications", { value: String(pushNotif), category: "notifications" }),
        apiRequest("PUT", "/api/admin/settings/admin_alerts", { value: String(adminAlerts), category: "notifications" }),
      ];
      const results = await Promise.all(requests);
      return { success: true, results };
    },
    onSuccess: () => {
      toast({ title: "Saved", description: "Notification settings updated." });
      qc.invalidateQueries({ queryKey: ["/api/admin/settings"] });
    },
    onError: () => toast({ title: "Error", description: "Failed to save notifications.", variant: "destructive" }),
  });

  const generalMutation = useMutation({
    mutationFn: async () => {
      const requests = [
        apiRequest("PUT", "/api/admin/settings/platform_name", { value: String(platformName), category: "general" }),
        apiRequest("PUT", "/api/admin/settings/support_email", { value: String(supportEmail), category: "general" }),
        apiRequest("PUT", "/api/admin/settings/default_currency", { value: String(currency), category: "general" }),
        apiRequest("PUT", "/api/admin/settings/session_timeout", { value: String(sessionTimeout), category: "general" }),
        apiRequest("PUT", "/api/admin/settings/terms_url", { value: String(termsUrl), category: "general" }),
        apiRequest("PUT", "/api/admin/settings/maintenance_message", { value: String(maintenanceMsg), category: "general" }),
        apiRequest("PUT", "/api/admin/settings/maintenance_mode", { value: String(maintenance), category: "general" }),
      ];
      const results = await Promise.all(requests);
      return { success: true, results };
    },
    onSuccess: () => {
      toast({ title: "Saved", description: "General settings updated." });
      qc.invalidateQueries({ queryKey: ["/api/admin/settings"] });
    },
    onError: () => toast({ title: "Error", description: "Failed to save general settings.", variant: "destructive" }),
  });

  const whatsappMutation = useMutation({
    mutationFn: async () => {
      const requests = [
        apiRequest("PUT", "/api/admin/settings/whatsapp_phone_number_id", { value: String(waPhoneId), category: "whatsapp" }),
        apiRequest("PUT", "/api/admin/settings/whatsapp_business_account_id", { value: String(waBusinessId), category: "whatsapp" }),
        apiRequest("PUT", "/api/admin/settings/whatsapp_access_token", { value: String(waToken), category: "whatsapp" }),
        apiRequest("PUT", "/api/admin/settings/whatsapp_is_active", { value: String(waActive), category: "whatsapp" }),
      ];
      const results = await Promise.all(requests);
      return { success: true, results };
    },
    onSuccess: () => {
      toast({ title: "Saved", description: "WhatsApp settings updated." });
      qc.invalidateQueries({ queryKey: ["/api/admin/settings"] });
    },
    onError: () => toast({ title: "Error", description: "Failed to save WhatsApp settings.", variant: "destructive" }),
  });

  if (isLoading) {
    return (
      <AdminShell title="System Settings">
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 rounded-2xl bg-gray-200 animate-pulse" />
          ))}
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell title="System Settings">
      <div className="max-w-4xl">
        <Tabs defaultValue="fees" className="w-full">
          <TabsList className="grid w-full grid-cols-5 rounded-xl bg-gray-100 p-1">
            <TabsTrigger value="fees">Fees</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          </TabsList>

          <TabsContent value="fees" className="space-y-4 mt-6">
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-green-50">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <CardTitle>Transaction Fees</CardTitle>
                    <CardDescription>Configure transaction and service fees</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Transfer Fee (%)</Label>
                    <Input value={transferFee} onChange={(e) => setTransferFee(e.target.value)} placeholder="2.50" className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Exchange Rate Margin (%)</Label>
                    <Input value={exchangeMargin} onChange={(e) => setExchangeMargin(e.target.value)} placeholder="0.05" className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Card Fee (KES)</Label>
                    <Input value={cardFee} onChange={(e) => setCardFee(e.target.value)} placeholder="1.00" className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Withdrawal Fee (KES)</Label>
                    <Input value={withdrawalFee} onChange={(e) => setWithdrawalFee(e.target.value)} placeholder="0.50" className="rounded-xl" />
                  </div>
                </div>
                <Button onClick={() => feesMutation.mutate()} disabled={feesMutation.isPending} className="w-full rounded-xl bg-green-600 hover:bg-green-500">
                  <Save className="w-4 h-4 mr-2" />
                  {feesMutation.isPending ? "Saving..." : "Save Fees"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4 mt-6">
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-50">
                    <Shield className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle>Security Settings</CardTitle>
                    <CardDescription>Configure authentication and security options</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                    <Label className="text-sm font-medium">Two-Factor Authentication Required</Label>
                    <Switch checked={twoFactorRequired} onCheckedChange={setTwoFactorRequired} />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                    <Label className="text-sm font-medium">KYC Auto-Approval</Label>
                    <Switch checked={kycAutoApproval} onCheckedChange={setKycAutoApproval} />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                    <Label className="text-sm font-medium">PIN Required for Transactions</Label>
                    <Switch checked={pinRequired} onCheckedChange={setPinRequired} />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                    <Label className="text-sm font-medium">Enable OTP Feature</Label>
                    <Switch checked={enableOtp} onCheckedChange={setEnableOtp} />
                  </div>
                  {enableOtp && (
                    <>
                      <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50 border border-blue-100">
                        <Label className="text-sm font-medium">OTP via Email</Label>
                        <Switch checked={otpEmail} onCheckedChange={setOtpEmail} />
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50 border border-blue-100">
                        <Label className="text-sm font-medium">OTP via SMS</Label>
                        <Switch checked={otpSms} onCheckedChange={setOtpSms} />
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50 border border-blue-100">
                        <Label className="text-sm font-medium">OTP via WhatsApp</Label>
                        <Switch checked={otpWhatsapp} onCheckedChange={setOtpWhatsapp} />
                      </div>
                    </>
                  )}
                  <div className="space-y-2">
                    <Label className="text-sm">Max Daily Limit (KES)</Label>
                    <Input value={maxDailyLimit} onChange={(e) => setMaxDailyLimit(e.target.value)} placeholder="50000" className="rounded-xl" />
                  </div>
                </div>
                <Button onClick={() => securityMutation.mutate()} disabled={securityMutation.isPending} className="w-full rounded-xl bg-blue-600 hover:bg-blue-500">
                  <Save className="w-4 h-4 mr-2" />
                  {securityMutation.isPending ? "Saving..." : "Save Security"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4 mt-6">
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-purple-50">
                    <Bell className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle>Notification Settings</CardTitle>
                    <CardDescription>Configure how users receive notifications</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                    <Label className="text-sm font-medium">Email Notifications</Label>
                    <Switch checked={emailNotif} onCheckedChange={setEmailNotif} />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                    <Label className="text-sm font-medium">SMS Notifications</Label>
                    <Switch checked={smsNotif} onCheckedChange={setSmsNotif} />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                    <Label className="text-sm font-medium">Push Notifications</Label>
                    <Switch checked={pushNotif} onCheckedChange={setPushNotif} />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                    <Label className="text-sm font-medium">Admin Alerts</Label>
                    <Switch checked={adminAlerts} onCheckedChange={setAdminAlerts} />
                  </div>
                </div>
                <Button onClick={() => notificationsMutation.mutate()} disabled={notificationsMutation.isPending} className="w-full rounded-xl bg-purple-600 hover:bg-purple-500">
                  <Save className="w-4 h-4 mr-2" />
                  {notificationsMutation.isPending ? "Saving..." : "Save Notifications"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="general" className="space-y-4 mt-6">
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-orange-50">
                    <Settings className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <CardTitle>General Settings</CardTitle>
                    <CardDescription>Configure general platform settings</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Platform Name</Label>
                    <Input value={platformName} onChange={(e) => setPlatformName(e.target.value)} placeholder="GreenPay" className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Support Email</Label>
                    <Input value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} placeholder="support@example.com" className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Default Currency</Label>
                    <Input value={currency} onChange={(e) => setCurrency(e.target.value)} placeholder="KES" className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Session Timeout (seconds)</Label>
                    <Input value={sessionTimeout} onChange={(e) => setSessionTimeout(e.target.value)} placeholder="3600" className="rounded-xl" />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label className="text-sm">Terms URL</Label>
                    <Input value={termsUrl} onChange={(e) => setTermsUrl(e.target.value)} placeholder="https://..." className="rounded-xl" />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label className="text-sm">Maintenance Message</Label>
                    <Input value={maintenanceMsg} onChange={(e) => setMaintenanceMsg(e.target.value)} placeholder="System under maintenance..." className="rounded-xl" />
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-red-50 border border-red-100">
                  <Label className="text-sm font-medium text-red-700">Maintenance Mode</Label>
                  <Switch checked={maintenance} onCheckedChange={setMaintenance} />
                </div>
                <Button onClick={() => generalMutation.mutate()} disabled={generalMutation.isPending} className="w-full rounded-xl bg-orange-600 hover:bg-orange-500">
                  <Save className="w-4 h-4 mr-2" />
                  {generalMutation.isPending ? "Saving..." : "Save General"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="whatsapp" className="space-y-4 mt-6">
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-green-50">
                    <MessageCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <CardTitle>WhatsApp Configuration</CardTitle>
                    <CardDescription>Configure WhatsApp Business API credentials</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-sm">Phone Number ID</Label>
                    <Input value={waPhoneId} onChange={(e) => setWaPhoneId(e.target.value)} placeholder="Enter phone number ID" className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Business Account ID</Label>
                    <Input value={waBusinessId} onChange={(e) => setWaBusinessId(e.target.value)} placeholder="Enter business account ID" className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Access Token</Label>
                    <Input value={waToken} onChange={(e) => setWaToken(e.target.value)} type="password" placeholder="Enter access token" className="rounded-xl" />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                    <Label className="text-sm font-medium">Active</Label>
                    <Switch checked={waActive} onCheckedChange={setWaActive} />
                  </div>
                </div>
                <Button onClick={() => whatsappMutation.mutate()} disabled={whatsappMutation.isPending} className="w-full rounded-xl bg-green-600 hover:bg-green-500">
                  <Save className="w-4 h-4 mr-2" />
                  {whatsappMutation.isPending ? "Saving..." : "Save WhatsApp"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminShell>
  );
}
