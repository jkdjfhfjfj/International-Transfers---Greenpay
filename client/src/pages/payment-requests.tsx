import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { usePaymentRequests, useIncomingPaymentRequests } from "@/hooks/use-payment-requests";
import { useToast } from "@/hooks/use-toast";
import { WavyHeader } from "@/components/wavy-header";
import BottomNavigation from "@/components/bottom-navigation";
import { Plus, Copy, ExternalLink, Send, Inbox, Check, Clock, XCircle, ArrowRight } from "lucide-react";

type TabType = "sent" | "received";

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; icon: any }> = {
    pending: { label: "Pending", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: Clock },
    paid: { label: "Paid", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: Check },
    accepted: { label: "Accepted", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: Check },
    declined: { label: "Declined", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: XCircle },
    cancelled: { label: "Cancelled", color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400", icon: XCircle },
  };
  const info = map[status] || { label: status, color: "bg-gray-100 text-gray-600", icon: Clock };
  const Icon = info.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${info.color}`}>
      <Icon className="w-3 h-3" />
      {info.label}
    </span>
  );
}

export default function PaymentRequestsPage() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<TabType>("sent");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [newRequest, setNewRequest] = useState({
    toEmail: "",
    toPhone: "",
    amount: "",
    currency: "KES",
    message: "",
  });
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: sentData, isLoading: sentLoading } = usePaymentRequests();
  const { data: receivedData, isLoading: receivedLoading } = useIncomingPaymentRequests();

  const sentRequests = sentData?.requests || [];
  const receivedRequests = receivedData?.requests || [];

  const handleCreateRequest = async () => {
    try {
      const response = await fetch('/api/payment-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromUserId: user?.id,
          ...newRequest,
          amount: parseFloat(newRequest.amount),
        }),
      });
      if (response.ok) {
        toast({ title: "Payment Request Created", description: "Your payment request has been sent successfully" });
        setShowCreateDialog(false);
        setNewRequest({ toEmail: "", toPhone: "", amount: "", currency: "KES", message: "" });
        window.location.reload();
      } else {
        const err = await response.json();
        toast({ title: "Error", description: err.message || "Failed to create payment request", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to create payment request", variant: "destructive" });
    }
  };

  const copyLink = async (link: string, id: string) => {
    await navigator.clipboard.writeText(link);
    setCopiedId(id);
    toast({ title: "Link Copied", description: "Payment link copied to clipboard" });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAction = async (id: string, action: "accept" | "decline" | "cancel") => {
    try {
      const response = await fetch(`/api/payment-requests/${id}/${action}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id }),
      });
      if (response.ok) {
        toast({ title: `Request ${action}ed`, description: `Payment request has been ${action}ed.` });
        window.location.reload();
      } else {
        toast({ title: "Error", description: "Action failed", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Action failed", variant: "destructive" });
    }
  };

  const currencies = [
    { code: "USD", name: "US Dollar" },
    { code: "KES", name: "Kenyan Shilling" },
  ];

  const isLoading = activeTab === "sent" ? sentLoading : receivedLoading;
  const requests = activeTab === "sent" ? sentRequests : receivedRequests;

  return (
    <div className="min-h-screen bg-background pb-28">
      <WavyHeader
        title="Payment Requests"
        subtitle="Send & receive money requests"
        onBack={() => setLocation("/dashboard")}
        size="md"
        rightContent={
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <motion.button
                whileTap={{ scale: 0.88 }}
                style={{
                  width: 38, height: 38, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.18)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.22)',
                  color: 'white', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Plus size={20} strokeWidth={2.5} />
              </motion.button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>New Payment Request</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Amount *</Label>
                  <div className="flex space-x-2 mt-1">
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={newRequest.amount}
                      onChange={(e) => setNewRequest({ ...newRequest, amount: e.target.value })}
                      className="flex-1"
                    />
                    <Select value={newRequest.currency} onValueChange={(v) => setNewRequest({ ...newRequest, currency: v })}>
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map((c) => (
                          <SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Email Address</Label>
                  <Input
                    type="email"
                    placeholder="recipient@email.com"
                    value={newRequest.toEmail}
                    onChange={(e) => setNewRequest({ ...newRequest, toEmail: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Phone Number</Label>
                  <Input
                    placeholder="+254 700 000 000"
                    value={newRequest.toPhone}
                    onChange={(e) => setNewRequest({ ...newRequest, toPhone: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Message (Optional)</Label>
                  <Input
                    placeholder="What's this payment for?"
                    value={newRequest.message}
                    onChange={(e) => setNewRequest({ ...newRequest, message: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div className="flex space-x-2 pt-2">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="flex-1">Cancel</Button>
                  <Button
                    onClick={handleCreateRequest}
                    disabled={!newRequest.amount || (!newRequest.toEmail && !newRequest.toPhone)}
                    className="flex-1"
                  >
                    Send Request
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="max-w-md mx-auto px-4 pt-4 space-y-4">
        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card rounded-2xl p-3 text-center border border-border">
            <p className="text-xl font-bold text-amber-600">{[...sentRequests, ...receivedRequests].filter(r => r.status === 'pending').length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Pending</p>
          </div>
          <div className="bg-card rounded-2xl p-3 text-center border border-border">
            <p className="text-xl font-bold text-green-600">{[...sentRequests, ...receivedRequests].filter(r => r.status === 'paid' || r.status === 'accepted').length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Completed</p>
          </div>
          <div className="bg-card rounded-2xl p-3 text-center border border-border">
            <p className="text-xl font-bold text-primary">{sentRequests.length + receivedRequests.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Total</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 bg-muted/50 p-1 rounded-xl">
          {([
            { key: "sent", label: "Sent", icon: Send },
            { key: "received", label: "Received", icon: Inbox },
          ] as { key: TabType; label: string; icon: any }[]).map(({ key, label, icon: Icon }) => (
            <motion.button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === key
                  ? "bg-white dark:bg-gray-800 text-primary shadow-sm"
                  : "text-muted-foreground"
              }`}
              whileTap={{ scale: 0.96 }}
            >
              <Icon className="w-4 h-4" />
              {label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                activeTab === key ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
              }`}>
                {key === "sent" ? sentRequests.length : receivedRequests.length}
              </span>
            </motion.button>
          ))}
        </div>

        {/* List */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : requests.length === 0 ? (
              <div className="bg-card rounded-2xl border border-border p-8 text-center">
                {activeTab === "sent" ? (
                  <Send className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                ) : (
                  <Inbox className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                )}
                <p className="font-semibold mb-1">
                  {activeTab === "sent" ? "No requests sent yet" : "No incoming requests"}
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  {activeTab === "sent"
                    ? "Create a payment request to collect money from others"
                    : "Payment requests sent to you will appear here"}
                </p>
                {activeTab === "sent" && (
                  <Button size="sm" onClick={() => setShowCreateDialog(true)}>
                    <Plus className="w-4 h-4 mr-1" /> New Request
                  </Button>
                )}
              </div>
            ) : (
              requests.map((req: any, i: number) => (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i }}
                  className="bg-card rounded-2xl border border-border p-4 space-y-3"
                >
                  {/* Header row */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-base">
                        {req.currency} {parseFloat(req.amount || 0).toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(req.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                    <StatusPill status={req.status} />
                  </div>

                  {/* Meta */}
                  <div className="space-y-1">
                    {req.toEmail && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <span className="material-icons text-xs">email</span> {req.toEmail}
                      </p>
                    )}
                    {req.toPhone && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <span className="material-icons text-xs">phone</span> {req.toPhone}
                      </p>
                    )}
                    {req.message && (
                      <p className="text-xs text-muted-foreground italic">"{req.message}"</p>
                    )}
                  </div>

                  {/* Payment link (sent requests) */}
                  {activeTab === "sent" && req.status === "pending" && req.paymentLink && (
                    <div className="bg-muted/50 rounded-xl p-3 space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground">Share Payment Link</p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground flex-1 truncate font-mono">{req.paymentLink}</p>
                        <motion.button
                          whileTap={{ scale: 0.88 }}
                          onClick={() => copyLink(req.paymentLink, req.id)}
                          className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0"
                        >
                          {copiedId === req.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.88 }}
                          onClick={() => window.open(req.paymentLink, '_blank')}
                          className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>
                  )}

                  {/* Actions (received requests) */}
                  {activeTab === "received" && req.status === "pending" && (
                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => handleAction(req.id, "decline")}
                      >
                        Decline
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 bg-primary hover:bg-primary/90"
                        onClick={() => handleAction(req.id, "accept")}
                      >
                        Pay Now <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  )}

                  {/* Cancel (sent pending) */}
                  {activeTab === "sent" && req.status === "pending" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-full text-muted-foreground text-xs"
                      onClick={() => handleAction(req.id, "cancel")}
                    >
                      Cancel Request
                    </Button>
                  )}
                </motion.div>
              ))
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      <BottomNavigation />
    </div>
  );
}
