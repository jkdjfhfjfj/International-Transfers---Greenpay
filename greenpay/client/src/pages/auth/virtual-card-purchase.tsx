import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useInitializeCardPayment, useVerifyCardPayment } from "@/hooks/use-paystack";
import { apiRequest } from "@/lib/queryClient";
import { WavyHeader } from "@/components/wavy-header";
import { ArrowRight, Bitcoin, Building2, Check, CheckCircle2, CircleDollarSign, Clock, Copy, CreditCard, Info, Loader2, Smartphone, XCircle } from "lucide-react";
import mastercardLogo from "@assets/images_(8)_1766711928429.png";
import visaLogo from "@assets/images_(7)_1766711307308.png";

type CardPaymentMethod = "mobile_money" | "card" | "crypto" | "manual" | "bank_transfer";

type CardPaymentOptions = {
  isKenya: boolean;
  countryPaymentCurrency: string | null;
  mobileMoney: boolean;
  card: boolean;
  bankTransfer: boolean;
  bankTransferConfigured: boolean;
  bankTransferDetails: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    swiftCode: string;
    branch: string;
    currency: string;
    routingNumber: string;
    additionalInfo: string;
  } | null;
  usdToBankCurrencyRate: number | null;
};

type CardPaymentOption = {
  id: CardPaymentMethod;
  title: string;
  detail: string;
  icon: typeof Smartphone;
  testId: string;
  disabled?: boolean;
};

function formatCurrencyAmount(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function getCurrencyFractionDigits(currency: string): number {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency })
      .resolvedOptions()
      .maximumFractionDigits;
  } catch {
    return 2;
  }
}

