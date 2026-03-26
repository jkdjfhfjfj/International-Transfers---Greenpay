
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Sparkles, Eye, EyeOff, Copy, Check, ShieldOff } from "lucide-react";
import { formatNumber } from "@/lib/formatters";
import { WavyHeader } from "@/components/wavy-header";

export default function VirtualCardPage() {
  const [, setLocation] = useLocation();
  const [showCardDetails, setShowCardDetails] = useState(false);
  const [copied, setCopied] = useState(false);
  const [forceRepurchase, setForceRepurchase] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'auto' | 'manual'>('auto');
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: cardData } = useQuery({
    queryKey: ["/api/virtual-card", user?.id],
    enabled: !!user?.id,
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

  const card = (cardData as any)?.card;
  const hasCard = (user?.hasVirtualCard || !!card) && !forceRepurchase;
  const currentCardPrice = (settingsData as any)?.price || "60.00";
  const originalPrice = "60.00";
  const realTimeBalance = parseFloat(user?.balance || '0');
  const isBlocked = card?.status === 'blocked';
  const isFrozen = card?.status === 'frozen';
  const isExpired = card?.status === 'expired';

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const purchaseCardMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/virtual-card/initialize-payment", {
        userId: user?.id,
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "STK Push Sent!",
          description: data.message || "Check your phone and enter your M-Pesa PIN to complete the payment.",
        });
        setTimeout(() => {
          setLocation(`/payment-processing?reference=${data.reference}&type=virtual-card`);
        }, 2000);
      } else {
        throw new Error(data.message || "Unable to initialize M-Pesa payment");
      }
    },
    onError: (error: any) => {
      toast({
        title: "Purchase Failed",
        description: error.message || "Unable to initiate card purchase. Please try again.",
        variant: "destructive",
      });
    },
  });

  const maskCardNumber = (number: string) => {
    if (showCardDetails) {
      return number.replace(/(.{4})/g, "$1 ").trim();
    }
    return `•••• •••• •••• ${number.slice(-4)}`;
  };

  // ─── PURCHASE SCREEN ────────────────────────────────────────────────────────
  if (!hasCard) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card shadow-sm p-4 flex items-center elevation-1"
        >
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => forceRepurchase ? setForceRepurchase(false) : setLocation("/dashboard")}
            className="material-icons text-muted-foreground mr-3 p-2 rounded-full hover:bg-muted transition-colors"
            data-testid="button-back"
          >
            arrow_back
          </motion.button>
          <h1 className="text-lg font-semibold">Virtual Card</h1>
        </motion.div>

        <div className="p-6 space-y-6">
          {/* Card Preview */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="bg-gradient-to-br from-green-600 via-emerald-700 to-green-900 p-6 rounded-2xl text-white elevation-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-56 h-56 bg-white/5 rounded-full -translate-y-16 translate-x-16" />
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full translate-y-12 -translate-x-8" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <p className="text-green-200 text-sm font-medium">GreenPay Card</p>
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
            </div>
          </motion.div>

          {/* Repurchase notice if coming from blocked card */}
          {forceRepurchase && card?.blockReason && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
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
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card p-6 rounded-xl border border-border elevation-1"
          >
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <span className="material-icons text-primary text-2xl">credit_card</span>
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-2">Get Your Virtual Card</h2>
                <p className="text-muted-foreground text-sm">
                  Purchase a virtual card to unlock international transactions and online payments.
                </p>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Virtual Card</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm line-through text-muted-foreground">${originalPrice}</span>
                    <span className="text-xl font-bold text-green-600">${currentCardPrice}</span>
                    <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold">75% OFF</div>
                  </div>
                </div>
              </div>

              {/* Payment method */}
              <div className="flex rounded-xl overflow-hidden border border-border">
                {['auto', 'manual'].map((m) => (
                  <button
                    key={m}
                    onClick={() => setPaymentMethod(m as 'auto' | 'manual')}
                    className={`flex-1 py-3 text-sm font-medium transition-colors ${
                      paymentMethod === m
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background text-muted-foreground hover:bg-muted'
                    }`}
                    data-testid={`button-payment-${m}`}
                  >
                    {m === 'auto' ? 'M-Pesa (Auto)' : 'Manual Payment'}
                  </button>
                ))}
              </div>

              {paymentMethod === 'auto' ? (
                <Button
                  className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl py-6"
                  onClick={() => purchaseCardMutation.mutate()}
                  disabled={purchaseCardMutation.isPending}
                  data-testid="button-purchase-card-auto"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {purchaseCardMutation.isPending ? "Processing..." : `Pay via M-Pesa · $${currentCardPrice}`}
                </Button>
              ) : (
                <div className="space-y-3 text-left">
                  <div className="bg-muted p-4 rounded-xl space-y-2">
                    <p className="text-sm font-medium">Manual Payment Details</p>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Paybill</span>
                      <span className="font-mono font-semibold">{(manualPaymentSettings as any)?.paybill || "Loading..."}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Account No.</span>
                      <span className="font-mono font-semibold">{user?.phone || "Your Phone"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Amount (KES)</span>
                      <span className="font-mono font-semibold">{(kesAmountData as any)?.kesAmount || "..."}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    After payment, contact support with your reference number.
                  </p>
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
    <div className="min-h-screen bg-background pb-20">
      <WavyHeader size="sm" />

      <div className="p-5 space-y-5">
        {/* ── CARD VISUAL ──────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 30, rotateY: -8 }}
          animate={{ opacity: 1, y: 0, rotateY: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <div className="bg-gradient-to-br from-green-600 via-emerald-700 to-green-900 p-6 rounded-2xl text-white elevation-3 relative overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-56 h-56 bg-white/5 rounded-full -translate-y-16 translate-x-16 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full translate-y-12 -translate-x-8 pointer-events-none" />

            {/* Status badge */}
            <div className="absolute top-4 left-4">
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${
                !card ? 'bg-gray-500/80' :
                card.status === 'active' ? 'bg-green-400/30 text-green-100 border border-green-300/40' :
                card.status === 'frozen' ? 'bg-orange-400/30 text-orange-100 border border-orange-300/40' :
                card.status === 'blocked' ? 'bg-red-500/40 text-red-100 border border-red-400/40' :
                'bg-gray-500/30 text-gray-100 border border-gray-400/40'
              }`}>
                {!card ? '...' : card.status === 'active' ? '● Active' : card.status === 'frozen' ? '⏸ Frozen' : card.status === 'blocked' ? '⊘ Blocked' : 'Expired'}
              </span>
            </div>

            <div className="relative z-10 mt-2">
              <div className="flex items-center justify-between mb-6">
                <div className="pt-4">
                  <p className="text-green-200 text-xs font-medium">GreenPay Card</p>
                  <p className="text-white/40 text-[10px]">Virtual Visa</p>
                </div>
                <div className="flex gap-1.5">
                  <div className="w-8 h-5 rounded bg-white/25" />
                  <div className="w-5 h-5 rounded-full bg-white/40" />
                </div>
              </div>

              {/* Card Number */}
              <p className="text-xl font-mono tracking-widest mb-6 text-green-50" data-testid="text-card-number">
                {card ? maskCardNumber(card.cardNumber || "4567123456784567") : "•••• •••• •••• ••••"}
              </p>

              {/* Bottom row */}
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

          {/* See/Hide + Copy — OUTSIDE the card */}
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
                onClick={() => copyToClipboard(card.cardNumber)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border text-sm font-medium shadow-sm hover:bg-muted transition-colors"
                data-testid="button-copy-card-number"
              >
                {copied
                  ? <><Check className="w-4 h-4 text-green-500" /> Copied!</>
                  : <><Copy className="w-4 h-4 text-muted-foreground" /> Copy Number</>
                }
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* ── BALANCE ────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-2xl border border-border p-5 elevation-1"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Available Balance</p>
              <p className="text-3xl font-bold text-primary" data-testid="text-card-balance">
                ${formatNumber(realTimeBalance)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="material-icons text-primary">account_balance_wallet</span>
            </div>
          </div>
        </motion.div>

        {/* ── BLOCKED CARD ALERT ──────────────────────────────────────────── */}
        {card && isBlocked && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-2xl p-5"
          >
            <div className="flex items-start gap-3 mb-4">
              <ShieldOff className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-700 dark:text-red-400">Card Blocked</h3>
                <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                  Your virtual card has been permanently blocked by an administrator.
                </p>
                {card.blockReason && (
                  <div className="mt-3 p-3 bg-red-100 dark:bg-red-900/40 rounded-xl">
                    <p className="text-[10px] font-semibold text-red-700 dark:text-red-300 uppercase tracking-widest mb-1">Block Reason</p>
                    <p className="text-sm font-medium text-red-800 dark:text-red-200">{card.blockReason}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={() => setForceRepurchase(true)}
                className="bg-green-600 hover:bg-green-700 text-white rounded-xl"
                data-testid="button-buy-new-card"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Buy New Card
              </Button>
              <Button
                variant="outline"
                onClick={() => setLocation('/support')}
                className="rounded-xl"
                data-testid="button-contact-support-blocked"
              >
                <span className="material-icons text-sm mr-1">support_agent</span>
                Contact Support
              </Button>
            </div>
          </motion.div>
        )}

        {/* ── FROZEN CARD ALERT ───────────────────────────────────────────── */}
        {card && isFrozen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-2xl p-5"
          >
            <div className="flex items-start gap-3 mb-4">
              <span className="material-icons text-orange-500 mt-0.5">pause_circle_filled</span>
              <div>
                <h3 className="font-semibold text-orange-700 dark:text-orange-400">Card Frozen</h3>
                <p className="text-sm text-orange-600 dark:text-orange-300 mt-1">
                  Your card has been temporarily frozen by an administrator.
                </p>
                {card.freezeReason && (
                  <div className="mt-3 p-3 bg-orange-100 dark:bg-orange-900/40 rounded-xl">
                    <p className="text-[10px] font-semibold text-orange-700 dark:text-orange-300 uppercase tracking-widest mb-1">Reason</p>
                    <p className="text-sm font-medium text-orange-800 dark:text-orange-200">{card.freezeReason}</p>
                  </div>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation('/support')}
              className="rounded-xl border-orange-300 text-orange-600 hover:bg-orange-50"
            >
              <span className="material-icons text-sm mr-1">support_agent</span>
              Contact Support
            </Button>
          </motion.div>
        )}

        {/* ── EXPIRED CARD ALERT ──────────────────────────────────────────── */}
        {card && isExpired && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-muted border border-border rounded-2xl p-5"
          >
            <div className="flex items-start gap-3 mb-4">
              <span className="material-icons text-muted-foreground mt-0.5">schedule</span>
              <div>
                <h3 className="font-semibold">Card Expired</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Your card has expired. Purchase a new card to continue transacting.
                </p>
              </div>
            </div>
            <Button
              onClick={() => setForceRepurchase(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl"
              data-testid="button-buy-new-card-expired"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Buy New Card
            </Button>
          </motion.div>
        )}

        {/* ── QUICK ACTIONS (only when card is active) ─────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-3 gap-3"
        >
          {[
            {
              icon: "add",
              label: "Top Up",
              sublabel: "Add funds",
              color: "text-primary",
              action: () => {
                if (!card || card.status !== 'active') {
                  toast({ title: "Card Unavailable", description: "Your card must be active to top up.", variant: "destructive" });
                  return;
                }
                setLocation("/deposit");
              },
            },
            {
              icon: "remove",
              label: "Withdraw",
              sublabel: "To bank",
              color: "text-secondary",
              action: () => {
                if (!card || card.status !== 'active') {
                  toast({ title: "Card Unavailable", description: "Your card must be active to withdraw.", variant: "destructive" });
                  return;
                }
                setLocation("/withdraw");
              },
            },
            {
              icon: "lock",
              label: "Freeze",
              sublabel: "Temp. disable",
              color: "text-orange-500",
              action: () => {
                if (!card) return;
                if (card.status !== 'active') {
                  toast({ title: "Cannot Freeze", description: "Card is not active.", variant: "destructive" });
                  return;
                }
                toast({ title: "Contact Support", description: "Please contact support to freeze your card." });
              },
            },
          ].map((item) => (
            <motion.button
              key={item.label}
              whileHover={card?.status === 'active' ? { scale: 1.02 } : {}}
              whileTap={card?.status === 'active' ? { scale: 0.97 } : {}}
              onClick={item.action}
              className={`bg-card p-4 rounded-2xl border border-border text-center transition-colors elevation-1 ${
                card?.status === 'active' ? 'hover:bg-muted cursor-pointer' : 'opacity-50 cursor-not-allowed'
              }`}
              data-testid={`button-${item.label.toLowerCase().replace(' ', '-')}`}
            >
              <span className={`material-icons text-2xl mb-1 block ${card?.status === 'active' ? item.color : 'text-muted-foreground'}`}>
                {item.icon}
              </span>
              <p className="font-semibold text-sm">{item.label}</p>
              <p className="text-[10px] text-muted-foreground">{item.sublabel}</p>
            </motion.button>
          ))}
        </motion.div>

        {/* ── CARD INFO ─────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card rounded-2xl border border-border elevation-1 overflow-hidden"
        >
          <div className="p-4 border-b border-border flex items-center gap-2">
            <span className="material-icons text-primary text-lg">info_outline</span>
            <h3 className="font-semibold text-sm">Card Information</h3>
          </div>
          <div className="p-4 space-y-3">
            {[
              {
                label: "Card Status",
                value: (
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    !card ? 'bg-muted text-muted-foreground' :
                    card.status === 'active' ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400' :
                    card.status === 'frozen' ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400' :
                    card.status === 'blocked' ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400' :
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
      </div>
    </div>
  );
}
