
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Sparkles, Eye, EyeOff, Copy, Check, ShieldOff, Snowflake, ArrowRightLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { SiVisa, SiMastercard } from "react-icons/si";
import { formatNumber } from "@/lib/formatters";
import { WavyHeader } from "@/components/wavy-header";
import { useWallets } from "@/hooks/use-wallets";

export default function VirtualCardPage() {
  const [, setLocation] = useLocation();
  const [showCardDetails, setShowCardDetails] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [forceRepurchase, setForceRepurchase] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'auto' | 'manual' | 'crypto'>('auto');
  const [selectedCardIdx, setSelectedCardIdx] = useState(0);
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferDirection, setTransferDirection] = useState<'wallet_to_card' | 'card_to_wallet'>('wallet_to_card');
  const [transferAmount, setTransferAmount] = useState('');
  const touchStartX = useRef<number | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: cardData } = useQuery({
    queryKey: ["/api/virtual-card", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/virtual-card/${user?.id}`);
      return res.json();
    },
  });

  const { data: settingsData } = useQuery({
    queryKey: ["/api/system-settings/card-price"],
  });

  const { data: kesAmountData } = useQuery({
    queryKey: ["/api/convert-to-kes", settingsData],
    queryFn: async () => {
      const usdAmount = (settingsData as any)?.price || "60.00";
      const response = await apiRequest("POST", "/api/convert-to-kes", { usdAmount: parseFloat(usdAmount) });
      return response.json();
    },
    enabled: !!settingsData,
  });

  const { data: manualPaymentSettings } = useQuery({
    queryKey: ["/api/manual-payment-settings"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/manual-payment-settings");
      return response.json();
    },
  });

  const { data: discountData } = useQuery({
    queryKey: ["/api/system-settings/discount-enabled"],
    queryFn: async () => {
      const r = await apiRequest("GET", "/api/system-settings/discount-enabled");
      return r.json();
    },
  });

  const allCards: any[] = (cardData as any)?.cards || [];
  const card = allCards[selectedCardIdx] || (cardData as any)?.card || null;
  const hasCard = (user?.hasVirtualCard || allCards.length > 0) && !forceRepurchase;
  const currentCardPrice = (settingsData as any)?.price || "60.00";
  const originalPrice = "60.00";
  const discountEnabled = (discountData as any)?.enabled !== false;
  const discountPct = parseFloat(currentCardPrice) < parseFloat(originalPrice)
    ? Math.round((1 - parseFloat(currentCardPrice) / parseFloat(originalPrice)) * 100)
    : 0;
  const showDiscount = discountEnabled && discountPct > 0;
  const { wallets: userWallets } = useWallets();
  const realTimeBalance = userWallets.find((wallet) => wallet.currency === "USD")?.availableBalance || 0;
  const isBlocked = card?.status === 'blocked';
  const isFrozen = card?.status === 'frozen';
  const isExpired = card?.status === 'expired';
  const isActive = card?.status === 'active';
  const userFrozen = isFrozen && card?.freezeReason === 'Frozen by cardholder';

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(field);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const maskCardNumber = (number: string) => {
    if (showCardDetails) return number.replace(/(.{4})/g, "$1 ").trim();
    return `•••• •••• •••• ${number.slice(-4)}`;
  };

  const purchaseCardMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/virtual-card/initialize-payment", { userId: user?.id });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({ title: "STK Push Sent!", description: data.message || "Check your phone and enter your M-Pesa PIN." });
        setTimeout(() => setLocation(`/payment-processing?reference=${data.reference}&type=virtual-card`), 2000);
      } else {
        throw new Error(data.message || "Unable to initialize M-Pesa payment");
      }
    },
    onError: (error: any) => {
      toast({ title: "Purchase Failed", description: error.message || "Unable to initiate card purchase.", variant: "destructive" });
    },
  });

  const freezeMutation = useMutation({
    mutationFn: async (cardId: string) => {
      const res = await apiRequest("POST", `/api/virtual-card/${cardId}/freeze`, {});
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Card Frozen", description: "Your card has been temporarily frozen." });
      queryClient.invalidateQueries({ queryKey: ["/api/virtual-card", user?.id] });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message || "Could not freeze card.", variant: "destructive" }),
  });

  const unfreezeMutation = useMutation({
    mutationFn: async (cardId: string) => {
      const res = await apiRequest("POST", `/api/virtual-card/${cardId}/unfreeze`, {});
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Card Unfrozen", description: "Your card is active again." });
      queryClient.invalidateQueries({ queryKey: ["/api/virtual-card", user?.id] });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message || "Could not unfreeze card.", variant: "destructive" }),
  });

  const transferMutation = useMutation({
    mutationFn: async ({ cardId, direction, amount }: { cardId: string; direction: string; amount: string }) => {
      const res = await apiRequest("POST", "/api/virtual-card/transfer", { cardId, direction, amount });
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Transfer Complete", description: data.message });
      setTransferAmount('');
      setTransferOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/virtual-card", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (e: any) => toast({ title: "Transfer Failed", description: e.message || "Could not complete transfer.", variant: "destructive" }),
  });

  // Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0 && selectedCardIdx < allCards.length - 1) setSelectedCardIdx(selectedCardIdx + 1);
      else if (diff < 0 && selectedCardIdx > 0) setSelectedCardIdx(selectedCardIdx - 1);
    }
    touchStartX.current = null;
  };

  // ─── PURCHASE SCREEN ────────────────────────────────────────────────────────
  if (!hasCard) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <WavyHeader  size="sm" />

        <div className="p-6 space-y-6">
          {/* Card Preview */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="bg-gradient-to-br from-green-600 via-emerald-700 to-green-900 p-6 rounded-2xl text-white elevation-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-56 h-56 bg-white/5 rounded-full -translate-y-16 translate-x-16" />
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full translate-y-12 -translate-x-8" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <p className="text-green-200 text-sm font-medium">Geepay Card</p>
                    <p className="text-white/50 text-xs">Virtual</p>
                  </div>
                  <div className="flex gap-1.5">
                    <div className="w-8 h-5 rounded bg-white/25" />
                    <div className="w-5 h-5 rounded-full bg-white/40" />
                  </div>
                </div>
                <p className="text-xl font-mono tracking-widest text-green-100 mb-6">•••• •••• •••• ••••</p>
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
            </div>
          </motion.div>

          {/* Repurchase notice */}
          {forceRepurchase && card?.blockReason && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4"
            >
              <div className="flex items-start gap-3">
                <ShieldOff className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-red-700 dark:text-red-400">Your previous card was blocked</p>
                  <p className="text-xs text-red-600 dark:text-red-300 mt-0.5">{card.blockReason}</p>
                  <p className="text-xs text-red-500 dark:text-red-400 mt-1">Purchase a new card below to continue transacting.</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Purchase Info */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-card p-6 rounded-xl border border-border elevation-1"
          >
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <span className="material-icons text-primary text-2xl">credit_card</span>
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-2">Get Your Virtual Card</h2>
                <p className="text-muted-foreground text-sm">Purchase a virtual card to unlock international transactions and online payments.</p>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Virtual Card</span>
                  <div className="flex items-center gap-2">
                    {showDiscount && <span className="text-sm line-through text-muted-foreground">${originalPrice}</span>}
                    <span className="text-xl font-bold text-green-600">${currentCardPrice}</span>
                    {showDiscount && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">{discountPct}% OFF</span>}
                  </div>
                </div>
              </div>

              <div className="text-left space-y-2 py-1">
                {[
                  "Works for international online payments & subscriptions",
                  "Accepted wherever Visa is supported worldwide",
                  "Reload your card balance any time via M-Pesa",
                ].map((note, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>{note}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 py-1">
                <p className="text-xs text-muted-foreground text-center font-medium">Trusted partners in your country</p>
                <div className="flex items-center justify-center gap-4">
                  <div className="flex items-center gap-1.5 bg-muted px-3 py-2 rounded-lg shadow-sm"><SiVisa className="w-9 h-6 text-blue-600" /></div>
                  <div className="flex items-center gap-1.5 bg-muted px-3 py-2 rounded-lg shadow-sm"><SiMastercard className="w-7 h-7 text-orange-500" /></div>
                  <div className="flex items-center gap-1.5 bg-muted px-4 py-2 rounded-lg shadow-sm">
                    <span className="font-extrabold text-sm tracking-tight">
                      <span className="text-[#4caf50]">M</span><span className="text-[#e03a3e]">-Pesa</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex rounded-xl overflow-hidden border border-border">
                <button onClick={() => setPaymentMethod('auto')}
                  className={`flex-1 py-3 text-xs font-medium transition-colors flex flex-col items-center justify-center gap-0.5 ${
                    paymentMethod === 'auto' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'
                  }`} data-testid="button-payment-auto"
                >
                  M-Pesa
                  {paymentMethod === 'auto' && <span className="text-[9px] bg-white/20 text-primary-foreground px-1 py-0.5 rounded-full">Auto</span>}
                </button>
                <button onClick={() => setPaymentMethod('manual')}
                  className={`flex-1 py-3 text-xs font-medium transition-colors ${
                    paymentMethod === 'manual' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'
                  }`} data-testid="button-payment-manual"
                >
                  Manual
                </button>
                <button onClick={() => setPaymentMethod('crypto')}
                  className={`flex-1 py-3 text-xs font-medium transition-colors flex flex-col items-center justify-center gap-0.5 ${
                    paymentMethod === 'crypto' ? 'bg-orange-500 text-white' : 'bg-background text-muted-foreground hover:bg-muted'
                  }`} data-testid="button-payment-crypto"
                >
                  Crypto
                  {paymentMethod === 'crypto' && <span className="text-[9px] text-orange-100">₿ ETH USDT</span>}
                </button>
              </div>

              {paymentMethod === 'auto' ? (
                <Button className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl py-6"
                  onClick={() => purchaseCardMutation.mutate()}
                  disabled={purchaseCardMutation.isPending}
                  data-testid="button-purchase-card-auto"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {purchaseCardMutation.isPending ? "Processing..." : `Pay via M-Pesa · $${currentCardPrice}`}
                </Button>
              ) : paymentMethod === 'manual' ? (
                <div className="space-y-3 text-left">
                  <div className="bg-muted p-4 rounded-xl space-y-2">
                    <p className="text-sm font-semibold mb-3">How to pay via Paybill</p>
                    {[
                      { step: 1, text: "Open M-Pesa on your phone and select Lipa na M-Pesa" },
                      { step: 2, text: "Select Pay Bill" },
                      { step: 3, text: `Enter Business No: ${(manualPaymentSettings as any)?.paybill || "—"}` },
                      { step: 4, text: `Enter Account No: ${(manualPaymentSettings as any)?.account || "440200259037"}` },
                      { step: 5, text: `Enter Amount: KES ${(kesAmountData as any)?.kesAmount || "..."}` },
                      { step: 6, text: "Enter your M-Pesa PIN and confirm" },
                    ].map(({ step, text }) => (
                      <div key={step} className="flex items-start gap-3 text-sm">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">{step}</span>
                        <span className="text-foreground">{text}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground text-center">After payment, contact support with your M-Pesa reference number.</p>
                </div>
              ) : (
                <div className="space-y-3 text-left">
                  <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 p-4 rounded-xl space-y-3">
                    <p className="text-sm font-semibold text-orange-800 dark:text-orange-200">Pay with Crypto</p>
                    <p className="text-xs text-orange-700 dark:text-orange-300">Purchase your virtual card using Bitcoin, Ethereum, or stablecoins. Your card will be activated after payment confirmation.</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { coin: "BTC", label: "Bitcoin", icon: "₿", eq: `${(parseFloat(currentCardPrice) / 65000).toFixed(6)} BTC` },
                        { coin: "ETH", label: "Ethereum", icon: "Ξ", eq: `${(parseFloat(currentCardPrice) / 3200).toFixed(5)} ETH` },
                        { coin: "USDT", label: "Tether", icon: "₮", eq: `${currentCardPrice} USDT` },
                        { coin: "USDC", label: "USD Coin", icon: "◎", eq: `${currentCardPrice} USDC` },
                      ].map(c => (
                        <div key={c.coin} className="bg-white dark:bg-orange-900/30 rounded-xl p-3 text-center border border-orange-200 dark:border-orange-700">
                          <p className="text-xl font-bold text-orange-600">{c.icon}</p>
                          <p className="text-xs font-semibold">{c.label}</p>
                          <p className="text-[10px] text-muted-foreground">{c.eq}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Button
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl py-6"
                    onClick={() => setLocation('/crypto')}
                    data-testid="button-goto-crypto"
                  >
                    <span className="mr-2">₿</span>
                    Go to Crypto Wallet · ${currentCardPrice}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">You'll be taken to your crypto wallet to complete the purchase.</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // ─── ACTIVE CARD SCREEN ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-6">
      <WavyHeader size="sm" />

      <div className="max-w-2xl mx-auto p-5 space-y-5">

        {/* ── CARD SLIDER ──────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>

          {/* Navigation header when multiple cards */}
          {allCards.length > 1 && (
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground font-medium">
                Card {selectedCardIdx + 1} of {allCards.length}
              </p>
              <div className="flex items-center gap-1">
                {allCards.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => { setSelectedCardIdx(i); setShowCardDetails(false); }}
                    className={`rounded-full transition-all ${i === selectedCardIdx ? 'bg-primary w-5 h-2' : 'bg-muted-foreground/30 w-2 h-2'}`}
                  />
                ))}
              </div>
              <div className="flex gap-1">
                <button onClick={() => { if (selectedCardIdx > 0) { setSelectedCardIdx(selectedCardIdx - 1); setShowCardDetails(false); } }}
                  disabled={selectedCardIdx === 0}
                  className="p-1.5 rounded-full bg-card border border-border disabled:opacity-30 hover:bg-muted transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => { if (selectedCardIdx < allCards.length - 1) { setSelectedCardIdx(selectedCardIdx + 1); setShowCardDetails(false); } }}
                  disabled={selectedCardIdx === allCards.length - 1}
                  className="p-1.5 rounded-full bg-card border border-border disabled:opacity-30 hover:bg-muted transition-colors"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Card visual */}
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedCardIdx}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <div className={`p-6 rounded-2xl text-white elevation-3 relative overflow-hidden ${
                isBlocked ? 'bg-gradient-to-br from-red-700 via-red-800 to-red-900' :
                isFrozen ? 'bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900' :
                isExpired ? 'bg-gradient-to-br from-gray-500 via-gray-600 to-gray-800' :
                'bg-gradient-to-br from-green-600 via-emerald-700 to-green-900'
              }`}>
                <div className="absolute top-0 right-0 w-56 h-56 bg-white/5 rounded-full -translate-y-16 translate-x-16 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full translate-y-12 -translate-x-8 pointer-events-none" />

                {/* Status badge */}
                <div className="absolute top-4 left-4">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${
                    !card ? 'bg-gray-500/80' :
                    isActive ? 'bg-green-400/30 text-green-100 border border-green-300/40' :
                    isFrozen ? 'bg-blue-300/30 text-blue-100 border border-blue-200/40' :
                    isBlocked ? 'bg-red-500/40 text-red-100 border border-red-400/40' :
                    'bg-gray-500/30 text-gray-100 border border-gray-400/40'
                  }`}>
                    {!card ? '...' :
                      isActive ? '● Active' :
                      isFrozen ? '❄ Frozen' :
                      isBlocked ? '⊘ Blocked' :
                      'Expired'}
                  </span>
                </div>

                <div className="relative z-10 mt-2">
                  <div className="flex items-center justify-between mb-6">
                    <div className="pt-4">
                      <p className="text-green-200 text-xs font-medium">Geepay Card</p>
                      <p className="text-white/40 text-[10px]">Virtual Visa</p>
                    </div>
                    <div className="flex gap-1.5">
                      <div className="w-8 h-5 rounded bg-white/25" />
                      <div className="w-5 h-5 rounded-full bg-white/40" />
                    </div>
                  </div>

                  <p className="text-xl font-mono tracking-widest mb-6 text-green-50" data-testid="text-card-number">
                    {card ? maskCardNumber(card.cardNumber || "4567123456784567") : "•••• •••• •••• ••••"}
                  </p>

                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-green-300 text-[10px] uppercase tracking-widest mb-0.5">Cardholder</p>
                      <p className="text-sm font-semibold">{user?.fullName?.toUpperCase() || "JOHN DOE"}</p>
                    </div>
                    <div>
                      <p className="text-green-300 text-[10px] uppercase tracking-widest mb-0.5">Expires</p>
                      <p className="text-sm font-semibold">{showCardDetails ? (card?.expiryDate || "12/27") : "••/••"}</p>
                    </div>
                    <div>
                      <p className="text-green-300 text-[10px] uppercase tracking-widest mb-0.5">CVV</p>
                      <p className="text-sm font-semibold">{showCardDetails ? (card?.cvv || "•••") : "•••"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Show/Hide + Copy row */}
          <div className="flex items-center justify-between mt-3 px-1">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowCardDetails(!showCardDetails)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border text-sm font-medium shadow-sm hover:bg-muted transition-colors"
              data-testid="button-toggle-card-details"
            >
              {showCardDetails
                ? <><EyeOff className="w-4 h-4 text-muted-foreground" /> Hide Details</>
                : <><Eye className="w-4 h-4 text-primary" /> Show Details</>
              }
            </motion.button>

            {card && showCardDetails && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => copyToClipboard(card.cardNumber, "number")}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border text-sm font-medium shadow-sm hover:bg-muted transition-colors"
                data-testid="button-copy-card-number"
              >
                {copied === "number" ? <><Check className="w-4 h-4 text-green-500" /> Copied!</> : <><Copy className="w-4 h-4 text-muted-foreground" /> Copy Number</>}
              </motion.button>
            )}
          </div>

          {/* CVV + Expiry copy row */}
          {card && showCardDetails && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 mt-2 px-1">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => copyToClipboard(card.cvv || "", "cvv")}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-card border border-border text-xs font-medium shadow-sm hover:bg-muted transition-colors"
                data-testid="button-copy-cvv"
              >
                {copied === "cvv" ? <><Check className="w-3 h-3 text-green-500" /> CVV Copied</> : <><Copy className="w-3 h-3 text-muted-foreground" /> Copy CVV</>}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => copyToClipboard(card.expiryDate || "", "expiry")}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-card border border-border text-xs font-medium shadow-sm hover:bg-muted transition-colors"
                data-testid="button-copy-expiry"
              >
                {copied === "expiry" ? <><Check className="w-3 h-3 text-green-500" /> Expiry Copied</> : <><Copy className="w-3 h-3 text-muted-foreground" /> Copy Expiry</>}
              </motion.button>
            </motion.div>
          )}
        </motion.div>

        {/* ── BALANCES ────────────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="grid grid-cols-2 gap-3"
        >
          <div className="bg-card rounded-2xl border border-border p-4 elevation-1">
            <p className="text-xs text-muted-foreground mb-1">Wallet Balance</p>
            <p className="text-2xl font-bold text-primary" data-testid="text-wallet-balance">${formatNumber(realTimeBalance)}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">USD</p>
          </div>
          <div className="bg-card rounded-2xl border border-border p-4 elevation-1">
            <p className="text-xs text-muted-foreground mb-1">Card Balance</p>
            <p className="text-2xl font-bold text-emerald-600" data-testid="text-card-balance">
              ${formatNumber(parseFloat(card?.balance || '0'))}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">USD</p>
          </div>
        </motion.div>

        {/* ── STATUS ALERTS ────────────────────────────────────────────────── */}
        {card && isBlocked && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-2xl p-5"
          >
            <div className="flex items-start gap-3 mb-4">
              <ShieldOff className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-700 dark:text-red-400">Card Blocked</h3>
                <p className="text-sm text-red-600 dark:text-red-300 mt-1">Your virtual card has been permanently blocked by the system.</p>
                {card.blockReason && (
                  <div className="mt-3 p-3 bg-red-100 dark:bg-red-900/40 rounded-xl">
                    <p className="text-[10px] font-semibold text-red-700 dark:text-red-300 uppercase tracking-widest mb-1">Block Reason</p>
                    <p className="text-sm font-medium text-red-800 dark:text-red-200">{card.blockReason}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button onClick={() => setForceRepurchase(true)} className="bg-green-600 hover:bg-green-700 text-white rounded-xl" data-testid="button-buy-new-card">
                <Sparkles className="w-4 h-4 mr-2" /> Buy New Card
              </Button>
              <Button variant="outline" onClick={() => setLocation('/support')} className="rounded-xl" data-testid="button-contact-support-blocked">
                <span className="material-icons text-sm mr-1">support_agent</span> Contact Support
              </Button>
            </div>
          </motion.div>
        )}

        {card && isFrozen && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-2xl p-5"
          >
            <div className="flex items-start gap-3 mb-4">
              <Snowflake className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-700 dark:text-blue-400">Card Frozen</h3>
                <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
                  {userFrozen ? "You have temporarily frozen this card." : "This card has been frozen by the system."}
                </p>
              </div>
            </div>
            {userFrozen && (
              <Button
                onClick={() => unfreezeMutation.mutate(card.id)}
                disabled={unfreezeMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
              >
                <Snowflake className="w-4 h-4 mr-2" />
                {unfreezeMutation.isPending ? "Unfreezing..." : "Unfreeze Card"}
              </Button>
            )}
          </motion.div>
        )}

        {card && isExpired && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="bg-muted border border-border rounded-2xl p-5"
          >
            <div className="flex items-start gap-3 mb-4">
              <span className="material-icons text-muted-foreground mt-0.5">schedule</span>
              <div>
                <h3 className="font-semibold">Card Expired</h3>
                <p className="text-sm text-muted-foreground mt-1">Your card has expired. Purchase a new card to continue transacting.</p>
              </div>
            </div>
            <Button onClick={() => setForceRepurchase(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl" data-testid="button-buy-new-card-expired">
              <Sparkles className="w-4 h-4 mr-2" /> Buy New Card
            </Button>
          </motion.div>
        )}

        {/* ── QUICK ACTIONS ─────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="grid grid-cols-4 gap-2"
        >
          {[
            {
              icon: "add",
              label: "Top Up",
              sublabel: "Add funds",
              color: "text-primary",
              disabled: !isActive,
              action: () => {
                if (!isActive) { toast({ title: "Card Unavailable", description: "Your card must be active to top up.", variant: "destructive" }); return; }
                setLocation("/deposit");
              },
            },
            {
              icon: "remove",
              label: "Withdraw",
              sublabel: "To bank",
              color: "text-secondary",
              disabled: !isActive,
              action: () => {
                if (!isActive) { toast({ title: "Card Unavailable", description: "Your card must be active to withdraw.", variant: "destructive" }); return; }
                setLocation("/withdraw");
              },
            },
            {
              icon: null,
              iconComponent: <ArrowRightLeft className="w-6 h-6 mb-1" />,
              label: "Transfer",
              sublabel: "Card ↔ Wallet",
              color: "text-teal-500",
              disabled: !isActive,
              action: () => {
                if (!isActive) { toast({ title: "Card Unavailable", description: "Your card must be active to transfer.", variant: "destructive" }); return; }
                setTransferOpen(!transferOpen);
              },
            },
            {
              icon: null,
              iconComponent: isFrozen
                ? <Snowflake className="w-6 h-6 mb-1 text-blue-400" />
                : <Snowflake className="w-6 h-6 mb-1" />,
              label: userFrozen ? "Unfreeze" : "Freeze",
              sublabel: userFrozen ? "Reactivate" : "Temp. disable",
              color: isFrozen ? "text-blue-400" : "text-orange-500",
              disabled: isBlocked || isExpired || (isFrozen && !userFrozen),
              action: () => {
                if (!card) return;
                if (isBlocked) { toast({ title: "Card Blocked", description: "Blocked cards cannot be frozen.", variant: "destructive" }); return; }
                if (isExpired) { toast({ title: "Card Expired", description: "Expired cards cannot be frozen.", variant: "destructive" }); return; }
                if (isFrozen && !userFrozen) { toast({ title: "Card Frozen", description: "This card was frozen by the system. Contact support to unfreeze.", variant: "destructive" }); return; }
                if (isFrozen && userFrozen) {
                  unfreezeMutation.mutate(card.id);
                } else {
                  freezeMutation.mutate(card.id);
                }
              },
            },
          ].map((item) => (
            <motion.button
              key={item.label}
              whileHover={!item.disabled ? { scale: 1.02 } : {}}
              whileTap={!item.disabled ? { scale: 0.97 } : {}}
              onClick={item.action}
              className={`bg-card p-3 rounded-2xl border border-border text-center transition-colors elevation-1 ${
                !item.disabled ? 'hover:bg-muted cursor-pointer' : 'opacity-50 cursor-not-allowed'
              }`}
              data-testid={`button-${item.label.toLowerCase().replace(' ', '-')}`}
            >
              {item.iconComponent
                ? <div className={`flex justify-center ${!item.disabled ? item.color : 'text-muted-foreground'}`}>{item.iconComponent}</div>
                : <span className={`material-icons text-2xl mb-1 block ${!item.disabled ? item.color : 'text-muted-foreground'}`}>{item.icon}</span>
              }
              <p className="font-semibold text-xs">{item.label}</p>
              <p className="text-[10px] text-muted-foreground leading-tight">{item.sublabel}</p>
            </motion.button>
          ))}
        </motion.div>

        {/* ── TRANSFER PANEL ────────────────────────────────────────────────── */}
        <AnimatePresence>
          {transferOpen && isActive && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-card rounded-2xl border border-border p-5 elevation-1 space-y-4">
                <div className="flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4 text-teal-500" />
                  <h3 className="font-semibold text-sm">Transfer Funds</h3>
                </div>

                {/* Direction toggle */}
                <div className="flex rounded-xl overflow-hidden border border-border">
                  <button
                    onClick={() => setTransferDirection('wallet_to_card')}
                    className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                      transferDirection === 'wallet_to_card' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    Wallet → Card
                  </button>
                  <button
                    onClick={() => setTransferDirection('card_to_wallet')}
                    className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                      transferDirection === 'card_to_wallet' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    Card → Wallet
                  </button>
                </div>

                {/* Balances hint */}
                <div className="flex justify-between text-xs text-muted-foreground px-1">
                  <span>Wallet: <span className="text-foreground font-medium">${formatNumber(realTimeBalance)}</span></span>
                  <span>Card: <span className="text-foreground font-medium">${formatNumber(parseFloat(card?.balance || '0'))}</span></span>
                </div>

                {/* Amount input */}
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    className="pl-7 rounded-xl"
                  />
                </div>

                <Button
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-xl"
                  disabled={!transferAmount || parseFloat(transferAmount) <= 0 || transferMutation.isPending}
                  onClick={() => {
                    if (!card || !transferAmount) return;
                    transferMutation.mutate({ cardId: card.id, direction: transferDirection, amount: transferAmount });
                  }}
                >
                  {transferMutation.isPending ? "Transferring..." : `Transfer $${transferAmount || '0.00'}`}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── CARD INFO ─────────────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-card rounded-2xl border border-border elevation-1 overflow-hidden"
        >
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-icons text-primary text-lg">info_outline</span>
              <h3 className="font-semibold text-sm">Card Information</h3>
            </div>
            {allCards.length > 1 && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {allCards.length} cards total
              </span>
            )}
          </div>
          <div className="p-4 space-y-3">
            {[
              {
                label: "Card Status",
                value: (
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    !card ? 'bg-muted text-muted-foreground' :
                    isActive ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400' :
                    isFrozen ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400' :
                    isBlocked ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {!card ? 'Loading...' : card.status.charAt(0).toUpperCase() + card.status.slice(1)}
                  </span>
                ),
              },
              { label: "Card Number", value: <span className="font-mono text-sm">{card ? maskCardNumber(card.cardNumber) : "—"}</span> },
              { label: "Expiry", value: <span className="font-medium text-sm">{card && showCardDetails ? card.expiryDate : "••/••"}</span> },
              { label: "Daily Limit", value: <span className="font-medium text-sm">$4,000</span> },
              { label: "Monthly Limit", value: <span className="font-medium text-sm">$50,000</span> },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{row.label}</span>
                {row.value}
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── BUY ANOTHER CARD ─────────────────────────────────────────────── */}
        {isActive && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <button
              onClick={() => setForceRepurchase(true)}
              className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors text-center py-2 flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Get an additional card
            </button>
          </motion.div>
        )}

      </div>
    </div>
  );
}
