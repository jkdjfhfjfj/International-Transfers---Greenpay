import { useState } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { WavyHeader } from "@/components/wavy-header";
import { Download, Copy, Play, Check, Globe, Zap, Shield, Code2, Eye, EyeOff, ExternalLink, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const API_BASE_URL = typeof window !== 'undefined' ? `${window.location.origin}/api` : "https://api.greenpay.world";

export default function APIDocumentationPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "auth" | "endpoints" | "examples" | "test">("overview");
  const [testEndpoint, setTestEndpoint] = useState("");
  const [testMethod, setTestMethod] = useState("GET");
  const [testData, setTestData] = useState("");
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState("");

  const tryItNow = async () => {
    if (!testEndpoint) {
      toast({ title: "Enter endpoint", description: "Please enter an endpoint path", variant: "destructive" });
      return;
    }
    
    setTestLoading(true);
    try {
      const options: RequestInit = {
        method: testMethod,
        headers: {
          "Content-Type": "application/json",
        },
      };

      if (testMethod !== "GET" && testData) {
        options.body = testData;
      }

      const response = await fetch(`${API_BASE_URL}${testEndpoint}`, options);
      const data = await response.json();
      setTestResult(JSON.stringify(data, null, 2));
      toast({ title: "Success", description: "API call completed" });
    } catch (error) {
      setTestResult(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
      toast({ title: "Error", description: "Failed to call API", variant: "destructive" });
    } finally {
      setTestLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    toast({ title: "Copied to clipboard!" });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const CodeBlock = ({ code, language = "bash", id }: any) => (
    <div className="bg-muted p-4 rounded-lg my-4 relative">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-mono text-muted-foreground">{language}</span>
        <button
          onClick={() => copyToClipboard(code, id)}
          className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
        >
          {copiedCode === id ? <Check size={14} /> : <Copy size={14} />}
          {copiedCode === id ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="text-xs overflow-x-auto max-h-96">
        <code>{code}</code>
      </pre>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-32">
      <WavyHeader size="sm" />

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <h1 className="text-4xl font-bold">GreenPay API Documentation</h1>
          <p className="text-lg text-muted-foreground">
            Complete REST API reference for integrating GreenPay into your applications
          </p>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 text-sm">
              <Globe size={16} className="text-primary" />
              <span>Base URL: <code className="bg-muted px-2 py-1 rounded">{API_BASE_URL}</code></span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Zap size={16} className="text-primary" />
              <span>Rate Limit: 1000 requests/hour</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Shield size={16} className="text-primary" />
              <span>HTTPS Required</span>
            </div>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-wrap gap-2 border-b border-border"
        >
          {["overview", "auth", "endpoints", "examples", "test"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`pb-3 px-4 font-medium transition-colors ${
                activeTab === tab
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </motion.div>

        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-2xl font-bold mb-4">Getting Started</h2>
              <p className="text-muted-foreground mb-4">
                GreenPay provides a comprehensive REST API for financial transactions, user management, and more.
              </p>
            </div>

            {/* Getting Started */}
            <div className="bg-card border border-primary/20 p-6 rounded-lg space-y-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-primary mt-1" size={20} />
                <div>
                  <h3 className="font-bold mb-2">🚀 Get Started in 3 Steps</h3>
                  <ol className="space-y-3 text-sm">
                    <li className="flex gap-3">
                      <span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs">1</span>
                      <div>
                        <span className="font-semibold">Log in to your GreenPay account</span>
                        <p className="text-muted-foreground text-xs">Go to Settings → API Keys</p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs">2</span>
                      <div>
                        <span className="font-semibold">Click "Generate New Key"</span>
                        <p className="text-muted-foreground text-xs">Configure name, scope, and rate limits</p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs">3</span>
                      <div>
                        <span className="font-semibold">Copy and store securely</span>
                        <p className="text-muted-foreground text-xs">Save in environment variables, never commit to version control</p>
                      </div>
                    </li>
                  </ol>
                </div>
              </div>
              <Button 
                onClick={() => setLocation('/api-service')}
                className="w-full mt-4"
              >
                Generate API Key Now
              </Button>
            </div>

            {/* Key Features */}
            <div>
              <h3 className="text-xl font-bold mb-4">Key Features</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-bold mb-2">💰 Payments</h4>
                  <p className="text-sm text-muted-foreground">
                    Send and receive money, manage transactions, convert currencies
                  </p>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-bold mb-2">💳 Virtual Cards</h4>
                  <p className="text-sm text-muted-foreground">
                    Issue, manage, and track virtual card transactions
                  </p>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-bold mb-2">🔐 Security</h4>
                  <p className="text-sm text-muted-foreground">
                    OAuth 2.0, API keys, rate limiting, encryption
                  </p>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-bold mb-2">📱 Mobile Ready</h4>
                  <p className="text-sm text-muted-foreground">
                    SMS notifications, WhatsApp integration, webhooks
                  </p>
                </div>
              </div>
            </div>

            {/* Requirements */}
            <div>
              <h3 className="text-xl font-bold mb-4">Requirements</h3>
              <ul className="space-y-2 text-muted-foreground list-disc list-inside">
                <li>Valid API key (use demo keys for testing)</li>
                <li>HTTPS requests only</li>
                <li>Application/JSON content type for POST/PUT requests</li>
                <li>User authentication or valid Bearer token</li>
              </ul>
            </div>
          </motion.div>
        )}

        {/* AUTH TAB */}
        {activeTab === "auth" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-2xl font-bold mb-4">Authentication</h2>
              <p className="text-muted-foreground mb-6">
                GreenPay supports two authentication methods:
              </p>
            </div>

            {/* Session-Based Auth */}
            <div className="space-y-4">
              <div className="border-l-4 border-primary pl-4">
                <h3 className="text-xl font-bold mb-2">1. Session Authentication</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Used for web applications and user dashboards
                </p>
              </div>
              <CodeBlock
                code={`// Login endpoint
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}

// Response includes session cookie automatically set`}
                language="http"
                id="session-auth"
              />
            </div>

            {/* API Key Auth */}
            <div className="space-y-4">
              <div className="border-l-4 border-primary pl-4">
                <h3 className="text-xl font-bold mb-2">2. API Key Authentication</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Used for server-to-server requests and integrations
                </p>
              </div>
              <CodeBlock
                code={`// Include in Authorization header
Authorization: Bearer gpay_demo_test

// Example with curl
curl -X GET ${API_BASE_URL}/api/endpoint \\
  -H "Authorization: Bearer gpay_demo_test" \\
  -H "Content-Type: application/json"`}
                language="bash"
                id="api-key-auth"
              />
            </div>

            {/* Creating API Keys */}
            <div className="bg-card border border-border p-6 rounded-lg space-y-4">
              <h3 className="text-lg font-bold">Generating Your API Keys</h3>
              <ol className="space-y-3 text-sm list-decimal list-inside">
                <li><strong>Create your account</strong> - Sign up at greenpay.world</li>
                <li><strong>Verify email & phone</strong> - Complete KYC verification</li>
                <li><strong>Navigate to Settings</strong> - Go to Settings → API Keys in your dashboard</li>
                <li><strong>Generate Key</strong> - Click "Generate New Key"</li>
                <li><strong>Configure scopes</strong> - Select read, write, or all permissions</li>
                <li><strong>Copy immediately</strong> - You won't be able to see it again</li>
                <li><strong>Store securely</strong> - Use environment variables in production</li>
              </ol>
              <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 p-4 rounded mt-4">
                <p className="text-sm"><strong>⚠️ Important:</strong> Each API key is unique and personal. Never share your keys or commit them to version control.</p>
              </div>
              <div className="bg-muted p-3 rounded text-sm font-mono mt-4">
                export GREENPAY_API_KEY="gpay_your_unique_key_here"
              </div>
            </div>

            {/* Security Best Practices */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold">🔒 Security Best Practices</h3>
              <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 p-4 rounded space-y-3 text-sm">
                <div>✓ Never commit API keys to version control</div>
                <div>✓ Use environment variables for production</div>
                <div>✓ Rotate keys regularly</div>
                <div>✓ Use HTTPS for all requests</div>
                <div>✓ Revoke compromised keys immediately</div>
                <div>✓ Use different keys for dev/prod/test</div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ENDPOINTS TAB */}
        {activeTab === "endpoints" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            <div>
              <h2 className="text-2xl font-bold mb-4">API Endpoints</h2>
              <p className="text-muted-foreground mb-4">
                All endpoints require authentication unless noted otherwise.
              </p>
            </div>

            {/* Authentication Endpoints */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold border-b border-border pb-2">Authentication</h3>
              
              <div className="bg-card p-4 rounded-lg border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="bg-blue-500/20 text-blue-600 dark:text-blue-400 px-2 py-1 rounded text-xs font-mono">POST</span>
                    <span className="ml-3 font-mono">/api/auth/signup</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">Create a new user account</p>
              </div>

              <div className="bg-card p-4 rounded-lg border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="bg-blue-500/20 text-blue-600 dark:text-blue-400 px-2 py-1 rounded text-xs font-mono">POST</span>
                    <span className="ml-3 font-mono">/api/auth/login</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">Login to an existing account</p>
              </div>

              <div className="bg-card p-4 rounded-lg border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="bg-green-500/20 text-green-600 dark:text-green-400 px-2 py-1 rounded text-xs font-mono">GET</span>
                    <span className="ml-3 font-mono">/api/auth/me</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">Get current authenticated user info</p>
              </div>
            </div>

            {/* Transactions */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold border-b border-border pb-2">Transactions</h3>
              
              <div className="bg-card p-4 rounded-lg border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="bg-purple-500/20 text-purple-600 dark:text-purple-400 px-2 py-1 rounded text-xs font-mono">POST</span>
                    <span className="ml-3 font-mono">/api/transactions/send</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">Send money to another user</p>
              </div>

              <div className="bg-card p-4 rounded-lg border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="bg-green-500/20 text-green-600 dark:text-green-400 px-2 py-1 rounded text-xs font-mono">GET</span>
                    <span className="ml-3 font-mono">/api/transactions/:userId</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">Get user's transaction history</p>
              </div>

              <div className="bg-card p-4 rounded-lg border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="bg-green-500/20 text-green-600 dark:text-green-400 px-2 py-1 rounded text-xs font-mono">GET</span>
                    <span className="ml-3 font-mono">/api/exchange-rates/:from/:to</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">Get real-time exchange rates</p>
              </div>
            </div>

            {/* Bills & Payments */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold border-b border-border pb-2">Bills & Payments</h3>
              
              <div className="bg-card p-4 rounded-lg border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="bg-blue-500/20 text-blue-600 dark:text-blue-400 px-2 py-1 rounded text-xs font-mono">POST</span>
                    <span className="ml-3 font-mono">/api/bills/pay</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">Pay utility bills (KPLC, Zuku, Water, etc.)</p>
              </div>

              <div className="bg-card p-4 rounded-lg border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="bg-purple-500/20 text-purple-600 dark:text-purple-400 px-2 py-1 rounded text-xs font-mono">POST</span>
                    <span className="ml-3 font-mono">/api/airtime/purchase</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">Buy airtime for mobile phones</p>
              </div>
            </div>

            {/* Virtual Cards */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold border-b border-border pb-2">Virtual Cards</h3>
              
              <div className="bg-card p-4 rounded-lg border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="bg-blue-500/20 text-blue-600 dark:text-blue-400 px-2 py-1 rounded text-xs font-mono">POST</span>
                    <span className="ml-3 font-mono">/api/virtual-card/purchase</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">Create or purchase a new virtual card</p>
              </div>

              <div className="bg-card p-4 rounded-lg border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="bg-green-500/20 text-green-600 dark:text-green-400 px-2 py-1 rounded text-xs font-mono">GET</span>
                    <span className="ml-3 font-mono">/api/virtual-card/:userId</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">Get user's virtual card details</p>
              </div>
            </div>

            {/* API Keys */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold border-b border-border pb-2">API Key Management</h3>
              
              <div className="bg-card p-4 rounded-lg border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="bg-blue-500/20 text-blue-600 dark:text-blue-400 px-2 py-1 rounded text-xs font-mono">POST</span>
                    <span className="ml-3 font-mono">/api/api-keys/generate</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">Generate a new API key</p>
              </div>

              <div className="bg-card p-4 rounded-lg border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="bg-green-500/20 text-green-600 dark:text-green-400 px-2 py-1 rounded text-xs font-mono">GET</span>
                    <span className="ml-3 font-mono">/api/api-keys</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">List your API keys</p>
              </div>

              <div className="bg-card p-4 rounded-lg border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="bg-red-500/20 text-red-600 dark:text-red-400 px-2 py-1 rounded text-xs font-mono">POST</span>
                    <span className="ml-3 font-mono">/api/api-keys/:keyId/revoke</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">Revoke an API key</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* TRY IT NOW TAB */}
        {activeTab === "test" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-2xl font-bold mb-4">Try It Now</h2>
              <p className="text-muted-foreground mb-6">Test API endpoints directly from your browser</p>
            </div>

            <div className="bg-card border border-border p-6 rounded-lg space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Method</label>
                <select 
                  value={testMethod} 
                  onChange={(e) => setTestMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                >
                  <option>GET</option>
                  <option>POST</option>
                  <option>PUT</option>
                  <option>DELETE</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Endpoint Path</label>
                <input 
                  type="text" 
                  placeholder="/api/transactions"
                  value={testEndpoint}
                  onChange={(e) => setTestEndpoint(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                />
              </div>

              {testMethod !== "GET" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Request Body (JSON)</label>
                  <textarea 
                    placeholder='{"key": "value"}'
                    value={testData}
                    onChange={(e) => setTestData(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background font-mono text-xs h-32"
                  />
                </div>
              )}

              <Button 
                onClick={tryItNow}
                disabled={testLoading}
                className="w-full"
              >
                <Play className="mr-2 h-4 w-4" />
                {testLoading ? "Testing..." : "Test Endpoint"}
              </Button>

              {testResult && (
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-xs font-medium mb-2">Response:</p>
                  <pre className="text-xs overflow-x-auto max-h-64 text-muted-foreground">
                    <code>{testResult}</code>
                  </pre>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* EXAMPLES TAB */}
        {activeTab === "examples" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-2xl font-bold mb-4">Code Examples</h2>
              <p className="text-muted-foreground mb-6">
                Production-ready examples using demo API keys
              </p>
            </div>

            {/* JavaScript Example */}
            <div className="space-y-3">
              <h3 className="text-xl font-bold">JavaScript/Node.js</h3>
              <CodeBlock
                code={`// Get your API key from Settings → API Keys dashboard
const API_KEY = process.env.GREENPAY_API_KEY;
const BASE_URL = '${API_BASE_URL}';

if (!API_KEY) {
  throw new Error('GREENPAY_API_KEY environment variable not set');
}

// Send money
async function sendMoney(recipientId, amount, currency) {
  const response = await fetch(\`\${BASE_URL}/api/transactions/send\`, {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${API_KEY}\`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      amount,
      currency,
      recipientDetails: { userId: recipientId }
    })
  });
  
  if (!response.ok) {
    throw new Error(\`API Error: \${response.status}\`);
  }
  
  return await response.json();
}

// Get exchange rate
async function getExchangeRate(from, to) {
  const response = await fetch(
    \`\${BASE_URL}/api/exchange-rates/\${from}/\${to}\`,
    {
      headers: { 'Authorization': \`Bearer \${API_KEY}\` }
    }
  );
  return await response.json();
}`}
                language="javascript"
                id="js-example"
              />
            </div>

            {/* Python Example */}
            <div className="space-y-3">
              <h3 className="text-xl font-bold">Python</h3>
              <CodeBlock
                code={`import requests
import os

# Get your API key from Settings → API Keys dashboard
API_KEY = os.getenv('GREENPAY_API_KEY')
BASE_URL = '${API_BASE_URL}'

if not API_KEY:
    raise ValueError('GREENPAY_API_KEY environment variable not set')

headers = {
    'Authorization': f'Bearer {API_KEY}',
    'Content-Type': 'application/json'
}

# Send money
def send_money(recipient_id, amount, currency):
    response = requests.post(
        f'{BASE_URL}/api/transactions/send',
        headers=headers,
        json={
            'amount': amount,
            'currency': currency,
            'recipientDetails': {'userId': recipient_id}
        }
    )
    return response.json()

# Get transaction history
def get_transactions(user_id):
    response = requests.get(
        f'{BASE_URL}/api/transactions/{user_id}',
        headers=headers
    )
    return response.json()

# Pay bills
def pay_bill(provider, amount, account_number):
    response = requests.post(
        f'{BASE_URL}/api/bills/pay',
        headers=headers,
        json={
            'provider': provider,
            'amount': amount,
            'accountNumber': account_number
        }
    )
    return response.json()`}
                language="python"
                id="python-example"
              />
            </div>

            {/* cURL Examples */}
            <div className="space-y-3">
              <h3 className="text-xl font-bold">cURL</h3>
              <p className="text-sm text-muted-foreground mb-3">Replace <code className="bg-muted px-1 py-0.5 rounded">YOUR_API_KEY</code> with your actual API key from the dashboard</p>
              <CodeBlock
                code={`# Get user profile
curl -X GET ${API_BASE_URL}/api/users/profile \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"

# Get exchange rate
curl -X GET ${API_BASE_URL}/api/exchange-rates/USD/KES \\
  -H "Authorization: Bearer YOUR_API_KEY"

# Send money
curl -X POST ${API_BASE_URL}/api/transactions/send \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": "100",
    "currency": "USD",
    "recipientDetails": {"userId": "recipient-id"}
  }'

# Pay bill
curl -X POST ${API_BASE_URL}/api/bills/pay \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "provider": "kplc",
    "amount": "1000",
    "meterNumber": "12345678"
  }'`}
                language="bash"
                id="curl-examples"
              />
            </div>

            {/* Error Handling */}
            <div className="bg-card border border-border p-6 rounded-lg space-y-4">
              <h3 className="text-lg font-bold">Error Handling</h3>
              <CodeBlock
                code={`// Always handle errors in production
try {
  const response = await fetch(\`\${BASE_URL}/api/endpoint\`, {
    headers: { 'Authorization': \`Bearer gpay_demo_test\` }
  });
  
  if (!response.ok) {
    const error = await response.json();
    switch (response.status) {
      case 401:
        console.error('Unauthorized - Invalid API key');
        break;
      case 403:
        console.error('Forbidden - Insufficient permissions');
        break;
      case 404:
        console.error('Not found - Invalid endpoint');
        break;
      case 429:
        console.error('Rate limit exceeded');
        break;
      default:
        console.error('Error:', error.message);
    }
  }
  
  const data = await response.json();
  return data;
} catch (error) {
  console.error('Network error:', error);
  // Implement retry logic here
}`}
                language="javascript"
                id="error-handling"
              />
            </div>
          </motion.div>
        )}

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="border-t border-border pt-8 mt-8 space-y-4"
        >
          <div className="bg-card p-6 rounded-lg">
            <h3 className="font-bold mb-3">📞 Support</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>📧 Email: api-support@greenpay.world</li>
              <li>🐛 Issues: github.com/greenpay/api-issues</li>
              <li>📚 Docs: docs.greenpay.world</li>
              <li>💬 Community: community.greenpay.world</li>
            </ul>
          </div>
        </motion.div>
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 p-4 shadow-lg max-w-md mx-auto">
        <div className="space-y-3">
          <div className="px-2">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">API Reference</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">REST API v1.0</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() => setLocation('/api-service')}
              className="bg-green-600 hover:bg-green-700 text-white w-full"
            >
              <Code2 className="w-4 h-4 mr-2" />
              Generate Key
            </Button>
            <Button
              onClick={() => setLocation('/dashboard')}
              className="bg-blue-600 hover:bg-blue-700 text-white w-full"
            >
              Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
