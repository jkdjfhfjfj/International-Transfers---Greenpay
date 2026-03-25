import { useState, useEffect } from "react";
import AdminShell from "@/components/admin/admin-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Save, MessageCircle, Send, CheckCircle, AlertCircle } from "lucide-react";

interface MessagingSettings {
  apiKey: string;
  appId: string;
  senderId: string;
  whatsappAccessToken: string;
  whatsappPhoneNumberId: string;
  whatsappBusinessAccountId: string;
}

interface MessageToggles {
  enableOtpMessages: boolean;
  enablePasswordResetMessages: boolean;
  enableFundReceiptMessages: boolean;
  enableKycVerifiedMessages: boolean;
  enableCardActivationMessages: boolean;
  enableLoginAlertMessages: boolean;
}

interface User {
  id: string;
  fullName: string;
  phone: string;
  email: string;
}

export default function AdminMessagingPage() {
  const { toast } = useToast();
  const qc = useQueryClient();

  // Settings state
  const [apiKey, setApiKey] = useState("");
  const [appId, setAppId] = useState("");
  const [senderId, setSenderId] = useState("");
  const [waToken, setWaToken] = useState("");
  const [waPhoneId, setWaPhoneId] = useState("");
  const [waBusinessId, setWaBusinessId] = useState("");

  // Toggles state
  const [otpEnabled, setOtpEnabled] = useState(true);
  const [passwordResetEnabled, setPasswordResetEnabled] = useState(true);
  const [fundReceiptEnabled, setFundReceiptEnabled] = useState(true);
  const [kycVerifiedEnabled, setKycVerifiedEnabled] = useState(true);
  const [cardActivationEnabled, setCardActivationEnabled] = useState(true);
  const [loginAlertEnabled, setLoginAlertEnabled] = useState(true);

  // Test state
  const [selectedUserId, setSelectedUserId] = useState("");
  const [testMessage, setTestMessage] = useState("");
  const [testSending, setTestSending] = useState(false);
  const [templateCreating, setTemplateCreating] = useState(false);

  const { data: settingsData, isLoading: settingsLoading } = useQuery<MessagingSettings>({
    queryKey: ["/api/admin/messaging-settings"],
    queryFn: async () => {
      const r = await apiRequest("GET", "/api/admin/messaging-settings");
      return r.json();
    },
  });

  const { data: togglesData, isLoading: togglesLoading } = useQuery<MessageToggles>({
    queryKey: ["/api/admin/message-toggles"],
    queryFn: async () => {
      const r = await apiRequest("GET", "/api/admin/message-toggles");
      return r.json();
    },
  });

  const { data: usersData } = useQuery<{ users: User[] }>({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const r = await apiRequest("GET", "/api/admin/users");
      return r.json();
    },
  });

  useEffect(() => {
    if (settingsData) {
      setApiKey(settingsData.apiKey || "");
      setAppId(settingsData.appId || "");
      setSenderId(settingsData.senderId || "UMS_TX");
      setWaToken(settingsData.whatsappAccessToken || "");
      setWaPhoneId(settingsData.whatsappPhoneNumberId || "");
      setWaBusinessId(settingsData.whatsappBusinessAccountId || "");
    }
  }, [settingsData]);

  useEffect(() => {
    if (togglesData) {
      setOtpEnabled(togglesData.enableOtpMessages || false);
      setPasswordResetEnabled(togglesData.enablePasswordResetMessages || false);
      setFundReceiptEnabled(togglesData.enableFundReceiptMessages || false);
      setKycVerifiedEnabled(togglesData.enableKycVerifiedMessages || false);
      setCardActivationEnabled(togglesData.enableCardActivationMessages || false);
      setLoginAlertEnabled(togglesData.enableLoginAlertMessages || false);
    }
  }, [togglesData]);

  const settingsMutation = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("PUT", "/api/admin/messaging-settings", {
        apiKey,
        appId,
        senderId,
        whatsappAccessToken: waToken,
        whatsappPhoneNumberId: waPhoneId,
        whatsappBusinessAccountId: waBusinessId,
      });
      return r.json();
    },
    onSuccess: () => {
      toast({ title: "Saved", description: "Messaging settings updated." });
      qc.invalidateQueries({ queryKey: ["/api/admin/messaging-settings"] });
    },
    onError: () => toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" }),
  });

  const togglesMutation = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("PUT", "/api/admin/message-toggles", {
        enableOtpMessages: otpEnabled,
        enablePasswordResetMessages: passwordResetEnabled,
        enableFundReceiptMessages: fundReceiptEnabled,
        enableKycVerifiedMessages: kycVerifiedEnabled,
        enableCardActivationMessages: cardActivationEnabled,
        enableLoginAlertMessages: loginAlertEnabled,
      });
      return r.json();
    },
    onSuccess: () => {
      toast({ title: "Saved", description: "Message toggles updated." });
      qc.invalidateQueries({ queryKey: ["/api/admin/message-toggles"] });
    },
    onError: () => toast({ title: "Error", description: "Failed to save toggles.", variant: "destructive" }),
  });

  const handleSendTestMessage = async () => {
    if (!selectedUserId || !testMessage) {
      toast({ title: "Error", description: "Select a user and enter a message.", variant: "destructive" });
      return;
    }

    setTestSending(true);
    try {
      const r = await apiRequest("POST", "/api/admin/test-message", { userId: selectedUserId, message: testMessage });
      if (r.ok) {
        toast({ title: "Sent", description: "Test message sent successfully." });
        setTestMessage("");
      } else {
        throw new Error("Failed to send");
      }
    } catch {
      toast({ title: "Error", description: "Failed to send test message.", variant: "destructive" });
    } finally {
      setTestSending(false);
    }
  };

  const handleCreateTemplates = async () => {
    setTemplateCreating(true);
    try {
      const r = await apiRequest("POST", "/api/admin/whatsapp/create-templates");
      if (r.ok) {
        const result = await r.json();
        toast({ title: "Success", description: `Created ${result.successCount} template(s)` });
      } else {
        throw new Error("Failed to create");
      }
    } catch {
      toast({ title: "Error", description: "Failed to create templates.", variant: "destructive" });
    } finally {
      setTemplateCreating(false);
    }
  };

  const isLoading = settingsLoading || togglesLoading;

  if (isLoading) {
    return (
      <AdminShell title="Messaging">
        <div className="space-y-6">
          <div className="h-40 rounded-2xl bg-gray-200 animate-pulse" />
          <div className="h-40 rounded-2xl bg-gray-200 animate-pulse" />
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell title="Messaging">
      <div className="max-w-4xl">
        <Tabs defaultValue="sms" className="w-full">
          <TabsList className="grid w-full grid-cols-3 rounded-xl bg-gray-100 p-1">
            <TabsTrigger value="sms">SMS Settings</TabsTrigger>
            <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
            <TabsTrigger value="toggles">Message Types</TabsTrigger>
          </TabsList>

          <TabsContent value="sms" className="space-y-4 mt-6">
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-50">
                    <MessageCircle className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle>SMS API Configuration</CardTitle>
                    <CardDescription>Configure Umeska SMS gateway for SMS notifications</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm">API Key</Label>
                  <Input value={apiKey} onChange={(e) => setApiKey(e.target.value)} type="password" placeholder="Enter API key" className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">App ID</Label>
                  <Input value={appId} onChange={(e) => setAppId(e.target.value)} placeholder="Enter app ID" className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Sender ID</Label>
                  <Input value={senderId} onChange={(e) => setSenderId(e.target.value)} placeholder="e.g., UMS_TX" className="rounded-xl" />
                </div>
                <Button onClick={() => settingsMutation.mutate()} disabled={settingsMutation.isPending} className="w-full rounded-xl bg-blue-600 hover:bg-blue-500">
                  <Save className="w-4 h-4 mr-2" />
                  {settingsMutation.isPending ? "Saving..." : "Save SMS Settings"}
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
                    <CardDescription>Configure Meta WhatsApp Business API</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm">Access Token</Label>
                  <Input value={waToken} onChange={(e) => setWaToken(e.target.value)} type="password" placeholder="Enter access token" className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Phone Number ID</Label>
                  <Input value={waPhoneId} onChange={(e) => setWaPhoneId(e.target.value)} placeholder="Enter phone number ID" className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Business Account ID</Label>
                  <Input value={waBusinessId} onChange={(e) => setWaBusinessId(e.target.value)} placeholder="Enter business account ID" className="rounded-xl" />
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => settingsMutation.mutate()} disabled={settingsMutation.isPending} className="flex-1 rounded-xl bg-green-600 hover:bg-green-500">
                    <Save className="w-4 h-4 mr-2" />
                    Save Settings
                  </Button>
                  <Button onClick={handleCreateTemplates} disabled={templateCreating} className="flex-1 rounded-xl bg-gray-600 hover:bg-gray-500">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {templateCreating ? "Creating..." : "Create Templates"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="toggles" className="space-y-4 mt-6">
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-purple-50">
                    <AlertCircle className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle>Message Types</CardTitle>
                    <CardDescription>Choose which notifications users will receive</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                  <Label className="text-sm font-medium">OTP Messages</Label>
                  <Switch checked={otpEnabled} onCheckedChange={setOtpEnabled} />
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                  <Label className="text-sm font-medium">Password Reset Notifications</Label>
                  <Switch checked={passwordResetEnabled} onCheckedChange={setPasswordResetEnabled} />
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                  <Label className="text-sm font-medium">Fund Receipt Confirmations</Label>
                  <Switch checked={fundReceiptEnabled} onCheckedChange={setFundReceiptEnabled} />
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                  <Label className="text-sm font-medium">KYC Verified Alerts</Label>
                  <Switch checked={kycVerifiedEnabled} onCheckedChange={setKycVerifiedEnabled} />
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                  <Label className="text-sm font-medium">Card Activation Messages</Label>
                  <Switch checked={cardActivationEnabled} onCheckedChange={setCardActivationEnabled} />
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                  <Label className="text-sm font-medium">Login Alerts</Label>
                  <Switch checked={loginAlertEnabled} onCheckedChange={setLoginAlertEnabled} />
                </div>
                <Button onClick={() => togglesMutation.mutate()} disabled={togglesMutation.isPending} className="w-full rounded-xl bg-purple-600 hover:bg-purple-500">
                  <Save className="w-4 h-4 mr-2" />
                  {togglesMutation.isPending ? "Saving..." : "Save Message Types"}
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Send Test Message</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm">Select User</Label>
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choose a user...</option>
                    {usersData?.users?.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.fullName} ({user.phone})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Message</Label>
                  <Textarea value={testMessage} onChange={(e) => setTestMessage(e.target.value)} placeholder="Enter test message..." className="rounded-xl" />
                </div>
                <Button onClick={handleSendTestMessage} disabled={testSending} className="w-full rounded-xl bg-blue-600 hover:bg-blue-500">
                  <Send className="w-4 h-4 mr-2" />
                  {testSending ? "Sending..." : "Send Test Message"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminShell>
  );
}