export default function VirtualCardPurchasePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, login } = useAuth();

  const [paymentReference, setPaymentReference] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<CardPaymentMethod>("mobile_money");
  const [cryptoCoin, setCryptoCoin] = useState("USDT");
  const [paymentResult, setPaymentResult] = useState<"verifying" | "success" | "failed" | null>(null);
  const [paymentFeedbackMessage, setPaymentFeedbackMessage] = useState("");
  const [checkoutStarted, setCheckoutStarted] = useState(false);
  const [cryptoPaymentDetails, setCryptoPaymentDetails] = useState<{
    amount: string;
    coin: string;
    transactionId: string;
    network: string;
  } | null>(null);
  const verificationStarted = useRef(false);
  const initializePayment = useInitializeCardPayment();
  const verifyPayment = useVerifyCardPayment();

  const {
    data: paymentOptions,
    isLoading: paymentOptionsLoading,
    isError: paymentOptionsError,
    refetch: refetchPaymentOptions,
  } = useQuery<CardPaymentOptions>({
    queryKey: ["/api/virtual-card/payment-options", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/virtual-card/payment-options");
      return response.json();
    },
  });

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
    enabled: !!user?.id,
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
      setCryptoPaymentDetails({
        amount: String(data.cryptoAmount || ""),
        coin: String(data.coin || cryptoCoin),
        transactionId: String(data.cryptoTransaction?.id || ""),
        network: String(data.cryptoTransaction?.network || ""),
      });
      toast({
        title: "Crypto payment awaiting confirmation",
        description: data.message,
      });
    },
    onError: (error: any) => {
      setCryptoPaymentDetails(null);
      toast({ title: "Crypto payment failed", description: error.message, variant: "destructive" });
    },
  });

  const currentCardPrice = String((settingsData as any)?.price || "60.00");
  const currentCardPriceNumber = Number(currentCardPrice);
  const originalPrice = "60.00";
  const hasDiscount = currentCardPriceNumber < parseFloat(originalPrice);
  const discountEnabled = (discountData as any)?.enabled !== false;
  const discountPct = hasDiscount
    ? Math.round((1 - currentCardPriceNumber / parseFloat(originalPrice)) * 100)
    : 0;
  const showDiscount = discountEnabled && hasDiscount;
  const manualPaymentEnabled = Boolean((manualPaymentData as any)?.enabled);
  const cryptoPrices = (cryptoPricesData as any)?.prices || {};
  const cryptoRate = Number(cryptoPrices[cryptoCoin] || 0);
  const cryptoCardAmount = cryptoRate > 0 ? currentCardPriceNumber / cryptoRate : 0;
  const paymentMethodOptions: CardPaymentOption[] = paymentOptions
    ? paymentOptions.isKenya
      ? [
          ...(paymentOptions.mobileMoney ? [{
            id: "mobile_money" as const,
            title: "Mobile money",
            detail: "Get a payment prompt on your registered phone.",
            icon: Smartphone,
            testId: "option-mobile-money",
          }] : []),
          ...(paymentOptions.card ? [{
            id: "card" as const,
            title: "Debit or credit card",
            detail: "Pay through secure card checkout.",
            icon: CreditCard,
            testId: "option-card-payment",
          }] : []),
          ...(manualPaymentEnabled ? [{
            id: "manual" as const,
            title: "Paybill / Till",
            detail: "Pay by Paybill, then share the transaction code for review.",
            icon: CircleDollarSign,
            testId: "option-manual-payment",
          }] : []),
          {
            id: "crypto",
            title: "Cryptocurrency",
            detail: "Pay the live quoted amount in BTC, ETH, USDT, or USDC.",
            icon: Bitcoin,
            testId: "option-crypto-payment",
          },
        ]
      : [
          {
            id: "bank_transfer",
            title: "Bank transfer",
            detail: paymentOptions.bankTransfer
              ? `Send to the configured ${paymentOptions.bankTransferDetails?.currency || "USD"} bank account.`
              : paymentOptions.bankTransferConfigured
                ? "Not available for this account's country."
                : "Not configured yet. Contact support for help.",
            icon: Building2,
            testId: "option-bank-transfer",
            disabled: !paymentOptions.bankTransfer,
          },
          {
            id: "crypto",
            title: "Cryptocurrency",
            detail: "Pay the live quoted amount in BTC, ETH, USDT, or USDC.",
            icon: Bitcoin,
            testId: "option-crypto-payment",
          },
        ]
    : [
        {
          id: "crypto",
          title: "Cryptocurrency",
          detail: "Pay the live quoted amount in BTC, ETH, USDT, or USDC.",
          icon: Bitcoin,
          testId: "option-crypto-payment",
        },
      ];
  const bankTransferDetails = paymentOptions?.bankTransferDetails ?? null;
  const bankTransferCurrency = bankTransferDetails?.currency || "USD";
  const bankTransferRate = Number(paymentOptions?.usdToBankCurrencyRate || 0);
  const bankTransferAmount = bankTransferRate > 0 && Number.isFinite(currentCardPriceNumber)
    ? Number((currentCardPriceNumber * bankTransferRate).toFixed(getCurrencyFractionDigits(bankTransferCurrency)))
    : null;
  const transferReference = String((user as any)?.accountNumber || "").trim();
  const bankDetailRows = bankTransferDetails
    ? [
        { label: "Bank", value: bankTransferDetails.bankName },
        { label: "Account name", value: bankTransferDetails.accountName },
        { label: "Account number", value: bankTransferDetails.accountNumber },
        { label: "SWIFT / BIC", value: bankTransferDetails.swiftCode },
        { label: "Branch", value: bankTransferDetails.branch },
        { label: "Routing number", value: bankTransferDetails.routingNumber },
      ].filter((row) => Boolean(row.value))
    : [];
  const { data: kesCardQuote, isLoading: kesQuoteLoading, isError: kesQuoteError } = useQuery<{
    usdAmount: number;
    kesAmount: number;
    exchangeRate: number;
  }>({
    queryKey: ["/api/convert-to-kes", currentCardPrice],
    queryFn: async () => {
      const response = await apiRequest("POST", "/api/convert-to-kes", { usdAmount: currentCardPrice });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Card price conversion is unavailable");
      return data;
    },
    enabled: paymentOptions?.isKenya === true && Number.isFinite(currentCardPriceNumber) && currentCardPriceNumber > 0,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!paymentOptions) {
      if (paymentOptionsError && paymentMethod !== "crypto") setPaymentMethod("crypto");
      return;
    }
    const availableMethods: CardPaymentMethod[] = paymentOptions.isKenya
      ? [
          ...(paymentOptions.mobileMoney ? ["mobile_money" as const] : []),
          ...(paymentOptions.card ? ["card" as const] : []),
          ...(manualPaymentEnabled ? ["manual" as const] : []),
          "crypto",
        ]
      : [
          ...(paymentOptions.bankTransfer ? ["bank_transfer" as const] : []),
          "crypto",
        ];
    if (!availableMethods.includes(paymentMethod)) {
      setPaymentMethod(availableMethods[0] || "crypto");
    }
  }, [paymentMethod, paymentOptions, manualPaymentEnabled, paymentOptionsError]);

  useEffect(() => {
    if (verificationStarted.current) return;
    const urlParams = new URLSearchParams(window.location.search);
    const reference = urlParams.get("reference");
    const status = urlParams.get("status")?.toLowerCase();
    const error = urlParams.get("error");

    if (reference && status === "success") {
      verificationStarted.current = true;
      setPaymentReference(reference);
      setPaymentResult("verifying");
      setPaymentFeedbackMessage("Confirming your payment with the provider before activating the card.");
      verifyPayment.mutate(reference, {
        onSuccess: data => {
          if (data.success && data.card) {
            setPaymentResult("success");
            setPaymentFeedbackMessage("Payment verified. Your virtual card is active.");
            window.setTimeout(() => setLocation("/dashboard"), 1800);
          } else {
            setPaymentResult("failed");
            setPaymentFeedbackMessage(data.message || "Payment is not confirmed yet. Your card has not been activated.");
          }
        },
        onError: (verificationError: any) => {
          setPaymentResult("failed");
          setPaymentFeedbackMessage(verificationError.message || "We could not verify this payment. Your card has not been activated.");
        },
      });
    } else if (status === "failed" || status === "cancelled" || error) {
      verificationStarted.current = true;
      setPaymentReference(reference);
      setPaymentResult("failed");
      setPaymentFeedbackMessage("No payment was confirmed. If you completed the payment, contact support before trying again.");
    }
  }, [setLocation, verifyPayment]);

  const handlePurchase = () => {
    setCheckoutStarted(true);
    setPaymentResult(null);
    setPaymentFeedbackMessage("");
    initializePayment.mutate(paymentMethod === "card" ? "card" : "mobile_money", {
      onSuccess: (data) => {
        const redirectUrl = data.redirectUrl || data.authorization_url;
        if (redirectUrl) {
          window.location.href = redirectUrl;
        } else if (data.reference) {
          setPaymentReference(data.reference);
          setLocation(`/payment-processing?reference=${encodeURIComponent(data.reference)}&type=virtual-card`);
        } else {
          setCheckoutStarted(false);
          setPaymentResult("failed");
          setPaymentFeedbackMessage("The payment provider did not return a checkout link. Please try again.");
        }
      },
      onError: (error: any) => {
        setCheckoutStarted(false);
        setPaymentResult("failed");
        setPaymentFeedbackMessage(error.message || "Unable to start secure checkout. Please try again.");
      }
    });
  };

  const copyBankDetail = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast({ title: "Copied", description: `${label} copied to clipboard.` });
    } catch {
      toast({
        title: "Copy unavailable",
        description: "Select and copy the bank detail manually.",
        variant: "destructive",
      });
    }
  };

  const retryAfterPaymentFeedback = () => {
    window.history.replaceState({}, "", window.location.pathname);
    verificationStarted.current = false;
    setPaymentReference(null);
    setPaymentResult(null);
    setPaymentFeedbackMessage("");
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
              <span className="font-medium">One-time card price</span>
              <div className="flex items-center justify-end gap-2 flex-wrap">
                {showDiscount && (
                  <span className="text-sm line-through text-muted-foreground">USD {originalPrice}</span>
                )}
                <span className="text-xl font-bold text-primary">USD {currentCardPriceNumber.toFixed(2)}</span>
                <span className="rounded-full bg-primary/10 px-3 py-1.5 text-[10px] font-bold text-primary">
                  FIXED PRICE
                </span>
                {showDiscount && (
                  <div className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                    {discountPct}% OFF
                  </div>
                )}
              </div>
            </div>
            {showDiscount && (
              <p className="mb-3 text-xs text-muted-foreground">
                The current card price applies to all payment methods available for your country.
              </p>
            )}
            {paymentOptions?.isKenya && (
              <div className="mb-4 rounded-xl border border-primary/15 bg-primary/[0.04] p-3 space-y-2 text-left">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="text-muted-foreground">KES equivalent</span>
                <span className="font-semibold text-foreground">
                  {kesQuoteLoading
                    ? "Getting live rate…"
                    : kesQuoteError || !kesCardQuote
                      ? "Temporarily unavailable"
                      : `KES ${Number(kesCardQuote.kesAmount).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                </span>
              </div>
              {kesCardQuote && (
                <p className="text-[11px] text-muted-foreground">
                  Live rate: 1 USD = KES {Number(kesCardQuote.exchangeRate).toLocaleString(undefined, { maximumFractionDigits: 4 })}. The final amount is confirmed at checkout.
                </p>
              )}
              <div className="flex items-center justify-between gap-3 border-t border-primary/10 pt-2 text-xs">
                <span className="text-muted-foreground">GreenPay purchase fee</span>
                <span className="font-semibold text-foreground">USD 0.00</span>
              </div>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Fixed one-time price. Minimum and maximum purchase amount are both USD {currentCardPriceNumber.toFixed(2)}; provider or mobile-network charges, if any, are shown before you confirm.
              </p>
              </div>
            )}
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

          {(checkoutStarted || paymentResult) && (
            <div
              className={`mb-5 rounded-2xl border p-4 text-left ${
                paymentResult === "success"
                  ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30"
                  : paymentResult === "failed"
                    ? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30"
                    : "border-primary/20 bg-primary/[0.04]"
              }`}
              role={paymentResult === "failed" ? "alert" : "status"}
              data-testid="card-purchase-payment-feedback"
            >
              <div className="flex items-start gap-3">
                {paymentResult === "success"
                  ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                  : paymentResult === "failed"
                    ? <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                    : <Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-primary" />}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">
                    {paymentResult === "success"
                      ? "Payment confirmed"
                      : paymentResult === "failed"
                        ? "Payment not confirmed"
                        : paymentResult === "verifying"
                          ? "Verifying payment"
                          : "Starting secure checkout"}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {paymentFeedbackMessage || (checkoutStarted
                      ? "Preparing your payment session. Do not close this page."
                      : "Checking your payment status. Your card is activated only after provider confirmation.")}
                  </p>
                  {paymentReference && (
                    <p className="mt-2 break-all font-mono text-[11px] text-muted-foreground">
                      Reference: {paymentReference}
                    </p>
                  )}
                  {paymentResult === "failed" && (
                    <Button className="mt-3 h-9" variant="outline" onClick={retryAfterPaymentFeedback}>
                      Try another payment
                    </Button>
                  )}
                  {paymentResult === "success" && (
                    <Button className="mt-3 h-9" onClick={() => setLocation("/dashboard")}>
                      Go to dashboard
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Partner Section */}
          {paymentOptions?.isKenya && paymentOptions.card && (
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
          )}

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="space-y-4"
          >
            {/* Payment Method Selection */}
            <div className="space-y-3">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-sm">Choose how to pay</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {paymentOptions?.isKenya
                      ? "Payment options available for your KES account."
                      : paymentOptions
                        ? `International checkout · ${paymentOptions.countryPaymentCurrency || "currency unavailable"}`
                        : paymentOptionsError
                          ? "Crypto is available while we retry your account options."
                          : "Checking payment options for your account."}
                  </p>
                </div>
                {paymentOptions && (
                  <span className="shrink-0 rounded-full border border-border px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">
                    {paymentOptions.isKenya ? "KES" : paymentOptions.countryPaymentCurrency || "USD"}
                  </span>
                )}
              </div>

              {paymentOptionsLoading ? (
                <div className="flex items-center gap-2 rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground" role="status">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  Checking payment methods…
                </div>
              ) : (
                <>
                  {paymentOptionsError && (
                    <div className="flex items-start justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200" role="alert">
                      <span>We could not confirm your account currency. Cryptocurrency is available; retry to load the other eligible methods.</span>
                      <Button variant="outline" size="sm" className="h-8 shrink-0" onClick={() => void refetchPaymentOptions()}>
                        Retry
                      </Button>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3" data-testid="card-payment-method-options">
                    {paymentMethodOptions.map((option) => {
                      const OptionIcon = option.icon;
                      const isSelected = paymentMethod === option.id;
                      const eyebrow = option.id === "bank_transfer"
                        ? "BANK TRANSFER"
                        : option.id === "crypto"
                          ? "CRYPTO"
                          : option.id === "mobile_money"
                            ? "MOBILE MONEY"
                            : option.id === "manual"
                              ? "MANUAL"
                              : "CARD";
                      return (
                        <button
                          key={option.id}
                          type="button"
                          aria-pressed={isSelected}
                          aria-disabled={option.disabled}
                          disabled={option.disabled}
                          onClick={() => setPaymentMethod(option.id)}
                          className={`relative min-h-[132px] rounded-2xl border p-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
                            isSelected
                              ? "border-primary bg-primary/[0.055] shadow-sm"
                              : "border-border bg-card hover:border-primary/40"
                          }`}
                          data-testid={option.testId}
                        >
                          <span className="flex items-center justify-between gap-2">
                            <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                              isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                            }`}>
                              <OptionIcon className="h-5 w-5" />
                            </span>
                            <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                              isSelected ? "border-primary bg-primary text-white" : "border-border bg-background"
                            }`}>
                              {isSelected && <Check className="h-3 w-3" />}
                            </span>
                          </span>
                          <span className="mt-3 block text-[9px] font-bold tracking-[0.12em] text-primary">{eyebrow}</span>
                          <span className="mt-1 block text-sm font-semibold text-foreground">{option.title}</span>
                          <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{option.detail}</span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Auto Payment Details & Button */}
            {((paymentMethod === 'mobile_money' && paymentOptions?.mobileMoney) ||
              (paymentMethod === 'card' && paymentOptions?.card)) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <Button
                  onClick={handlePurchase}
                  className="w-full ripple"
                  disabled={
                    initializePayment.isPending ||
                    checkoutStarted ||
                    (paymentMethod === "mobile_money" && !paymentOptions?.mobileMoney) ||
                    (paymentMethod === "card" && !paymentOptions?.card)
                  }
                  data-testid="button-purchase-card"
                >
                  {initializePayment.isPending || checkoutStarted
                    ? "Preparing secure checkout…"
                    : paymentMethod === "card"
                      ? `Pay by card · $${currentCardPriceNumber.toFixed(2)}`
                      : `Pay by mobile money · $${currentCardPriceNumber.toFixed(2)}`}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  {paymentMethod === "card"
                    ? "Secure checkout opens next. Your card activates only after the provider confirms payment."
                    : "Approve the mobile-money prompt. Your card activates only after payment is confirmed."}
                </p>
              </motion.div>
            )}

            {paymentMethod === "bank_transfer" && paymentOptions?.bankTransfer && bankTransferDetails && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3 rounded-2xl border border-border bg-card p-4 text-left shadow-sm"
                data-testid="panel-bank-transfer"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-semibold">Bank transfer details</h4>
                    <p className="mt-1 text-xs text-muted-foreground">Transfer the fixed card price to the account below.</p>
                  </div>
                  <Building2 className="h-5 w-5 shrink-0 text-primary" />
                </div>

                <div className="rounded-xl border border-primary/15 bg-primary/[0.04] p-3">
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="text-muted-foreground">Amount to transfer</span>
                    <span className="font-bold text-primary" data-testid="text-bank-transfer-amount">
                      {bankTransferAmount === null
                        ? `Confirm ${bankTransferCurrency} amount with support`
                        : formatCurrencyAmount(bankTransferAmount, bankTransferCurrency)}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                    Card price: USD {currentCardPriceNumber.toFixed(2)}. Bank or intermediary fees may be charged separately.
                  </p>
                </div>

                <div className="space-y-2">
                  {bankDetailRows.map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between gap-3 rounded-xl bg-muted/50 px-3 py-2.5">
                      <span className="shrink-0 text-xs text-muted-foreground">{label}</span>
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="break-all text-right font-mono text-xs font-semibold" data-testid={`text-bank-detail-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>
                          {value}
                        </span>
                        <button
                          type="button"
                          onClick={() => void copyBankDetail(value, label)}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                          aria-label={`Copy ${label}`}
                          data-testid={`button-copy-bank-detail-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </span>
                    </div>
                  ))}
                </div>

                {bankTransferDetails.additionalInfo && (
                  <p className="rounded-xl bg-muted/50 p-3 text-xs leading-relaxed text-muted-foreground">
                    {bankTransferDetails.additionalInfo}
                  </p>
                )}

                <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
                  <div className="flex items-start gap-2">
                    <Info className="mt-0.5 h-4 w-4 shrink-0" />
                    <p className="text-xs leading-relaxed">
                      {bankTransferAmount === null
                        ? `Do not send yet. Contact support to confirm the exact ${bankTransferCurrency} amount.`
                        : transferReference
                          ? `Use your GreenPay account number ${transferReference} as the transfer reference. Your card stays inactive until support verifies the transfer.`
                          : "Contact support for a transfer reference before sending. Your card stays inactive until support verifies the transfer."}
                    </p>
                  </div>
                </div>

                <Button className="w-full" onClick={() => setLocation("/live-chat")} data-testid="button-bank-transfer-support">
                  Contact support
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </motion.div>
            )}

            {paymentMethod === "manual" && manualPaymentEnabled && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-muted/50 p-4 rounded-xl border border-border text-left space-y-3"
                data-testid="panel-manual-payment"
              >
                <div className="rounded-xl border border-primary/15 bg-background p-3">
                  <h4 className="font-semibold">Paybill / Till instructions</h4>
                  <p className="mt-1 text-xs text-muted-foreground">Fixed card price: USD {currentCardPriceNumber.toFixed(2)}</p>
                  <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                    <span className="text-muted-foreground">Pay this amount</span>
                    <span className="font-bold text-primary" data-testid="text-card-price-kes">
                      {kesQuoteLoading
                        ? "Loading live quote…"
                        : kesCardQuote
                          ? `KES ${Number(kesCardQuote.kesAmount).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                          : "KES quote unavailable"}
                    </span>
                  </div>
                  {kesCardQuote && (
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Rate: 1 USD = KES {Number(kesCardQuote.exchangeRate).toLocaleString(undefined, { maximumFractionDigits: 4 })}. The KES amount is rounded to match checkout.
                    </p>
                  )}
                </div>
                <div className="flex justify-between gap-3 rounded-lg bg-background p-3">
                  <span className="text-sm text-muted-foreground">Paybill (Business no.)</span>
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
                <ol className="list-decimal list-inside space-y-2 rounded-xl bg-background p-3 text-xs leading-relaxed text-muted-foreground">
                  <li>Open M-PESA and choose <span className="font-semibold text-foreground">Lipa na M-PESA → Pay Bill</span>.</li>
                  <li>Enter the Paybill and the account number shown above.</li>
                  <li>Enter the exact KES amount shown, review any M-PESA fee, then complete with your PIN.</li>
                  <li>Keep the M-PESA transaction code and contact support so the payment can be verified.</li>
                </ol>
                <div className="flex items-center justify-between gap-3 rounded-lg bg-background p-3 text-xs">
                  <span className="text-muted-foreground">GreenPay fee</span>
                  <span className="font-semibold">KES 0.00</span>
                </div>
                <p className="text-xs text-muted-foreground" data-testid="text-manual-payment-next-step">
                  This is a fixed-price purchase: minimum and maximum are USD {currentCardPriceNumber.toFixed(2)} (the KES equivalent above). Keep your payment confirmation. The card is activated only after support verifies payment.
                </p>
                {(!kesCardQuote || kesQuoteError) && (
                  <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs leading-relaxed text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300" role="alert">
                    Do not pay until the live KES quote is available. Contact support for help with the current amount.
                  </p>
                )}
                <Button variant="outline" className="w-full" onClick={() => setLocation("/live-chat")}>
                  Contact support with your payment details
                </Button>
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
                  <span className="text-muted-foreground">Estimated amount</span>
                  <span className="font-bold text-primary">{cryptoCardAmount > 0 ? `${cryptoCardAmount.toFixed(8)} ${cryptoCoin}` : "—"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">GreenPay fee</span>
                  <span className="font-semibold">{cryptoCoin} 0</span>
                </div>
                <Button
                  onClick={() => cryptoCardPurchase.mutate()}
                  className="w-full bg-primary hover:bg-primary/90"
                  disabled={!cryptoRate || cryptoCardPurchase.isPending}
                >
                  {cryptoCardPurchase.isPending ? "Preparing..." : `Start ${cryptoCoin} payment`}
                </Button>
                {cryptoPaymentDetails && (
                  <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-left dark:border-amber-800 dark:bg-amber-950/30" role="status" data-testid="crypto-card-payment-pending">
                    <div className="flex items-start gap-2">
                      <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300" />
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">Payment request created</p>
                        <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-300">
                          The confirmed amount is {cryptoPaymentDetails.amount} {cryptoPaymentDetails.coin}{cryptoPaymentDetails.network ? ` on ${cryptoPaymentDetails.network}` : ""}. Contact support for the payment address before sending. Your card stays inactive until the required confirmations are verified.
                        </p>
                        {cryptoPaymentDetails.transactionId && (
                          <p className="break-all font-mono text-[11px] text-amber-800 dark:text-amber-300">Request ID: {cryptoPaymentDetails.transactionId}</p>
                        )}
                      </div>
                    </div>
                    <Button variant="outline" className="mt-3 w-full" onClick={() => setLocation("/live-chat")}>
                      Contact support
                    </Button>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  The card purchase minimum and maximum are the same fixed price: USD {currentCardPriceNumber.toFixed(2)}. Any network fee charged by your wallet is not included.
                </p>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
