import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useSystemSettings } from "@/hooks/use-system-settings";
import Notifications from "@/components/notifications";
import { Sparkles, TrendingUp, Smartphone, Send, Download, CreditCard, Zap, DollarSign, MapPin, Receipt, Copy, Check, Bitcoin, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatNumber } from "@/lib/formatters";
import AnnouncementSlide from "@/components/announcement-slide";

export default function DashboardPage() {
  const [, setLocation] = useLocation();
  const [showBalance, setShowBalance] = useState(true);
  const [showDiscountModal] = useState(false); // Modal disabled - kept for future use
  const [activeWallet, setActiveWallet] = useState<'USD' | 'KES'>('USD');
  const [maintenanceAlertShown, setMaintenanceAlertShown] = useState(false);
  const [copiedAccountNumber, setCopiedAccountNumber] = useState(false);
  const { user, logout, refreshUser } = useAuth();
  const { toast } = useToast();
  const { getMaintenanceMode, getMaintenanceMessage } = useSystemSettings();

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
  const usdBalance = parseFloat(user?.balance || '0');
  const kesBalance = parseFloat(user?.kesBalance || '0');
  
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
      color: "from-emerald-500 to-green-600",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/20",
      disabled: !hasActiveVirtualCard,
      requiresCard: true
    },
    { 
      id: "receive", 
      icon: Download, 
      label: "Receive", 
      path: "/receive-money", 
      color: "from-emerald-500 to-green-600",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/20",
      disabled: !hasActiveVirtualCard,
      requiresCard: true
    },
    { 
      id: "airtime", 
      icon: Smartphone, 
      label: "Buy Airtime", 
      path: "/airtime", 
      color: "from-emerald-500 to-green-600",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/20",
      disabled: false,
      requiresCard: false
    },
    { 
      id: "bills", 
      icon: Receipt, 
      label: "Pay Bills", 
      path: "/bills", 
      color: "from-emerald-500 to-green-600",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/20",
      disabled: false,
      requiresCard: false
    },
    { 
      id: "deposit", 
      icon: TrendingUp, 
      label: "Add Money", 
      path: "/deposit", 
      color: "from-emerald-500 to-green-600",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/20",
      disabled: false,
      requiresCard: false
    },
    {
      id: "crypto",
      icon: Bitcoin,
      label: "Crypto",
      path: "/crypto",
      color: "from-orange-500 to-yellow-500",
      bgColor: "bg-orange-50 dark:bg-orange-950/20",
      disabled: false,
      requiresCard: false
    },
    {
      id: "analytics",
      icon: BarChart3,
      label: "Analytics",
      path: "/analytics",
      color: "from-emerald-500 to-teal-500",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/20",
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

  const handleCopyAccountNumber = async () => {
    if (user?.id) {
      await navigator.clipboard.writeText(user.id);
      setCopiedAccountNumber(true);
      toast({
        title: "Copied!",
        description: "Account number copied to clipboard",
        variant: "default",
      });
      setTimeout(() => setCopiedAccountNumber(false), 2000);
    }
  };

  const { data: announcementsData } = useQuery({
    queryKey: ["/api/announcements"],
  });

  const announcementsList = (announcementsData as any)?.announcements || [];

  const { settings, isLoaded } = useSystemSettings();
  const airtimeBonusAmount = settings?.general?.airtime_bonus_amount || "15";
  const isAirtimeBonusEnabled = settings?.general?.enable_airtime_bonus !== false && settings?.general?.enable_airtime_bonus !== 'false';


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
      {/* Gemini Gradient Header */}
      <div
        className="sticky top-0 z-50"
        style={{
          background: 'linear-gradient(135deg, #0f766e 0%, #16a34a 100%)',
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

        {/* Glassmorphism Balance Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.08 }}
          style={{
            background: 'rgba(255,255,255,0.12)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.18)',
            borderRadius: 16,
            padding: '14px 16px',
          }}
        >
          {/* Top row: currency switcher + eye */}
          <div className="flex items-center justify-between mb-2">
            <div
              className="flex"
              style={{
                background: 'rgba(0,0,0,0.20)',
                borderRadius: 8,
                padding: 2,
                gap: 2,
              }}
            >
              {(['USD', 'KES'] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setActiveWallet(c)}
                  style={{
                    padding: '3px 12px',
                    borderRadius: 6,
                    border: 'none',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    background: activeWallet === c ? 'white' : 'transparent',
                    color: activeWallet === c ? '#059669' : 'rgba(255,255,255,0.65)',
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => setShowBalance(!showBalance)}
              className="opacity-80 hover:opacity-100 transition-opacity"
              data-testid="button-toggle-balance"
            >
              <span className="material-icons text-white" style={{ fontSize: 18 }}>
                {showBalance ? 'visibility' : 'visibility_off'}
              </span>
            </motion.button>
          </div>

          {/* Balance */}
          <p className="text-xs text-white/70 mb-0.5 flex items-center gap-1">
            {activeWallet} Balance
            {isKYCVerified && (
              <span className="material-icons text-green-300" style={{ fontSize: 13 }}>verified</span>
            )}
          </p>
          <p className="font-bold mb-1" style={{ fontSize: 28, letterSpacing: '-0.5px' }} data-testid="text-balance">
            {showBalance
              ? activeWallet === 'USD'
                ? `$${formatNumber(activeBalance)}`
                : `KSh ${formatNumber(activeBalance)}`
              : '••••••'}
          </p>
          <p className="text-xs text-white/60 mb-3">
            {activeWallet === 'USD'
              ? <>Other: KSh {showBalance ? formatNumber(kesBalance) : '••••'}</>
              : <>Other: ${showBalance ? formatNumber(usdBalance) : '••••'}</>}
          </p>

          {/* Action buttons */}
          <div className="flex gap-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleCopyAccountNumber}
              style={{
                flex: 1,
                padding: '8px 0',
                borderRadius: 10,
                border: 'none',
                fontSize: 12,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                cursor: 'pointer',
                transition: 'opacity 0.15s',
                background: copiedAccountNumber ? 'rgba(74,222,128,0.20)' : 'rgba(255,255,255,0.18)',
                color: 'white',
              }}
              title="Copy Account Number"
            >
              {copiedAccountNumber ? (
                <><Check className="w-3 h-3" /> Copied</>
              ) : (
                <><Copy className="w-3 h-3" /> Copy Acc No</>
              )}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setLocation('/exchange')}
              style={{
                flex: 1,
                padding: '8px 0',
                borderRadius: 10,
                border: 'none',
                fontSize: 12,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                cursor: 'pointer',
                transition: 'opacity 0.15s',
                background: 'white',
                color: '#059669',
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
                  } catch (error) {
                    toast({
                      title: "Error",
                      description: "Failed to claim bonus. Please try again.",
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <motion.button
                  key={action.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 * index }}
                  whileTap={{ scale: action.disabled ? 1 : 0.95 }}
                  onClick={() => handleActionClick(action)}
                  className={`${action.bgColor} p-5 rounded-2xl border border-border hover:shadow-lg transition-all ${
                    action.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-3 shadow-md`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-sm">{action.label}</p>
                    {action.disabled && action.requiresCard && (
                      <p className="text-xs text-muted-foreground mt-0.5">Card required</p>
                    )}
                  </div>
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setLocation("/virtual-card")}
              className="bg-card p-5 rounded-2xl border border-border hover:shadow-lg transition-all hover:scale-105"
              data-testid="button-virtual-card"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center mb-3 shadow-md">
                <span className="material-icons text-white text-2xl leading-none">credit_card</span>
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm mb-1">Virtual Card</p>
                <p className={`text-xs font-medium ${cardStatus === 'active' ? 'text-primary' : 'text-muted-foreground'}`}>
                  {cardStatus === 'active' ? '● Active' : '● Inactive'}
                </p>
              </div>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setLocation("/transactions")}
              className="bg-card p-5 rounded-2xl border border-border hover:shadow-lg transition-all hover:scale-105"
              data-testid="button-transactions"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center mb-3 shadow-md">
                <span className="material-icons text-white text-2xl leading-none">receipt_long</span>
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm mb-1">History</p>
                <p className="text-xs text-muted-foreground">{transactions.length} records</p>
              </div>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setLocation("/exchange")}
              className="bg-card p-5 rounded-2xl border border-border hover:shadow-lg transition-all hover:scale-105"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center mb-3 shadow-md">
                <span className="material-icons text-white text-2xl leading-none">currency_exchange</span>
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm mb-1">Exchange</p>
                <p className="text-xs text-muted-foreground">Multi-currency</p>
              </div>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setLocation("/support")}
              className="bg-card p-5 rounded-2xl border border-border hover:shadow-lg transition-all hover:scale-105"
              data-testid="button-support"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center mb-3 shadow-md">
                <span className="material-icons text-white text-2xl leading-none">support_agent</span>
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm mb-1">Support</p>
                <p className="text-xs text-muted-foreground">24/7 help</p>
              </div>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setLocation("/status")}
              className="bg-card p-5 rounded-2xl border border-border hover:shadow-lg transition-all hover:scale-105"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center mb-3 shadow-md">
                <span className="material-icons text-white text-2xl leading-none">health_and_safety</span>
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm mb-1">System Status</p>
                <p className="text-xs text-muted-foreground">Service health</p>
              </div>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setLocation("/settings")}
              className="bg-card p-5 rounded-2xl border border-border hover:shadow-lg transition-all hover:scale-105"
              data-testid="button-settings"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center mb-3 shadow-md">
                <span className="material-icons text-white text-2xl leading-none">settings</span>
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm mb-1">Settings</p>
                <p className="text-xs text-muted-foreground">Preferences & security</p>
              </div>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setLocation("/loans")}
              className="bg-card p-5 rounded-2xl border border-border hover:shadow-lg transition-all hover:scale-105"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center mb-3 shadow-md">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm mb-1">Loans</p>
                <p className="text-xs text-muted-foreground">Borrow easily</p>
              </div>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setLocation("/api-service")}
              className="bg-card p-5 rounded-2xl border border-border hover:shadow-lg transition-all hover:scale-105"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center mb-3 shadow-md">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm mb-1">API Services</p>
                <p className="text-xs text-muted-foreground">Generate & manage keys</p>
              </div>
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
                      {transaction.type === 'receive' || transaction.type === 'deposit' ? '+' : '-'}
                      {transaction.currency?.toUpperCase() === 'KES' ? 'KSh ' : '$'}{transaction.amount}
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
    </div>
  );
}
