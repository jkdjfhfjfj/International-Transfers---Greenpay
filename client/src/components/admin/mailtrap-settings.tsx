import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Mail, Save, AlertCircle, CheckCircle, RefreshCw, ExternalLink, Hash } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const TEMPLATE_LABELS: Record<string, { label: string; description: string }> = {
  otp: { label: "OTP Verification", description: "Sent when user requests a verification code" },
  password_reset: { label: "Password Reset", description: "Sent when user requests a password reset" },
  welcome: { label: "Welcome Email", description: "Sent when a new user registers" },
  kyc_submitted: { label: "KYC Submitted", description: "Sent when KYC documents are uploaded" },
  kyc_verified: { label: "KYC Verified", description: "Sent when KYC is approved by admin" },
  login_alert: { label: "Login Alert", description: "Sent on new device/location login" },
  fund_receipt: { label: "Fund Receipt", description: "Sent when user receives funds" },
  card_activation: { label: "Card Activation", description: "Sent when virtual card is issued" },
  transaction_export: { label: "Transaction Export", description: "Sent when user exports transaction history" },
};

interface MailtrapSettings {
  apiKey: string;
  isConfigured: boolean;
}

interface TemplateData {
  uuid: string;
  isCustom: boolean;
}

export default function MailtrapSettings() {
  const [settings, setSettings] = useState<MailtrapSettings>({ apiKey: "", isConfigured: false });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [testEmail, setTestEmail] = useState("");
  const [testing, setTesting] = useState(false);
  const [templates, setTemplates] = useState<Record<string, TemplateData>>({});
  const [editedUuids, setEditedUuids] = useState<Record<string, string>>({});
  const [savingTemplates, setSavingTemplates] = useState(false);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
    loadTemplates();
  }, []);

  const loadSettings = async () => {
    setInitialLoading(true);
    try {
      const response = await apiRequest('GET', '/api/admin/mailtrap-settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      toast({ title: "Loading Failed", description: "Failed to load Mailtrap settings", variant: "destructive" });
    } finally {
      setInitialLoading(false);
    }
  };

  const loadTemplates = async () => {
    setTemplatesLoading(true);
    try {
      const response = await apiRequest('GET', '/api/admin/email-templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || {});
        const uuids: Record<string, string> = {};
        for (const [k, v] of Object.entries(data.templates || {})) {
          uuids[k] = (v as TemplateData).uuid;
        }
        setEditedUuids(uuids);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setTemplatesLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings.apiKey.trim()) {
      toast({ title: "Validation Error", description: "API key is required", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const response = await apiRequest('POST', '/api/admin/mailtrap-settings', { apiKey: settings.apiKey.trim() });
      if (response.ok) {
        toast({ title: "Success", description: "Mailtrap API key saved successfully" });
        await loadSettings();
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      toast({ title: "Save Failed", description: "Failed to save Mailtrap settings", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTemplates = async () => {
    setSavingTemplates(true);
    try {
      const response = await apiRequest('PUT', '/api/admin/email-templates', { templates: editedUuids });
      if (response.ok) {
        toast({ title: "Templates Saved", description: "Email template UUIDs updated successfully" });
        await loadTemplates();
      } else {
        throw new Error('Failed to save templates');
      }
    } catch (error) {
      toast({ title: "Save Failed", description: "Failed to save email template UUIDs", variant: "destructive" });
    } finally {
      setSavingTemplates(false);
    }
  };

  const handleTest = async () => {
    if (!testEmail.trim()) {
      toast({ title: "Validation Error", description: "Test email address is required", variant: "destructive" });
      return;
    }
    setTesting(true);
    try {
      const response = await apiRequest('POST', '/api/admin/mailtrap-test', { email: testEmail.trim() });
      if (response.ok) {
        toast({ title: "Success", description: "Test email sent successfully" });
      } else {
        throw new Error('Failed to send test email');
      }
    } catch (error) {
      toast({ title: "Test Failed", description: "Failed to send test email", variant: "destructive" });
    } finally {
      setTesting(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="api" className="space-y-4">
        <TabsList>
          <TabsTrigger value="api">API Configuration</TabsTrigger>
          <TabsTrigger value="templates">Email Templates</TabsTrigger>
        </TabsList>

        {/* ─── API CONFIG TAB ─── */}
        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Mailtrap Email Service
              </CardTitle>
              <CardDescription>Configure Mailtrap API for sending transactional emails</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {settings.isConfigured ? (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">Mailtrap is configured and ready to use</AlertDescription>
                </Alert>
              ) : (
                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">Mailtrap is not configured. Add your API key below.</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="api-key">Mailtrap API Key</Label>
                <Input
                  id="api-key"
                  type="password"
                  placeholder="Enter your Mailtrap API token"
                  value={settings.apiKey}
                  onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                  data-testid="input-mailtrap-api-key"
                />
                <p className="text-sm text-gray-500">Get your API key from your Mailtrap account settings</p>
              </div>

              <Button onClick={handleSave} disabled={loading} className="w-full bg-green-600 hover:bg-green-700" data-testid="button-save-api-key">
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Saving...' : 'Save API Key'}
              </Button>
            </CardContent>
          </Card>

          {settings.isConfigured && (
            <Card>
              <CardHeader>
                <CardTitle>Test Email Service</CardTitle>
                <CardDescription>Send a test email to verify Mailtrap configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="test-email">Test Email Address</Label>
                  <Input
                    id="test-email"
                    type="email"
                    placeholder="your@email.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    data-testid="input-test-email"
                  />
                </div>
                <Button onClick={handleTest} disabled={testing} className="w-full" variant="outline" data-testid="button-send-test">
                  {testing ? 'Sending...' : 'Send Test Email'}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ─── TEMPLATES TAB ─── */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Hash className="w-5 h-5" />
                    Email Template UUIDs
                  </CardTitle>
                  <CardDescription>
                    Manage Mailtrap template UUIDs. Leave blank to use the platform default.
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={loadTemplates} disabled={templatesLoading}>
                  <RefreshCw className={`w-4 h-4 mr-1 ${templatesLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {templatesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  <Alert className="border-blue-200 bg-blue-50">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800 text-sm">
                      Template UUIDs are found in your Mailtrap dashboard under Email → Templates. Copy the UUID from each template URL.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    {Object.entries(TEMPLATE_LABELS).map(([key, { label, description }]) => {
                      const data = templates[key];
                      const isCustom = data?.isCustom ?? false;
                      return (
                        <div key={key} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <Label htmlFor={`template-${key}`} className="text-sm font-medium">
                              {label}
                              {isCustom && (
                                <Badge variant="outline" className="ml-2 text-xs text-green-700 border-green-300">custom</Badge>
                              )}
                            </Label>
                            {isCustom && (
                              <button
                                className="text-xs text-red-500 hover:underline"
                                onClick={() => setEditedUuids(prev => ({ ...prev, [key]: '' }))}
                              >
                                clear
                              </button>
                            )}
                          </div>
                          <Input
                            id={`template-${key}`}
                            placeholder={`Default UUID (hidden) — enter custom to override`}
                            value={editedUuids[key] || ''}
                            onChange={(e) => setEditedUuids(prev => ({ ...prev, [key]: e.target.value }))}
                            className="font-mono text-xs"
                            data-testid={`input-template-${key}`}
                          />
                          <p className="text-xs text-muted-foreground">{description}</p>
                        </div>
                      );
                    })}
                  </div>

                  <Button
                    onClick={handleSaveTemplates}
                    disabled={savingTemplates}
                    className="w-full bg-green-600 hover:bg-green-700"
                    data-testid="button-save-templates"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {savingTemplates ? 'Saving...' : 'Save Template UUIDs'}
                  </Button>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ExternalLink className="w-3 h-3" />
                    <a href="https://mailtrap.io/email-templates" target="_blank" rel="noopener noreferrer" className="hover:underline">
                      Open Mailtrap Templates Dashboard
                    </a>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
