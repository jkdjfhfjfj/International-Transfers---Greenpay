import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import QRCode from "@/components/qr-code";
import { mockCurrencies } from "@/lib/mock-data";
import { WavyHeader } from "@/components/wavy-header";
import { Badge } from "@/components/ui/badge";
import { Copy, Share2, QrCode, Inbox } from "lucide-react";

const paymentRequestSchema = z.object({
  amount: z.string().min(1, "Amount is required").refine((val) => parseFloat(val) > 0, "Amount must be greater than 0"),
  currency: z.string().min(1, "Please select a currency"),
  toEmail: z.string().optional(),
  toPhone: z.string().optional(),
  message: z.string().optional(),
}).refine((data) => data.toEmail || data.toPhone, {
  message: "Please enter either email or phone number",
  path: ["toEmail"],
});

type PaymentRequestForm = z.infer<typeof paymentRequestSchema>;

export default function ReceiveMoneyPage() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/pay-to/:userId");
  const [activeTab, setActiveTab] = useState<"qr" | "request">("qr");
  const [receiveLink, setReceiveLink] = useState<string>("");
  const [receiverUserId, setReceiverUserId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (match && params?.userId) {
      setReceiverUserId(params.userId);
      setActiveTab("request");
    }
  }, [match, params]);

  // Fetch unique receive link and received payment requests
  const { data: receiveLinkData } = useQuery({
    queryKey: ["/api/receive-payment-link"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/receive-payment-link");
      return response.json();
    },
  });

  const { data: receivedRequests = { requests: [] } } = useQuery({
    queryKey: ["/api/payment-requests-received"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/payment-requests-received");
      return response.json();
    },
  });

  useEffect(() => {
    if (receiveLinkData?.receiveLink) {
      setReceiveLink(receiveLinkData.receiveLink);
    }
  }, [receiveLinkData]);

  const form = useForm<PaymentRequestForm>({
    resolver: zodResolver(paymentRequestSchema),
    defaultValues: {
      amount: "",
      currency: "USD",
      toEmail: "",
      toPhone: "",
      message: "",
    },
  });

  const paymentRequestMutation = useMutation({
    mutationFn: async (data: PaymentRequestForm) => {
      const response = await apiRequest("POST", "/api/payment-requests", {
        fromUserId: user?.id,
        toUserId: receiverUserId,
        ...data,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Payment request sent!",
        description: "The recipient will be notified about your payment request.",
      });
      form.reset();
    },
    onError: () => {
      toast({
        title: "Request failed",
        description: "Unable to send payment request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PaymentRequestForm) => {
    paymentRequestMutation.mutate(data);
  };

  const handleCopyAccountDetail = (text: string, label: string) => {
    const doToast = () => toast({ title: "Copied!", description: `${label} copied to clipboard.` });
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(doToast).catch(() => {
        // fallback for browsers that block clipboard API
        const el = document.createElement("textarea");
        el.value = text;
        el.style.position = "fixed";
        el.style.opacity = "0";
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
        doToast();
      });
    } else {
      const el = document.createElement("textarea");
      el.value = text;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      doToast();
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'GreenPay QR Code',
        text: 'Scan this QR code to send me money via GreenPay',
      });
    } else {
      toast({
        title: "QR Code ready",
        description: "Save or screenshot the QR code to share.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-6">
      {/* Header */}
      <WavyHeader
        
        
        size="sm"
      />

      <div className="p-6 space-y-6">
        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex space-x-1 bg-muted p-1 rounded-lg"
        >
          <button
            onClick={() => setActiveTab("qr")}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all ${
              activeTab === "qr" ? "bg-card text-foreground elevation-1" : "text-muted-foreground hover:text-foreground"
            }`}
            data-testid="tab-qr"
          >
            QR Code
          </button>
          <button
            onClick={() => setActiveTab("request")}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all ${
              activeTab === "request" ? "bg-card text-foreground elevation-1" : "text-muted-foreground hover:text-foreground"
            }`}
            data-testid="tab-request"
          >
            Request Payment
          </button>
        </motion.div>

        {activeTab === "qr" && (
          <>
            {/* QR Code Section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-card to-muted p-8 rounded-xl border border-border text-center elevation-2 shadow-lg"
            >
              <div className="flex items-center justify-center mb-4">
                <QrCode className="w-10 h-10 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Your Unique Payment Link</h3>
              <p className="text-sm text-muted-foreground mb-6">Share this QR code or link for instant payments</p>
              
              {/* QR Code Display */}
              <div className="flex justify-center mb-6 p-4 bg-white rounded-xl">
                <QRCode
                  value={receiveLinkData?.qrValue || `greenpay://pay/${user?.id}`}
                  size={220}
                  className="mx-auto"
                />
              </div>

              {/* Unique Link Display */}
              <div className="bg-muted p-3 rounded-lg mb-4 break-all text-sm font-mono">
                {receiveLink || `${window.location.origin}/pay-to/${user?.id}`}
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(receiveLink || `${window.location.origin}/pay-to/${user?.id}`);
                    toast({ title: "Link copied to clipboard!" });
                  }}
                  className="w-full"
                  data-testid="button-copy-link"
                >
                  <Copy className="w-4 h-4 mr-1.5" />
                  Copy Link
                </Button>
                <Button
                  onClick={handleShare}
                  variant="outline"
                  className="w-full"
                  data-testid="button-share-qr"
                >
                  <Share2 className="w-4 h-4 mr-1.5" />
                  Share Link & QR
                </Button>
              </div>
            </motion.div>

            {/* Account Details */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card p-4 rounded-xl border border-border elevation-1"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Share Account Details</h3>
                <button
                  onClick={() => {
                    const details = `Account: GP-${user?.id?.slice(-9)}\nBank: GreenPay Digital Bank\nName: ${user?.fullName}`;
                    navigator.clipboard.writeText(details);
                    toast({ title: "All details copied!" });
                  }}
                  className="text-primary text-sm hover:underline"
                  data-testid="button-copy-all"
                >
                  Copy All
                </button>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-muted rounded-xl">
                  <div>
                    <p className="text-sm text-muted-foreground">Account Number</p>
                    <p className="font-medium font-mono">GP-{user?.id?.slice(-9) || "123456789"}</p>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleCopyAccountDetail(`GP-${user?.id?.slice(-9) || "123456789"}`, "Account number")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
                    data-testid="button-copy-account"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">Copy</span>
                  </motion.button>
                </div>

                <div className="flex justify-between items-center p-3 bg-muted rounded-xl">
                  <div>
                    <p className="text-sm text-muted-foreground">Bank Name</p>
                    <p className="font-medium">GreenPay Digital Bank</p>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleCopyAccountDetail("GreenPay Digital Bank", "Bank name")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
                    data-testid="button-copy-bank"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">Copy</span>
                  </motion.button>
                </div>

                <div className="flex justify-between items-center p-3 bg-muted rounded-xl">
                  <div>
                    <p className="text-sm text-muted-foreground">Account Name</p>
                    <p className="font-medium">{user?.fullName}</p>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleCopyAccountDetail(user?.fullName || "", "Account name")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
                    data-testid="button-copy-name"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">Copy</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}

        {activeTab === "request" && (
          <>
            {/* Payment Request Form */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card p-4 rounded-xl border border-border elevation-1"
            >
              <h3 className="font-semibold mb-4">Request Payment</h3>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    <FormField
                      control={form.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-currency">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {mockCurrencies.slice(0, 3).map((currency) => (
                                <SelectItem key={currency.code} value={currency.code}>
                                  {currency.code}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    <div className="col-span-2">
                      <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                data-testid="input-request-amount"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="toEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recipient Email</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            placeholder="Enter email address"
                            data-testid="input-recipient-email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="toPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recipient Phone (Alternative)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="tel"
                            placeholder="Enter phone number"
                            data-testid="input-recipient-phone"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Add a note for your payment request"
                            className="h-20"
                            data-testid="textarea-message"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full ripple"
                    disabled={paymentRequestMutation.isPending}
                    data-testid="button-send-request"
                  >
                    {paymentRequestMutation.isPending ? "Sending..." : "Send Payment Request"}
                  </Button>
                </form>
              </Form>
            </motion.div>
          </>
        )}

        {/* Received Payment Requests */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card rounded-xl border border-border elevation-1"
        >
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold">Incoming Payment Requests</h3>
          </div>
          
          {receivedRequests.requests && receivedRequests.requests.length > 0 ? (
            <div className="divide-y divide-border">
              {receivedRequests.requests.map((request: any) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium text-sm">From: {request.fromUserId?.slice(0, 8)}...</p>
                      <p className="text-xs text-muted-foreground">{request.message}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary">{request.currency} {request.amount}</p>
                      <Badge variant={request.status === 'pending' ? 'default' : 'secondary'} className="text-xs mt-1">
                        {request.status === 'pending' ? '⏳ Pending' : '✓ Paid'}
                      </Badge>
                    </div>
                  </div>
                  
                  {request.status === 'pending' && (
                    <Button
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => {
                        // TODO: Navigate to payment form with request details
                        setLocation(`/send-money?requestId=${request.id}`);
                      }}
                    >
                      Pay Now
                    </Button>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <Inbox className="w-10 h-10 text-muted-foreground mb-3 mx-auto" />
              <p className="text-muted-foreground">No incoming payment requests</p>
              <p className="text-sm text-muted-foreground mt-1">Payment requests from others will appear here</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
