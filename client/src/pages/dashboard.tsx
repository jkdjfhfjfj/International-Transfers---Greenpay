import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useSystemSettings } from "@/hooks/use-system-settings";
import Notifications from "@/components/notifications";
import { Sparkles, TrendingUp, Smartphone, Send, Download, CreditCard, Zap, DollarSign, MapPin, Receipt, Bitcoin, BarChart3, Plus, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatNumber } from "@/lib/formatters";
import AnnouncementSlide from "@/components/announcement-slide";
import { MoreMenu } from "@/components/more-menu";
import { Grid } from "lucide-react";
import WalletCards from "@/components/wallet-cards";
import { useWallets } from "@/hooks/use-wallets";
import type { Wallet as WalletType } from "@/hooks/use-wallets";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function getCurrencySymbol(currency?: string): string {
  const map: Record<string, string> = {
    USD: '$', EUR: '€', GBP: '£', KES: 'KSh ', NGN: '₦',
    GHS: 'GH₵', UGX: 'USh ', TZS: 'TSh ', RWF: 'FRw ',
    ZAR: 'R', XOF: 'CFA ', MAD: 'MAD ', EGP: 'E£', ZMW: 'ZK',
    AED: 'AED ', CAD: 'CA$', AUD: 'A$', INR: '₹', CNY: '¥', JPY: '¥',
  };
  return map[(currency || '').toUpperCase()] ?? ((currency?.toUpperCase() || 'USD') + ' ');
}

