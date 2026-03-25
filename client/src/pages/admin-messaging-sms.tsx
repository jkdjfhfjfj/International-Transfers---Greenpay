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
import { Save, MessageCircle, Send, CheckCircle, AlertCircle, Phone } from "lucide-react";

interface MessagingSettings {
  apiKey: string;
  accountEmail: string;
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

export default function AdminMessagingSMSPage() {
  const { toast } = useToast();
  const qc = useQueryClient();

  // SMS state
  const [apiKey, setApiKey] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
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
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
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
      setAccountEmail(settingsData.accountEmail || "");
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
        accountEmail,
        senderId,
        whatsappAccessToken: waToken,
        whatsappPhoneNumberId: waPhoneId,
        whatsappBusinessAccountId: waBusinessId,
      });
      return r.json();
    },
    onSuccess: () => {
      toast({ title: "Saved", description: "SMS settings updated." });
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

  const handleSendBulkMessages = async () => {
    if (selectedUserIds.length === 0 || !testMessage) {
      toast({ title: "Error", description: "Select users and enter a message.", variant: "destructive" });
      return;
    }

    setTestSending(true);
    try {
      const r = await apiRequest("POST", "/api/admin/send-bulk-messages", {
        userIds: selectedUserIds,
        message: testMessage,
      });
      if (r.ok) {
        const result = await r.json();
        toast({ title: "Sent", description: `Message sent to ${result.sentCount} user(s)` });
        setTestMessage("");
        setSelectedUserIds([]);
      } else {
        throw new Error("Failed to send");
      }
    } catch {
      toast({ title: "Error", description: "Failed to send messages.", variant: "destructive" });
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
      <AdminShell title="Messaging & SMS">
        <div className="space-y-6">
          <div className="h-40 rounded-2xl bg-gray-200 animate-pulse" />
          <div className="h-40 rounded-2xl bg-gray-200 animate-pulse" />
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell title="Messaging & SMS">
      <div className="max-w-4xl">
        <Tabs defaultValue="sms" className="w-full">
          <TabsList className="grid w-full grid-cols-3 rounded-xl bg-gray-100 p-1">
            <TabsTrigger value="sms">SMS Gateway</TabsTrigger>
            <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
            <TabsTrigger value="config">Message Types</TabsTrigger>
          </TabsList>

          <TabsContent value="sms" className="space-y-4 mt-6">
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-50">
                    <Phone className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle>Umeska SMS Gateway Configuration</CardTitle>
                    <CardDescription>Configure SMS API credentials for SMS notifications</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm">API Key</Label>
                  <Input value={apiKey} onChange={(e) => setApiKey(e.target.value)} type="password" placeholder="Enter API key" className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Account Email / App ID</Label>
                  <Input value={accountEmail} onChange={(e) => setAccountEmail(e.target.value)} placeholder="your-email@umeska.com" className="rounded-xl" />
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
                    <CardTitle>WhatsApp Business API</CardTitle>
                    <CardDescription>Configure Meta WhatsApp Business credentials</CardDescription>
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

          <TabsContent value="config" className="space-y-4 mt-6">
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-purple-50">
                    <AlertCircle className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle>Message Type Configuration</CardTitle>
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
                <CardTitle className="text-base">Send Bulk Messages</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm">Select Users</Label>
                  <div className="max-h-48 overflow-y-auto border rounded-xl p-3 space-y-2 bg-gray-50">
                    {usersData?.users?.map((user) => (
                      <label key={user.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedUserIds.includes(user.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUserIds([...selectedUserIds, user.id]);
                            } else {
                              setSelectedUserIds(selectedUserIds.filter((id) => id !== user.id));
                            }
                          }}
                          className="w-4 h-4 rounded accent-blue-600"
                        />
                        <span className="text-sm text-gray-700">{user.fullName} ({user.phone})</span>
                      </label>
                    ))}
                  </div>
                  {selectedUserIds.length > 0 && (
                    <p className="text-xs text-blue-600">{selectedUserIds.length} user(s) selected</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Message</Label>
                  <Textarea value={testMessage} onChange={(e) => setTestMessage(e.target.value)} placeholder="Enter message to send..." className="rounded-xl" />
                </div>
                <Button onClick={handleSendBulkMessages} disabled={testSending || selectedUserIds.length === 0} className="w-full rounded-xl bg-blue-600 hover:bg-blue-500">
                  <Send className="w-4 h-4 mr-2" />
                  {testSending ? "Sending..." : "Send to Selected Users"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminShell>
  );
}
