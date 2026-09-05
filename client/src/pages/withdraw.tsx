import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useWallets } from "@/hooks/use-wallets";
import { formatNumber, getCurrencySymbol } from "@/lib/formatters";
import { WavyHeader } from "@/components/wavy-header";
import { Building2, Smartphone, Wallet, Bitcoin, Info, CheckCircle, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const withdrawSchema = z.object({
  amount: z.string().min(1, "Amount is required").refine((val) => parseFloat(val) > 0, "Amount must be greater than zero"),
  currency: z.string().min(1, "Please select a currency"),
  withdrawMethod: z.string().min(1, "Please select a withdrawal method"),
  accountDetails: z.object({
    bankName: z.string().optional(),
    accountNumber: z.string().optional(),
    accountName: z.string().optional(),
    phoneNumber: z.string().optional(),
    country: z.string().optional(),
  }),
});

type WithdrawForm = z.infer<typeof withdrawSchema>;

export default function WithdrawPage() {
  const [, setLocation] = useLocation();
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [pendingWithdrawal, setPendingWithdrawal] = useState<WithdrawForm | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const { wallets: userWallets } = useWallets();
  const defaultWallet = userWallets.find(w => w.isDefault) || userWallets[0] || null;
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const activeWallet = userWallets.find(w => w.id === selectedWalletId) || defaultWallet;
  const realTimeBalance = activeWallet ? Number(activeWallet.availableBalance ?? 0) : 0;
  const activeSymbol = getCurrencySymbol(activeWallet?.currency || 'KES').trim();
  const usdBalance = Number(userWallets.find(w => w.currency === "USD")?.availableBalance ?? 0);
  const { data: systemSettings } = useQuery<any>({
    queryKey: ["/api/system-settings"],
    queryFn: async () => (await apiRequest("GET", "/api/system-settings")).json(),
  });
  const selectedCurrency = String(activeWallet?.currency || "USD").toUpperCase();
  const currencyFeeSetting = systemSettings?.fees?.[`withdrawal_fee_${selectedCurrency}`];
  const withdrawalFee = Math.max(
    0,
    Number(currencyFeeSetting?.value ?? currencyFeeSetting ?? systemSettings?.fees?.withdrawal_fee?.value ?? systemSettings?.fees?.withdrawal_fee ?? 0),
  );

  const form = useForm<WithdrawForm>({
    resolver: zodResolver(withdrawSchema),
    defaultValues: {
      amount: "",
      currency: activeWallet?.currency || "USD",
      withdrawMethod: "",
      accountDetails: {
        bankName: "",
        accountNumber: "",
        accountName: "",
        phoneNumber: "",
        country: "",
      },
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: async (data: WithdrawForm) => {
      const response = await apiRequest("POST", "/api/transactions", {
        userId: user?.id,
        type: "withdraw",
        amount: data.amount,
        currency: data.currency,
        description: `Withdrawal via ${data.withdrawMethod}`,
        // The server recalculates this from the admin setting. This value is
        // only included for older deployments that still read the payload.
        fee: withdrawalFee.toFixed(2),
        recipientDetails: data.accountDetails,
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Withdrawal Request Submitted!",
        description: selectedMethod === "mobile-money"
          ? "Your mobile money withdrawal is being reviewed and is usually processed within 30 minutes."
          : data.message || "Your withdrawal request is being reviewed and will be processed within 1-3 business days.",
      });
      form.reset();
      setPendingWithdrawal(null);
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || "Unable to process withdrawal. Please try again.";
      toast({
        title: "Withdrawal failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: WithdrawForm) => {
    setPendingWithdrawal({
      ...data,
      currency: activeWallet?.currency || data.currency,
    });
  };

  const withdrawMethods = [
    {
      id: "bank-transfer",
      name: "Bank Transfer",
      Icon: Building2,
      description: "Direct transfer to your bank account",
      fee: "fee",
      processingTime: "1-3 business days",
      countries: ["Nigeria", "Ghana", "Kenya", "South Africa", "Uganda"],
    },
    {
      id: "mobile-money",
      name: "Mobile Money",
      Icon: Smartphone,
      description: "M-Pesa, Airtel Money, MTN Mobile Money",
      fee: "fee",
      processingTime: "Usually under 30 minutes",
      countries: ["Kenya", "Uganda", "Tanzania", "Rwanda", "Cameroon"],
    },
    {
      id: "local-bank",
      name: "Local Bank Account",
      Icon: Wallet,
      description: "Direct deposit to local African banks",
      fee: "fee",
      processingTime: "2-4 hours",
      countries: ["Nigeria", "Ghana", "Kenya", "South Africa", "Egypt"],
    },
  ];

  const africanCountries = [
    { code: "NG", name: "Nigeria", flag: "🇳🇬" },
    { code: "GH", name: "Ghana", flag: "🇬🇭" },
    { code: "KE", name: "Kenya", flag: "🇰🇪" },
    { code: "ZA", name: "South Africa", flag: "🇿🇦" },
    { code: "UG", name: "Uganda", flag: "🇺🇬" },
    { code: "TZ", name: "Tanzania", flag: "🇹🇿" },
    { code: "RW", name: "Rwanda", flag: "🇷🇼" },
    { code: "ET", name: "Ethiopia", flag: "🇪🇹" },
    { code: "CM", name: "Cameroon", flag: "🇨🇲" },
    { code: "SN", name: "Senegal", flag: "🇸🇳" },
  ];

  const getWithdrawFee = () => {
    return `${activeSymbol} ${withdrawalFee.toFixed(2)}`;
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-6">
      {/* Header */}
      <WavyHeader
        
        
        size="sm"
      />

      <div className="p-6 space-y-6">
        {/* Available Balance */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-primary/10 to-secondary/10 p-4 rounded-xl border border-primary/20"
        >
          <div className="text-center">
            {userWallets.length > 1 && (
              <div className="flex gap-2 justify-center flex-wrap mb-3">
                {userWallets.filter(w => w.isActive && !w.isSuspended).map(w => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => setSelectedWalletId(w.id)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                      (selectedWalletId === w.id || (!selectedWalletId && w.id === defaultWallet?.id))
                        ? 'bg-primary text-white border-primary'
                        : 'bg-muted text-muted-foreground border-border'
                    }`}
                  >
                    {w.currency}
                  </button>
                ))}
              </div>
            )}
            <p className="text-sm text-muted-foreground">Available for Withdrawal ({activeWallet?.currency || 'KES'})</p>
            <p className="text-2xl font-bold text-primary" data-testid="text-available-balance">{activeSymbol} {formatNumber(realTimeBalance)}</p>
            <p className="text-xs text-muted-foreground mt-1">Real-time Balance</p>
          </div>
        </motion.div>

        {/* Helpful tip if user has USD but no KES */}
        {realTimeBalance < 100 && usdBalance > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-4 rounded-xl"
          >
            <div className="flex items-start">
              <Info className="w-5 h-5 text-blue-600 mr-3 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-200 text-sm mb-1">Convert USD to KES First</p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mb-2">
                  Your KES balance is low. You have ${formatNumber(usdBalance)} USD available to convert to KES.
                </p>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setLocation("/exchange")}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                >
                  Convert to KES
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Amount Input */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card p-4 rounded-xl border border-border elevation-1"
            >
              <h3 className="font-semibold mb-4">How much would you like to withdraw?</h3>
              
              <div className="grid grid-cols-3 gap-2 mb-4">
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                         <Select
                           onValueChange={(value) => {
                             field.onChange(value);
                             const wallet = userWallets.find(w => w.currency === value);
                             if (wallet) setSelectedWalletId(wallet.id);
                           }}
                           value={activeWallet?.currency || field.value}
                         >
                        <FormControl>
                          <SelectTrigger data-testid="select-currency">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {userWallets.filter(w => w.isActive && !w.isSuspended).map((w) => (
                            <SelectItem key={w.currency} value={w.currency}>
                              {w.currency}
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
                            className="text-lg"
                            data-testid="input-amount"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-4 gap-2">
                {["10", "25", "50", "100"].map((amount) => (
                  <motion.button
                    key={amount}
                    type="button"
                    whileTap={{ scale: 0.95 }}
                    onClick={() => form.setValue("amount", amount)}
                    className="p-3 border border-border rounded-lg hover:bg-muted transition-colors text-sm font-medium"
                    data-testid={`quick-amount-${amount}`}
                  >
                    {activeSymbol} {amount}
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Withdrawal Methods */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card rounded-xl border border-border elevation-1"
            >
              <div className="p-4 border-b border-border">
                <h3 className="font-semibold">Choose Withdrawal Method</h3>
                <p className="text-sm text-muted-foreground">Available in African countries</p>
              </div>
              
              <FormField
                control={form.control}
                name="withdrawMethod"
                render={({ field }) => (
                  <FormItem>
                    <div className="divide-y divide-border">
                      {withdrawMethods.map((method) => (
                        <motion.button
                          key={method.id}
                          type="button"
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            field.onChange(method.id);
                            setSelectedMethod(method.id);
                          }}
                          className={`w-full p-4 flex items-center text-left transition-colors ${
                            field.value === method.id ? 'bg-primary/5 border-r-2 border-primary' : 'hover:bg-muted'
                          }`}
                          data-testid={`withdraw-method-${method.id}`}
                        >
                          <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center mr-4">
                            <method.Icon className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-medium">{method.name}</p>
                              <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded-full">
                                {activeSymbol} {withdrawalFee.toFixed(2)} {method.fee}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">{method.description}</p>
                            <p className="text-xs text-foreground font-semibold mt-1">{method.processingTime}</p>
                          </div>
                          {field.value === method.id && (
                            <CheckCircle className="w-5 h-5 text-primary ml-2 shrink-0" />
                          )}
                        </motion.button>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </motion.div>

            {/* Crypto Withdrawal Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="bg-gradient-to-br from-orange-500/10 via-yellow-500/10 to-green-500/10 border border-primary/20 rounded-xl p-4 elevation-1"
            >
              <button
                type="button"
                onClick={() => setLocation("/crypto?tab=withdraw")}
                className="w-full flex items-center text-left group"
                data-testid="button-crypto-withdraw"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl flex items-center justify-center mr-4 shadow-md group-hover:scale-105 transition-transform">
                  <Bitcoin className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium">Crypto Withdrawal</p>
                    <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded-full">BTC · ETH · USDT · USDC</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Withdraw to any wallet address worldwide</p>
                  <p className="text-xs text-accent font-medium mt-1">30–60 minutes</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground ml-2 shrink-0" />
              </button>
            </motion.div>

            {/* Account Details Form */}
            {selectedMethod && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card p-4 rounded-xl border border-border elevation-1"
              >
                <h3 className="font-semibold mb-4">
                  {selectedMethod === "mobile-money" ? "Mobile Money Details" :
                   selectedMethod === "bank-transfer" ? "Bank Account Details" :
                   selectedMethod === "western-union" ? "Recipient Details" :
                   "Account Details"}
                </h3>
                
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="accountDetails.country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-country">
                              <SelectValue placeholder="Select destination country" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {africanCountries.map((country) => (
                              <SelectItem key={country.code} value={country.name}>
                                {country.flag} {country.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="accountDetails.accountName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {selectedMethod === "mobile-money" ? "Account Holder Name" :
                           selectedMethod === "western-union" ? "Recipient Name" :
                           "Account Holder Name"}
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter full name as it appears on account"
                            data-testid="input-account-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {selectedMethod === "mobile-money" && (
                    <FormField
                      control={form.control}
                      name="accountDetails.phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mobile Money Number</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="tel"
                              placeholder="e.g., +254712345678"
                              data-testid="input-mobile-number"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {(selectedMethod === "bank-transfer" || selectedMethod === "local-bank") && (
                    <>
                      <FormField
                        control={form.control}
                        name="accountDetails.bankName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bank Name</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="e.g., GTBank, Equity Bank, Standard Bank"
                                data-testid="input-bank-name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="accountDetails.accountNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Account Number</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Enter bank account number"
                                data-testid="input-account-number"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  {selectedMethod === "western-union" && (
                    <FormField
                      control={form.control}
                      name="accountDetails.phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Recipient Phone Number</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="tel"
                              placeholder="Phone number for pickup notification"
                              data-testid="input-recipient-phone"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </motion.div>
            )}

            {/* Important Notice */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-accent/10 p-4 rounded-xl border border-accent/20"
            >
              <div className="flex items-start">
                <Info className="w-5 h-5 text-accent mr-3 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-medium text-accent mb-1">Important Information</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Ensure all account details are correct to avoid delays</li>
                    <li>• Withdrawals cannot be cancelled once processed</li>
                    <li>• You may be contacted for verification purposes</li>
                    <li>• Exchange rates are locked at the time of withdrawal</li>
                    <li>• Mobile money withdrawals are usually processed within 30 minutes</li>
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* Transaction Summary */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-card p-4 rounded-xl border border-border elevation-1"
            >
              <h3 className="font-semibold mb-3">Transaction Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Withdrawal Amount</span>
                  <span className="font-medium">{activeSymbol} {form.watch("amount") || "0.00"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Processing Fee</span>
                  <span className="font-medium">{getWithdrawFee()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Currency</span>
                  <span className="font-medium">{activeWallet?.currency || "—"}</span>
                </div>
                {selectedMethod && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Processing Time</span>
                    <span className="font-medium text-accent">
                      {withdrawMethods.find(m => m.id === selectedMethod)?.processingTime}
                    </span>
                  </div>
                )}
                <hr className="border-border" />
                <div className="flex justify-between font-bold">
                  <span>Amount sent to recipient</span>
                  <span className="text-primary">
                    {activeSymbol} {form.watch("amount") ?
                      formatNumber(parseFloat(form.watch("amount"))) :
                      "0.00"}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Total deducted from wallet</span>
                  <span>{activeSymbol} {form.watch("amount") ? formatNumber(parseFloat(form.watch("amount")) + withdrawalFee) : "0.00"}</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Button
                type="submit"
                className="w-full ripple"
                disabled={withdrawMutation.isPending || !selectedMethod}
                data-testid="button-confirm-withdrawal"
              >
                {withdrawMutation.isPending ? "Processing..." : `Withdraw ${activeSymbol} ${form.watch("amount") || "0.00"}`}
              </Button>
            </motion.div>
          </form>
        </Form>
      </div>

      <Dialog open={!!pendingWithdrawal} onOpenChange={(open) => {
        if (!open && !withdrawMutation.isPending) setPendingWithdrawal(null);
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm withdrawal</DialogTitle>
            <DialogDescription>
              Review all details carefully. Your wallet will be placed on hold only after you confirm.
            </DialogDescription>
          </DialogHeader>

          {pendingWithdrawal && (
            <div className="space-y-4">
              <div className="rounded-xl bg-muted/50 p-4 space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Method</span>
                  <span className="font-medium text-right">
                    {withdrawMethods.find(method => method.id === pendingWithdrawal.withdrawMethod)?.name || pendingWithdrawal.withdrawMethod}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Wallet</span>
                  <span className="font-medium">{pendingWithdrawal.currency}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Amount to recipient</span>
                  <span className="font-medium">{activeSymbol} {formatNumber(Number(pendingWithdrawal.amount))}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Processing fee</span>
                  <span className="font-medium">{activeSymbol} {withdrawalFee.toFixed(2)}</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between gap-4 font-bold">
                  <span>Total deducted</span>
                  <span className="text-primary">
                    {activeSymbol} {formatNumber(Number(pendingWithdrawal.amount) + withdrawalFee)}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Processing estimate</span>
                  <span className="font-medium text-right">
                    {withdrawMethods.find(method => method.id === pendingWithdrawal.withdrawMethod)?.processingTime || "Review required"}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-border p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Recipient details</p>
                <div className="space-y-1 text-sm">
                  {Object.entries(pendingWithdrawal.accountDetails)
                    .filter(([, value]) => Boolean(value))
                    .map(([key, value]) => (
                      <div key={key} className="flex justify-between gap-4">
                        <span className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                        <span className="font-medium text-right break-all">{value}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPendingWithdrawal(null)}
              disabled={withdrawMutation.isPending}
            >
              Go back
            </Button>
            <Button
              type="button"
              onClick={() => pendingWithdrawal && withdrawMutation.mutate(pendingWithdrawal)}
              disabled={withdrawMutation.isPending}
              className="bg-primary"
            >
              {withdrawMutation.isPending ? "Submitting..." : "Confirm withdrawal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
