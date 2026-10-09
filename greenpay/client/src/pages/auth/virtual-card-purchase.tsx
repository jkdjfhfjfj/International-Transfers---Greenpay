import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useInitializeCardPayment, useVerifyCardPayment } from "@/hooks/use-paystack";
import { apiRequest } from "@/lib/queryClient";
import { WavyHeader } from "@/components/wavy-header";
import mastercardLogo from "@assets/images_(8)_1766711928429.png";
import visaLogo from "@assets/images_(7)_1766711307308.png";

export default function VirtualCardPurchasePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, login } = useAuth();
  const isKenyanUser = ["ke", "kenya", "republic of kenya"].includes(String(user?.country || "").trim().toLowerCase());

  const [paymentReference, setPaymentReference] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'auto' | 'card' | 'crypto' | 'manual'>('auto');
  const [cryptoCoin, setCryptoCoin] = useState("USDT");
  const initializePayment = useInitializeCardPayment();
  const verifyPayment = useVerifyCardPayment();

  // Fetch card price settings
  const { data: settingsData } = useQuery({
    queryKey: ["/api/system-settings/card-price"],
  });

  const { data: discountData } = useQuery({
    queryKey: ["/api/system-settings/discount-enabled"],
    queryFn: async () => {
      const r = await apiRequest("GET", "/api/system-settings/discount-enabled");
      return r.json();
    },
  });

  const { data: manualPaymentData } = useQuery({
    queryKey: ["/api/manual-payment-settings"],
    enabled: !!user?.id && isKenyanUser,
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/manual-payment-settings");
      return response.json();
    },
    refetchInterval: 60_000,
  });

  const { data: cryptoPricesData } = useQuery({
    queryKey: ["/api/crypto/prices"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/crypto/prices");
      return response.json();
    },
    enabled: !!user?.id,
  });

  const cryptoCardPurchase = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/crypto/buy-card", { coin: cryptoCoin });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to start crypto card purchase");
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Crypto card purchase started",
        description: data.message,
      });
    },
    onError: (error: any) => {
      toast({ title: "Crypto payment failed", description: error.message, variant: "destructive" });
    },
  });

  const currentCardPrice = (settingsData as any)?.price || "60.00";
  const originalPrice = "60.00";
  const hasDiscount = parseFloat(currentCardPrice) < parseFloat(originalPrice);
  const discountEnabled = (discountData as any)?.enabled !== false;
  const discountPct = hasDiscount
    ? Math.round((1 - parseFloat(currentCardPrice) / parseFloat(originalPrice)) * 100)
    : 0;
  const showDiscount = discountEnabled && hasDiscount;
  const manualPaymentEnabled = isKenyanUser && Boolean((manualPaymentData as any)?.enabled);
  const cryptoPrices = (cryptoPricesData as any)?.prices || {};
  const cryptoRate = Number(cryptoPrices[cryptoCoin] || 0);
  const cryptoCardAmount = cryptoRate > 0 ? parseFloat(currentCardPrice) / cryptoRate : 0;

  useEffect(() => {
    if (paymentMethod === "manual" && !manualPaymentEnabled) setPaymentMethod("auto");
  }, [paymentMethod, manualPaymentEnabled]);

  // Listen for payment completion (in real app, use webhooks)
  useState(() => {
    const checkPaymentStatus = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const reference = urlParams.get('reference');
      const status = urlParams.get('status');
      
      if (reference && status === 'success') {
        verifyPayment.mutate(reference, {
          onSuccess: () => {
            setLocation('/dashboard');
          }
        });
      }
    };
    
    checkPaymentStatus();
  });

  const handlePurchase = () => {
    initializePayment.mutate(paymentMethod === "card" ? "card" : "mobile_money", {
      onSuccess: (data) => {
        const redirectUrl = data.redirectUrl || data.authorization_url;
        if (redirectUrl) {
          window.location.href = redirectUrl;
        } else if (data.reference) {
          setLocation(`/payment-processing?reference=${encodeURIComponent(data.reference)}&type=virtual-card`);
        }
      },
      onError: (error: any) => {
        toast({
          title: "Payment Failed",
          description: error.message || "Unable to initialize payment. Please try again.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background pb-20">
      <WavyHeader size="sm" />

      <div className="flex-1 p-6 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-sm mx-auto text-center w-full"
        >
          {/* Card Visual */}
          <motion.div
            initial={{ scale: 0.8, rotateY: -30 }}
            animate={{ scale: 1, rotateY: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="bg-gradient-to-br from-green-600 via-emerald-700 to-green-900 p-6 rounded-2xl mb-6 elevation-3 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-56 h-56 bg-white/5 rounded-full -translate-y-16 translate-x-16 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full translate-y-12 -translate-x-8 pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-green-200 text-sm font-medium">Geepay Card</p>
                  <p className="text-white/50 text-xs">Virtual</p>
                </div>
                <div className="flex gap-1.5">
                  <div className="w-8 h-5 rounded bg-white/25" />
                  <div className="w-5 h-5 rounded-full bg-white/40" />
                </div>
              </div>
              <p className="text-xl font-mono tracking-widest text-green-100 mb-6">
                •••• •••• •••• ••••
              </p>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-green-300 text-[10px] uppercase tracking-widest mb-0.5">Cardholder</p>
                  <p className="text-sm font-semibold">{user?.fullName?.toUpperCase() || "YOUR NAME"}</p>
                </div>
                <div>
                  <p className="text-green-300 text-[10px] uppercase tracking-widest mb-0.5">Expires</p>
                  <p className="text-sm font-semibold">••/••</p>
                </div>
                <div>
                  <p className="text-green-300 text-[10px] uppercase tracking-widest mb-0.5">CVV</p>
                  <p className="text-sm font-semibold">•••</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.h2
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold mb-4"
          >
            Almost There!
          </motion.h2>
          
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-muted-foreground mb-8"
          >
            To start sending and receiving money, you need to purchase a virtual card.
            This one-time fee unlocks all features.
          </motion.p>

          {/* Pricing Card */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-card p-4 rounded-xl border border-border mb-4 elevation-1"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium">Virtual Card (Annual)</span>
              <div className="flex items-center gap-2">
                {showDiscount && (
                  <span className="text-sm line-through text-muted-foreground">${originalPrice}</span>
                )}
                <span className="text-xl font-bold text-primary">${currentCardPrice}</span>
                {showDiscount && (
                  <div className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                    {discountPct}% OFF
                  </div>
                )}
              </div>
            </div>
            <div className="text-left space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center">
                <span className="material-icons text-green-500 text-sm mr-2">check</span>
                <span>Send money worldwide</span>
              </div>
              <div className="flex items-center">
                <span className="material-icons text-green-500 text-sm mr-2">check</span>
                <span>Receive money instantly</span>
              </div>
              <div className="flex items-center">
                <span className="material-icons text-green-500 text-sm mr-2">check</span>
                <span>Withdraw to bank accounts</span>
              </div>
              <div className="flex items-center">
                <span className="material-icons text-green-500 text-sm mr-2">check</span>
                <span>24/7 customer support</span>
              </div>
            </div>
          </motion.div>

          {/* Partner Section */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.55 }}
            className="bg-card p-4 rounded-xl border border-border mb-6 elevation-1"
          >
            <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-widest">Accepted cards</p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <div className="flex items-center gap-1.5 bg-muted px-3 py-1.5 rounded-lg">
                <img src={visaLogo} alt="Visa" className="h-7 w-7 object-contain" />
              </div>
              <div className="flex items-center gap-1.5 bg-muted px-3 py-1.5 rounded-lg">
                <img src={mastercardLogo} alt="Mastercard" className="h-7 w-11 object-contain" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="space-y-4"
          >
            {/* Payment Method Selection */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Choose Payment Method</h3>
              
              {/* Auto Payment Option (Recommended) */}
              <motion.div
                whileTap={{ scale: 0.98 }}
                onClick={() => setPaymentMethod('auto')}
                className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  paymentMethod === 'auto' 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border bg-card hover:border-primary/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 transition-all ${
                      paymentMethod === 'auto' ? 'border-primary bg-primary' : 'border-border'
                    }`}>
                      {paymentMethod === 'auto' && (
                        <span className="material-icons text-white text-xs">check</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{isKenyanUser ? "Mobile money" : "Local checkout"}</h4>
                        <span className="bg-green-500/10 text-green-700 dark:text-green-400 text-xs px-2 py-0.5 rounded-full font-medium">
                          Recommended
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {isKenyanUser
                          ? "Get a payment prompt on your phone."
                          : "Continue to checkout using the currency available for your country."}
                      </p>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="material-icons text-green-500 text-xs">bolt</span>
                        <span className="text-muted-foreground">Instant</span>
                        <span className="material-icons text-green-500 text-xs ml-2">security</span>
                        <span className="text-muted-foreground">Secure</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {isKenyanUser && (
              <motion.div
                whileTap={{ scale: 0.98 }}
                onClick={() => setPaymentMethod("card")}
                className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  paymentMethod === "card"
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:border-primary/50"
                }`}
                data-testid="option-card-payment"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                    paymentMethod === "card" ? "border-primary bg-primary" : "border-border"
                  }`}>
                    {paymentMethod === "card" && <span className="material-icons text-white text-xs">check</span>}
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Debit or credit card</h4>
                    <p className="text-xs text-muted-foreground">Pay securely by card.</p>
                  </div>
                </div>
              </motion.div>
              )}

              {manualPaymentEnabled && (
                <motion.div
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setPaymentMethod("manual")}
                  className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    paymentMethod === "manual"
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-primary/50"
                  }`}
                  data-testid="option-manual-payment"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                      paymentMethod === "manual" ? "border-primary bg-primary" : "border-border"
                    }`}>
                      {paymentMethod === "manual" && <span className="material-icons text-white text-xs">check</span>}
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Manual M-Pesa</h4>
                      <p className="text-xs text-muted-foreground">Use the configured paybill details and have your payment verified.</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Crypto Payment Option */}
              <motion.div
                whileTap={{ scale: 0.98 }}
                onClick={() => setPaymentMethod('crypto')}
                className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  paymentMethod === 'crypto'
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-card hover:border-primary/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                    paymentMethod === 'crypto' ? 'border-primary bg-primary' : 'border-border'
                  }`}>
                    {paymentMethod === 'crypto' && <span className="material-icons text-white text-xs">check</span>}
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Pay with Crypto</h4>
                    <p className="text-xs text-muted-foreground mb-2">
                      Use a live CoinGecko price to calculate the exact amount.
                    </p>
                  <div className="flex items-center gap-2 text-xs">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[11px] font-bold">₿</span>
                      <span className="text-muted-foreground">BTC, ETH, USDT, or USDC</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Auto Payment Details & Button */}
            {(paymentMethod === 'auto' || paymentMethod === 'card') && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <Button
                  onClick={handlePurchase}
                  className="w-full ripple"
                  disabled={initializePayment.isPending}
                  data-testid="button-purchase-card"
                >
                  {initializePayment.isPending
                    ? "Processing..."
                    : paymentMethod === "card"
                      ? `Pay with card · $${currentCardPrice}`
                      : isKenyanUser
                        ? `Pay with mobile money · $${currentCardPrice}`
                        : `Continue to checkout · $${currentCardPrice}`}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  {paymentMethod === "card"
                    ? "Your card will be activated after payment confirmation."
                    : isKenyanUser
                      ? "Complete the payment using the prompt sent to your phone."
                      : "Your card will be activated after hosted checkout confirms payment."}
                </p>
              </motion.div>
            )}

            {paymentMethod === "manual" && manualPaymentEnabled && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-muted/50 p-4 rounded-xl border border-border text-left space-y-3"
                data-testid="panel-manual-payment"
              >
                <div>
                  <h4 className="font-semibold">Manual M-Pesa payment</h4>
                  <p className="mt-1 text-xs text-muted-foreground">Virtual card price: ${currentCardPrice} USD</p>
                </div>
                <div className="flex justify-between gap-3 rounded-lg bg-background p-3">
                  <span className="text-sm text-muted-foreground">Paybill</span>
                  <span className="font-mono font-semibold" data-testid="text-manual-paybill">
                    {(manualPaymentData as any)?.paybill}
                  </span>
                </div>
                <div className="flex justify-between gap-3 rounded-lg bg-background p-3">
                  <span className="text-sm text-muted-foreground">Account</span>
                  <span className="font-mono font-semibold" data-testid="text-manual-account">
                    {(manualPaymentData as any)?.account}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground" data-testid="text-manual-payment-next-step">
                  Confirm the current KES amount with support before paying. Keep your payment receipt and contact support for verification. Your card activates only after payment is confirmed.
                </p>
              </motion.div>
            )}

            {paymentMethod === 'crypto' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-muted/50 p-4 rounded-xl border border-border text-left space-y-3"
              >
                <label className="text-sm font-medium">Crypto to use</label>
                <select value={cryptoCoin} onChange={(event) => setCryptoCoin(event.target.value)} className="w-full border border-border rounded-xl px-3 py-2 bg-background">
                  {["BTC", "ETH", "USDT", "USDC"].map((coin) => <option key={coin} value={coin}>{coin}</option>)}
                </select>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Live price</span>
                  <span className="font-semibold">{cryptoRate > 0 ? `$${cryptoRate.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "Loading..."}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Amount required</span>
                  <span className="font-bold text-primary">{cryptoCardAmount > 0 ? `${cryptoCardAmount.toFixed(8)} ${cryptoCoin}` : "—"}</span>
                </div>
                <Button
                  onClick={() => cryptoCardPurchase.mutate()}
                  className="w-full bg-primary hover:bg-primary/90"
                  disabled={!cryptoRate || cryptoCardPurchase.isPending}
                >
                  {cryptoCardPurchase.isPending ? "Preparing..." : `Start ${cryptoCoin} payment`}
                </Button>
                <p className="text-xs text-muted-foreground">
                  After sending the requested amount, support will confirm the blockchain payment and activate the card.
                </p>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