export default function DashboardPage() {
  const [, setLocation] = useLocation();
  const [showBalance, setShowBalance] = useState(true);
  const [showDiscountModal] = useState(false);
  const [activeWallet, setActiveWallet] = useState<'USD' | 'KES'>('USD');
  const [maintenanceAlertShown, setMaintenanceAlertShown] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<WalletType | null>(null);
  const [addWalletOpen, setAddWalletOpen] = useState(false);
  const [addWalletCurrency, setAddWalletCurrency] = useState("UGX");
  const { user, logout, refreshUser } = useAuth();
  const { toast } = useToast();
  const { getMaintenanceMode, getMaintenanceMessage } = useSystemSettings();
  const queryClient = useQueryClient();
  const { wallets: userWallets, isLoading: walletsLoading } = useWallets();

  const addWalletMutation = useMutation({
    mutationFn: async (currency: string) => {
      const r = await apiRequest("POST", "/api/wallets", { currency });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message || "Failed to add wallet");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
      setAddWalletOpen(false);
      toast({ title: "Wallet added!", description: `Your new ${addWalletCurrency} wallet is ready.` });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  // Refresh user data when dashboard loads to get latest balance
  useEffect(() => {
    refreshUser();
  }, []);

  // Check for maintenance mode changes and alert user
  useEffect(() => {
    if (getMaintenanceMode() && !maintenanceAlertShown) {
      setMaintenanceAlertShown(true);
      toast({
        title: "System Maintenance",
        description: getMaintenanceMessage(),
        variant: "destructive",
      });
    }
  }, [getMaintenanceMode(), maintenanceAlertShown, toast, getMaintenanceMessage]);

  // Get real user data
  const { data: transactionData } = useQuery({
    queryKey: ["/api/transactions", user?.id],
    enabled: !!user?.id,
  });

  const { data: exchangeRates } = useQuery({
    queryKey: ["/api/exchange-rates", "USD"],
  });

  const { data: cardData } = useQuery({
    queryKey: ["/api/virtual-card", user?.id],
    enabled: !!user?.id,
  });

  // Get current card price from system settings
  const { data: settingsData } = useQuery({
    queryKey: ["/api/system-settings/card-price"],
  });

  // Get login history
  const { data: loginHistoryData } = useQuery({
    queryKey: ["/api/users/login-history", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const response = await apiRequest("GET", `/api/users/${user.id}/login-history`);
      return response.json();
    },
    enabled: !!user?.id,
  });

  const transactions = (transactionData as any)?.transactions || [];
  const loginHistory = (loginHistoryData as any)?.loginHistory || [];
  
  // Dual wallet balances
  const usdBalance = userWallets.find((wallet) => wallet.currency === "USD")?.availableBalance || 0;
  const kesBalance = userWallets.find((wallet) => wallet.currency === "KES")?.availableBalance || 0;
  
  // Get the active wallet balance based on selection
  const activeBalance = activeWallet === 'USD' ? usdBalance : kesBalance;
  
  // Get exchange rates for display
  const rates = (exchangeRates as any)?.rates || {};
  
  // Check user status
  const isKYCVerified = user?.kycStatus === 'verified';
  const card = (cardData as any)?.card;
  const hasActiveVirtualCard = card && card.status === 'active';
  const cardStatus = hasActiveVirtualCard ? 'active' : 'inactive';

  // Card pricing for discount modal
  const currentCardPrice = (settingsData as any)?.price || "60.00";
  const originalPrice = "60.00";
  const discountPrice = currentCardPrice;

  // Discount modal disabled - users can access virtual card from dashboard or menu

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
  };

  // Quick action items
  const quickActions = [
    { 
      id: "send", 
      icon: Send, 
      label: "Send Money", 
      path: "/send-money", 
      accent: '#16a34a',
      tint: 'rgba(22,163,74,0.08)',
      disabled: !hasActiveVirtualCard,
      requiresCard: true
    },
    { 
      id: "receive", 
      icon: Download, 
      label: "Receive", 
      path: "/receive-money", 
      accent: '#16a34a',
      tint: 'rgba(22,163,74,0.08)',
      disabled: !hasActiveVirtualCard,
      requiresCard: true
    },
    { 
      id: "airtime", 
      icon: Smartphone, 
      label: "Buy Airtime", 
      path: "/airtime", 
      accent: '#16a34a',
      tint: 'rgba(22,163,74,0.08)',
      disabled: false,
      requiresCard: false
    },
    { 
      id: "bills", 
      icon: Receipt, 
      label: "Pay Bills", 
      path: "/bills", 
      accent: '#16a34a',
      tint: 'rgba(22,163,74,0.08)',
      disabled: false,
      requiresCard: false
    },
    { 
      id: "deposit", 
      icon: TrendingUp, 
      label: "Add Money", 
      path: "/deposit", 
      accent: '#16a34a',
      tint: 'rgba(22,163,74,0.08)',
      disabled: false,
      requiresCard: false
    },
    {
      id: "crypto",
      icon: Bitcoin,
      label: "Crypto",
      path: "/crypto",
      accent: '#16a34a',
      tint: 'rgba(22,163,74,0.08)',
      disabled: false,
      requiresCard: false
    },
    {
      id: "analytics",
      icon: BarChart3,
      label: "Analytics",
      path: "/analytics",
      accent: '#16a34a',
      tint: 'rgba(22,163,74,0.08)',
      disabled: false,
      requiresCard: false
    },
  ];

  // Handle action click with card requirement check
  const handleActionClick = (action: typeof quickActions[0]) => {
    if (action.disabled && action.requiresCard) {
      toast({
        title: "Virtual Card Required",
        description: "Please get a virtual card first to use this feature. Tap 'Get Card' below.",
        variant: "default",
      });
      return;
    }
    setLocation(action.path);
  };

  const { data: announcementsData } = useQuery({
    queryKey: ["/api/announcements"],
  });

  const announcementsList = (announcementsData as any)?.announcements || [];

  const { settings, isLoaded } = useSystemSettings();
  const airtimeBonusSetting = settings?.general?.enable_airtime_bonus;
  const airtimeBonusAmountSetting = settings?.general?.airtime_bonus_amount;
  const airtimeBonusAmount = String(
    airtimeBonusAmountSetting?.value ?? airtimeBonusAmountSetting ?? "10",
  );
  const airtimeBonusEnabledValue = airtimeBonusSetting?.value ?? airtimeBonusSetting;
  const isAirtimeBonusEnabled = isLoaded &&
    ["true", "1", "yes", "on"].includes(String(airtimeBonusEnabledValue ?? "").toLowerCase());


  const showAnnouncement = isLoaded && (settings?.general?.show_announcement === true || settings?.general?.show_announcement === 'true');
  const announcementText = settings?.general?.dashboard_announcement;

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <AnnouncementSlide announcements={announcementsList} />
      <div className="max-w-md mx-auto px-4">
        {/* Dashboard Announcement (System Setting Legacy) */}
        {showAnnouncement && announcementText && !announcementsList.find((a: any) => a.content === announcementText) && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-primary/10 border border-primary/20 p-4 rounded-2xl flex items-start gap-3 mb-6"
          >
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-primary">Announcement</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                {announcementText}
              </p>
            </div>
          </motion.div>
        )}
      </div>
      {/* Dashboard Header — matches #16a34a meta theme */}
      <div
        className="sticky top-0 z-50"
        style={{
          background: 'linear-gradient(160deg, #16a34a 0%, #22c55e 100%)',
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
          padding: '16px 16px 20px',
          color: 'white',
        }}
      >
        {/* Profile bar */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-2"
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {user?.profilePhotoUrl ? (
              <img
                src={user.profilePhotoUrl}
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover border-2 border-white/30 shadow-lg flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center border-2 border-white/30 shadow-lg flex-shrink-0">
                <span className="text-white font-bold text-sm">
                  {user?.fullName?.split(' ').map((n: string) => n[0]).join('') || 'GP'}
                </span>
              </div>
            )}
            <div className="min-w-0">
              <h1 className="font-bold text-base leading-tight truncate">
                Hi, {user?.fullName?.split(' ')[0] || 'there'}!
              </h1>
              <p className="text-xs text-white/75">Welcome back 👋</p>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Notifications />
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => setLocation('/live-chat')}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/15 transition-colors"
              title="Contact Support"
              data-testid="button-support"
            >
              <span className="material-icons text-white" style={{ fontSize: 18 }}>headset_mic</span>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={toggleDarkMode}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/15 transition-colors"
              data-testid="button-dark-mode"
            >
              <span className="material-icons text-white" style={{ fontSize: 18 }}>brightness_6</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Location tag */}
        {user?.country && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.05 }}
            className="flex items-center gap-1.5 mb-3"
          >
            <div
              className="flex items-center gap-1.5 text-white/70 text-xs"
              style={{
                background: 'rgba(255,255,255,0.10)',
                borderRadius: 20,
                padding: '3px 10px',
                display: 'inline-flex',
              }}
            >
              <MapPin className="w-2.5 h-2.5" />
              <span>Logged in · {user.country}</span>
            </div>
          </motion.div>
        )}

        {/* Wallet Cards Carousel */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
        >
          {walletsLoading ? (
            <div className="bg-white/10 rounded-2xl p-4 text-center">
              <div className="w-6 h-6 border-2 border-white/40 border-t-white rounded-full animate-spin mx-auto mb-2" />
              <p className="text-white/60 text-sm">Loading wallets...</p>
            </div>
          ) : userWallets.length > 0 ? (
            <WalletCards
              wallets={userWallets}
              showBalance={showBalance}
              onToggleBalance={() => setShowBalance(!showBalance)}
              onWalletSelect={setSelectedWallet}
              selectedWalletId={selectedWallet?.id}
              onAddWallet={() => setAddWalletOpen(true)}
              showAdd={true}
            />
          ) : (
            <div
              onClick={() => setAddWalletOpen(true)}
              className="bg-white/10 rounded-2xl p-5 text-center cursor-pointer hover:bg-white/15 transition-colors border-2 border-dashed border-white/30"
            >
              <Wallet className="w-8 h-8 text-white/60 mx-auto mb-2" />
              <p className="text-white/80 text-sm font-medium">No wallets yet</p>
              <p className="text-white/50 text-xs mt-0.5">Tap to add your first wallet</p>
            </div>
          )}

          {/* History / Exchange quick actions */}
          <div className="flex gap-2 mt-3">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setLocation("/transactions")}
              style={{
                flex: 1, padding: '8px 0', borderRadius: 10, border: 'none',
                fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 5, cursor: 'pointer', transition: 'opacity 0.15s',
                background: 'rgba(255,255,255,0.18)',
                color: 'white',
              }}
              title="View transaction history"
            >
              <Receipt className="w-3 h-3" /> History
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setLocation('/exchange')}
              style={{
                flex: 1, padding: '8px 0', borderRadius: 10, border: 'none',
                fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 5, cursor: 'pointer', transition: 'opacity 0.15s',
                background: 'white', color: '#059669',
              }}
            >
              <span className="material-icons" style={{ fontSize: 14 }}>currency_exchange</span>
              Exchange
            </motion.button>
          </div>
        </motion.div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 space-y-6">
        {/* KYC Status Alert - Different messages based on status */}
        {!isKYCVerified && user?.kycStatus === 'pending' && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-4 rounded-xl flex items-center justify-between"
          >
            <div className="flex items-center">
              <span className="material-icons text-blue-600 mr-3">hourglass_empty</span>
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-200 text-sm">Documents Under Review</p>
                <p className="text-xs text-blue-700 dark:text-blue-300">Your KYC documents are being verified</p>
              </div>
            </div>
            <Button
              onClick={() => setLocation("/kyc")}
              size="sm"
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-xs"
              data-testid="button-view-kyc"
            >
              View Status
            </Button>
          </motion.div>
        )}

        {!isKYCVerified && user?.kycStatus === 'rejected' && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-4 rounded-xl flex items-center justify-between"
          >
            <div className="flex items-center">
              <span className="material-icons text-red-600 mr-3">error_outline</span>
              <div>
                <p className="font-medium text-red-900 dark:text-red-200 text-sm">Verification Failed</p>
                <p className="text-xs text-red-700 dark:text-red-300">Please resubmit your documents</p>
              </div>
            </div>
            <Button
              onClick={() => setLocation("/kyc")}
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white text-xs"
              data-testid="button-resubmit-kyc"
            >
              Resubmit
            </Button>
          </motion.div>
        )}

        {!isKYCVerified && (!user?.kycStatus || user?.kycStatus === 'not_submitted') && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-4 rounded-xl flex items-center justify-between"
          >
            <div className="flex items-center">
              <span className="material-icons text-amber-600 mr-3">warning</span>
              <div>
                <p className="font-medium text-amber-900 dark:text-amber-200 text-sm">Verify Your Identity</p>
                <p className="text-xs text-amber-700 dark:text-amber-300">Complete KYC to unlock all features</p>
              </div>
            </div>
            <Button
              onClick={() => setLocation("/kyc")}
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs"
              data-testid="button-verify-kyc"
            >
              Verify
            </Button>
          </motion.div>
        )}

        {!hasActiveVirtualCard && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-primary/5 dark:bg-primary/10 border border-primary/20 p-4 rounded-xl flex items-center justify-between"
          >
            <div className="flex items-center">
              <CreditCard className="w-5 h-5 text-primary mr-3" />
              <div>
                <p className="font-medium text-foreground text-sm">Get Virtual Card</p>
                <p className="text-xs text-muted-foreground">Start making transactions</p>
              </div>
            </div>
            <Button
              onClick={() => setLocation("/virtual-card")}
              size="sm"
              className="bg-primary hover:bg-primary/90 text-white text-xs"
              data-testid="button-activate-card"
            >
              Get Card
            </Button>
          </motion.div>
        )}

        {/* Airtime Bonus - one-time claim for all users */}
        {isAirtimeBonusEnabled && !user?.hasClaimedAirtimeBonus && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-gradient-to-r from-primary/5 to-secondary/5 dark:from-primary/10 dark:to-secondary/10 border border-primary/20 p-4 rounded-xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Sparkles className="w-6 h-6 text-primary mr-3 flex-shrink-0 animate-pulse" />
                <div className="flex-1">
                  <p className="font-bold text-foreground text-sm mb-1">Free Airtime Bonus!</p>
                  <p className="text-xs text-muted-foreground">
                    Claim your one-time KES {airtimeBonusAmount} airtime bonus now!
                  </p>
                </div>
              </div>
              <Button
                onClick={async () => {
                  try {
                    const response = await apiRequest("POST", "/api/airtime/claim-bonus", {
                      userId: user?.id
                    });
                    const data = await response.json();
                    if (data.success) {
                      toast({
                        title: "Bonus Claimed!",
                        description: data.message,
                      });
                      await refreshUser();
                      setLocation("/airtime");
                    } else {
                      toast({
                        title: "Error",
                        description: data.message,
                        variant: "destructive",
                      });
                    }
                  } catch (error: any) {
                    toast({
                      title: "Error",
                      description: error?.message || "Failed to claim bonus. Please try again.",
                      variant: "destructive",
                    });
                  }
                }}
                size="sm"
                className="bg-primary hover:bg-primary/90 text-white text-xs"
              >
                Claim Now
              </Button>
            </div>
          </motion.div>
        )}

        {/* Quick Actions Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-lg font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-4 gap-x-3 gap-y-5">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <motion.button
                  key={action.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * index }}
                  whileTap={{ scale: action.disabled ? 1 : 0.88 }}
                  onClick={() => handleActionClick(action)}
                  className={`flex flex-col items-center gap-1.5 ${action.disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ background: action.tint }}
                  >
                    <Icon className="w-6 h-6" strokeWidth={2} style={{ color: action.accent }} />
                  </div>
                  <span className="font-semibold text-center leading-tight" style={{ fontSize: 10, color: action.accent }}>
                    {action.label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Services */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-lg font-bold mb-4">Services</h2>
          <div className="grid grid-cols-4 gap-x-3 gap-y-5">
            {[
              {
                id: 'card', label: 'Virtual Card', path: '/virtual-card', testId: 'button-virtual-card',
                accent: '#16a34a', tint: 'rgba(22,163,74,0.08)',
                icon: 'credit_card',
                badge: cardStatus === 'active',
              },
              {
                id: 'history', label: 'History', path: '/transactions', testId: 'button-transactions',
                accent: '#16a34a', tint: 'rgba(22,163,74,0.08)',
                icon: 'receipt_long',
              },
              {
                id: 'exchange', label: 'Exchange', path: '/exchange', testId: '',
                accent: '#16a34a', tint: 'rgba(22,163,74,0.08)',
                icon: 'currency_exchange',
              },
              {
                id: 'support', label: 'Support', path: '/live-chat', testId: 'button-support',
                accent: '#16a34a', tint: 'rgba(22,163,74,0.08)',
                icon: 'support_agent',
              },
              {
                id: 'status', label: 'Status', path: '/status', testId: '',
                accent: '#16a34a', tint: 'rgba(22,163,74,0.08)',
                icon: 'health_and_safety',
              },
              {
                id: 'settings', label: 'Settings', path: '/settings', testId: 'button-settings',
                accent: '#16a34a', tint: 'rgba(22,163,74,0.08)',
                icon: 'settings',
              },
            ].map((service, index) => (
              <motion.button
                key={service.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index }}
                whileTap={{ scale: 0.88 }}
                onClick={() => setLocation(service.path)}
                className="flex flex-col items-center gap-1.5"
                data-testid={service.testId || undefined}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center relative"
                  style={{ background: service.tint }}
                >
                  <span className="material-icons text-2xl leading-none" style={{ color: service.accent }}>
                    {service.icon}
                  </span>
                  {service.badge && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-background" />
                  )}
                </div>
                <span className="font-semibold text-center leading-tight" style={{ fontSize: 10, color: service.accent }}>
                  {service.label}
                </span>
              </motion.button>
            ))}

            {/* More tile — opens bottom sheet */}
            <motion.button
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              whileTap={{ scale: 0.88 }}
              onClick={() => setShowMoreMenu(true)}
              className="flex flex-col items-center gap-1.5"
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(22,163,74,0.08)' }}
              >
                <Grid className="w-6 h-6" style={{ color: '#16a34a' }} />
              </div>
              <span className="font-semibold text-center leading-tight" style={{ fontSize: 10, color: '#16a34a' }}>
                More
              </span>
            </motion.button>
          </div>
        </motion.div>

        {/* Recent Transactions + Login History — side by side on desktop */}
        <div className="md:grid md:grid-cols-2 md:gap-6 space-y-6 md:space-y-0">
        {/* Recent Transactions */}
        {transactions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card rounded-2xl border border-border shadow-sm"
          >
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-bold text-base">Recent Activity</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/transactions")}
                className="text-xs"
                data-testid="button-view-all-transactions"
              >
                View All
              </Button>
            </div>
            <div className="divide-y divide-border">
              {transactions.slice(0, 3).map((transaction: any, index: number) => (
                <div key={transaction.id || index} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                  <div className="flex items-center">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-3 ${
                      transaction.type === 'receive' || transaction.type === 'deposit'
                        ? 'bg-green-100 dark:bg-green-950/30 text-green-600'
                        : 'bg-red-100 dark:bg-red-950/30 text-red-600'
                    }`}>
                      <span className="material-icons text-lg">
                        {transaction.type === 'receive' || transaction.type === 'deposit'
                          ? 'arrow_downward'
                          : 'arrow_upward'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-sm capitalize">{transaction.type.replace('_', ' ')}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-sm ${
                      transaction.type === 'receive' || transaction.type === 'deposit'
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}>
                      {transaction.type === 'receive' || transaction.type === 'deposit' ? '+' : '−'}
                      {getCurrencySymbol(transaction.currency)}{formatNumber(transaction.amount)}
                    </p>
                    <p className={`text-xs ${
                      transaction.status === 'completed'
                        ? 'text-green-600'
                        : transaction.status === 'pending'
                        ? 'text-amber-600'
                        : 'text-red-600'
                    }`}>
                      {transaction.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Login History */}
        {loginHistory.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-card rounded-2xl border border-border shadow-sm md:self-start"
          >
            <div className="p-4 border-b border-border">
              <h3 className="font-bold text-base">Recent Logins</h3>
            </div>
            <div className="divide-y divide-border">
              {loginHistory.slice(0, 5).map((login: any, index: number) => (
                <div key={login.id || index} className="p-4 flex items-start justify-between hover:bg-muted/50 transition-colors">
                  <div className="flex items-start">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/30 text-blue-600 flex items-center justify-center mr-3 flex-shrink-0">
                      <span className="material-icons text-lg">
                        {login.deviceType === 'mobile' ? 'smartphone' : 'computer'}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">
                        {login.browser || 'Unknown Browser'}
                        {login.deviceType && ` • ${login.deviceType.charAt(0).toUpperCase() + login.deviceType.slice(1)}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {login.location || 'Unknown Location'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(login.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      login.status === 'success' 
                        ? 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400' 
                        : 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400'
                    }`}>
                      {login.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
        </div>{/* end side-by-side grid */}
      </div>
      {/* Discount modal removed - users can access virtual card directly from menu/dashboard */}

      {/* More bottom sheet */}
      <MoreMenu open={showMoreMenu} onClose={() => setShowMoreMenu(false)} />

      {/* Add Wallet Dialog */}
      <Dialog open={addWalletOpen} onOpenChange={setAddWalletOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary" />
              Add a Wallet
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">Choose a currency to create a new wallet. You can have one wallet per currency.</p>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Currency</label>
              <Select value={addWalletCurrency} onValueChange={setAddWalletCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[
                    { code: "UGX", flag: "🇺🇬", name: "Ugandan Shilling" },
                    { code: "GHS", flag: "🇬🇭", name: "Ghanaian Cedi" },
                    { code: "NGN", flag: "🇳🇬", name: "Nigerian Naira" },
                    { code: "ZAR", flag: "🇿🇦", name: "South African Rand" },
                    { code: "TZS", flag: "🇹🇿", name: "Tanzanian Shilling" },
                    { code: "XOF", flag: "🌍", name: "West African CFA" },
                    { code: "CDF", flag: "🇨🇩", name: "Congolese Franc" },
                    { code: "XAF", flag: "🌍", name: "Central African CFA" },
                    { code: "RWF", flag: "🇷🇼", name: "Rwandan Franc" },
                    { code: "SLE", flag: "🇸🇱", name: "Sierra Leonean Leone" },
                    { code: "ZMW", flag: "🇿🇲", name: "Zambian Kwacha" },
                    { code: "EUR", flag: "🇪🇺", name: "Euro" },
                    { code: "GBP", flag: "🇬🇧", name: "British Pound" },
                  ].filter(c => !userWallets.some(w => w.currency === c.code)).map(c => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.flag} {c.code} — {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setAddWalletOpen(false)}>Cancel</Button>
              <Button
                className="flex-1"
                onClick={() => addWalletMutation.mutate(addWalletCurrency)}
                disabled={addWalletMutation.isPending}
              >
                {addWalletMutation.isPending ? (
                  <><span className="animate-spin mr-2">⟳</span> Adding...</>
                ) : (
                  <>Add {addWalletCurrency} Wallet</>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
