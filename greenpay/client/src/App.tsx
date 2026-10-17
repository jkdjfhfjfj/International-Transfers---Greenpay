import { Switch, Route, useLocation } from "wouter";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { TalkToUs } from "@/components/talk-to-us";
import DesktopSidebar from "@/components/desktop-sidebar";
import DesktopTopbar from "@/components/desktop-topbar";
import LoadingScreen from "@/components/loading-screen";
import BottomNavigation from "@/components/bottom-navigation";
import { PWAInstallPrompt } from "@/components/pwa-install";
import { OfflineIndicator } from "@/components/offline-indicator";
import { useFCM } from "@/hooks/use-fcm";
import { useSystemSettings } from "@/hooks/use-system-settings";
import { useMaintenanceState } from "@/hooks/use-maintenance";
import { Smartphone } from "lucide-react";

const lazyPage = (
  loader: () => Promise<{ default: React.ComponentType<any> }>,
) => lazy(loader) as unknown as React.ComponentType<any>;

const NotFound = lazyPage(() => import("@/pages/not-found"));
const SplashPage = lazyPage(() => import("@/pages/splash"));
const LoginPage = lazyPage(() => import("@/pages/auth/login"));
const SignupPage = lazyPage(() => import("@/pages/auth/signup"));
const OtpVerificationPage = lazyPage(() => import("@/pages/auth/otp-verification"));
const GoogleCompletePage = lazyPage(() => import("@/pages/auth/google-complete"));
const KycVerificationPage = lazyPage(() => import("@/pages/auth/kyc-verification"));
const VirtualCardPurchasePage = lazyPage(() => import("@/pages/auth/virtual-card-purchase"));
const ForgotPasswordPage = lazyPage(() => import("@/pages/auth/forgot-password"));
const ResetPasswordPage = lazyPage(() => import("@/pages/auth/reset-password"));
const DashboardPage = lazyPage(() => import("@/pages/dashboard"));
const SendMoneyPage = lazyPage(() => import("@/pages/send-money"));
const SendAmountPage = lazyPage(() => import("@/pages/send-amount"));
const SendConfirmPage = lazyPage(() => import("@/pages/send-confirm"));
const ReceiveMoneyPage = lazyPage(() => import("@/pages/receive-money"));
const PaymentRequestsPage = lazyPage(() => import("@/pages/payment-requests"));
const TransactionsPage = lazyPage(() => import("@/pages/transactions"));
const VirtualCardPage = lazyPage(() => import("@/pages/virtual-card"));
const VirtualAccountsPage = lazyPage(() => import("@/pages/virtual-accounts"));
const WalletAccountPage = lazyPage(() => import("@/pages/wallet-account"));
const SettingsPage = lazyPage(() => import("@/pages/settings"));
const SupportPage = lazyPage(() => import("@/pages/support"));
const LiveChatPage = lazyPage(() => import("@/pages/live-chat"));
const DepositPage = lazyPage(() => import("@/pages/deposit"));
const WithdrawPage = lazyPage(() => import("@/pages/withdraw"));
const ExchangePage = lazyPage(() => import("@/pages/exchange"));
const KycPage = lazyPage(() => import("@/pages/kyc"));
const AirtimePage = lazyPage(() => import("@/pages/airtime"));
const BillsPage = lazyPage(() => import("@/pages/bills"));
const MerchantPayPage = lazyPage(() => import("@/pages/merchant-pay"));
const StatusPage = lazyPage(() => import("@/pages/status"));
const MaintenancePage = lazyPage(() => import("@/pages/maintenance"));
const OfflinePage = lazyPage(() => import("@/pages/offline"));
const PaymentCallbackPage = lazyPage(() => import("@/pages/payment-callback"));
const PaymentSuccessPage = lazyPage(() => import("@/pages/payment-success"));
const PaymentFailedPage = lazyPage(() => import("@/pages/payment-failed"));
const PaymentProcessingPage = lazyPage(() => import("@/pages/payment-processing"));
const AdminLogin = lazyPage(() => import("@/pages/admin-login"));
const AdminDashboard = lazyPage(() => import("@/pages/admin-dashboard-new"));
const AdminDashboardPage = lazyPage(() => import("@/pages/admin-dashboard"));
const AdminUsersPage = lazyPage(() => import("@/pages/admin-users"));
const AdminKycPage = lazyPage(() => import("@/pages/admin-kyc"));
const AdminAccountDeletionsPage = lazyPage(() => import("@/pages/admin-account-deletions"));
const AdminAdvancedKycPage = lazyPage(() => import("@/pages/admin-advanced-kyc"));
const AdminRisksPage = lazyPage(() => import("@/pages/admin-risks"));
const AdminTransactionsPage = lazyPage(() => import("@/pages/admin-transactions"));
const AdminWithdrawalsPage = lazyPage(() => import("@/pages/admin-withdrawals"));
const AdminCardsPage = lazyPage(() => import("@/pages/admin-cards"));
const AdminPricingPage = lazyPage(() => import("@/pages/admin-pricing"));
const AdminNotificationsPage = lazyPage(() => import("@/pages/admin-notifications"));
const AdminMailPage = lazyPage(() => import("@/pages/admin-mail"));
const AdminWhatsAppPage = lazyPage(() => import("@/pages/admin-whatsapp"));
const AdminSupportPage = lazyPage(() => import("@/pages/admin-support"));
const AdminTicketsPage = lazyPage(() => import("@/pages/admin-tickets"));
const AdminLogsPage = lazyPage(() => import("@/pages/admin-logs"));
const AdminTemplatesPage = lazyPage(() => import("@/pages/admin-templates"));
const AdminActivityPage = lazyPage(() => import("@/pages/admin-activity"));
const AdminDatabasePage = lazyPage(() => import("@/pages/admin-database"));
const AdminAnalyticsPage = lazyPage(() => import("@/pages/admin-analytics"));
const AdminSystemSettingsPage = lazyPage(() => import("@/pages/admin-system-settings"));
const AdminManualPaymentSettingsPage = lazyPage(() => import("@/pages/admin-manual-payment-settings"));
const AdminPayHeroSettingsPage = lazyPage(() => import("@/pages/admin-payhero-fresh"));
const AdminMessagingSMSPage = lazyPage(() => import("@/pages/admin-messaging-sms"));
const AdminAnnouncementsDBPage = lazyPage(() => import("@/pages/admin-announcements-db"));
const AdminProfilePage = lazyPage(() => import("@/pages/admin-profile"));
const LandingPage = lazyPage(() => import("@/pages/landing/index"));
const SendMoneyLanding = lazyPage(() => import("@/pages/landing/send-money"));
const VirtualCardsLanding = lazyPage(() => import("@/pages/landing/virtual-cards"));
const ExchangeLanding = lazyPage(() => import("@/pages/landing/exchange"));
const HelpLanding = lazyPage(() => import("@/pages/landing/help"));
const AirtimeLanding = lazyPage(() => import("@/pages/landing/airtime"));
const AboutLanding = lazyPage(() => import("@/pages/landing/about"));
const PricingLanding = lazyPage(() => import("@/pages/landing/pricing"));
const SecurityLanding = lazyPage(() => import("@/pages/landing/security"));
const ContactLanding = lazyPage(() => import("@/pages/landing/contact"));
const TermsAndConditionsPage = lazyPage(() => import("@/pages/terms-and-conditions"));
const PrivacyPolicyPage = lazyPage(() => import("@/pages/privacy-policy"));
const UserSupportTickets = lazyPage(() => import("@/pages/user-support-tickets"));
const CryptoPage = lazyPage(() => import("@/pages/crypto"));
const TransferPage = lazyPage(() => import("@/pages/transfer"));
const AnalyticsPage = lazyPage(() => import("@/pages/analytics"));
const AdminDisputesPage = lazyPage(() => import("@/pages/admin-disputes"));
const AdminCryptoPage = lazyPage(() => import("@/pages/admin-crypto"));
const AdminDepositSettingsPage = lazyPage(() => import("@/pages/admin-deposit-settings"));
const AdminWalletsPage = lazyPage(() => import("@/pages/admin-wallets"));
const AdminVirtualAccountsPage = lazyPage(() => import("@/pages/admin-virtual-accounts"));
const AdminBlogsPage = lazyPage(() => import("@/pages/admin-blogs"));
const BlogPage = lazyPage(() => import("@/pages/blog"));

// User Route Guard Component
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) setLocation("/login");
  }, [isAuthenticated, isLoading, setLocation]);

  // Show loading screen while checking authentication
  if (isLoading) {
    return <LoadingScreen />;
  }
  
  if (!isAuthenticated) {
    return <LoadingScreen />;
  }
  
  return <Component />;
}


function Router() {
  return (
    <Suspense fallback={<LoadingScreen />}>
    <Switch>
      <Route path="/" component={SplashPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/signup" component={SignupPage} />
      <Route path="/auth/otp-verification" component={OtpVerificationPage} />
      <Route path="/auth/google/complete" component={GoogleCompletePage} />
      <Route path="/auth/kyc-verification" component={KycVerificationPage} />
      <Route path="/auth/virtual-card-purchase" component={VirtualCardPurchasePage} />
      <Route path="/auth/forgot-password" component={ForgotPasswordPage} />
      <Route path="/auth/reset-password" component={ResetPasswordPage} />
      <Route path="/dashboard">
        <ProtectedRoute component={DashboardPage} />
      </Route>
      <Route path="/send-money" component={SendMoneyPage} />
      <Route path="/send-amount" component={SendAmountPage} />
      <Route path="/send-confirm" component={SendConfirmPage} />
      <Route path="/receive-money" component={ReceiveMoneyPage} />
      <Route path="/payment-requests">
        <ProtectedRoute component={PaymentRequestsPage} />
      </Route>
      <Route path="/pay-to/:userId" component={ReceiveMoneyPage} />
      <Route path="/transactions" component={TransactionsPage} />
      <Route path="/virtual-card">
        <ProtectedRoute component={VirtualCardPage} />
      </Route>
      <Route path="/virtual-accounts">
        <ProtectedRoute component={VirtualAccountsPage} />
      </Route>
      <Route path="/wallet/:walletId">
        <ProtectedRoute component={WalletAccountPage} />
      </Route>
      <Route path="/settings" component={SettingsPage} />
      <Route path="/support" component={SupportPage} />
      <Route path="/support/tickets">
        <ProtectedRoute component={UserSupportTickets} />
      </Route>
      <Route path="/live-chat" component={LiveChatPage} />
      <Route path="/deposit" component={DepositPage} />
      <Route path="/withdraw" component={WithdrawPage} />
      <Route path="/exchange" component={ExchangePage} />
      <Route path="/kyc" component={KycPage} />
      <Route path="/kyc-callback" component={() => {
        const [, setLocation] = useLocation();
        useEffect(() => {
          const params = new URLSearchParams(window.location.search);
          const status = params.get("status");
          setLocation("/kyc");
        }, []);
        return null;
      }} />
      <Route path="/airtime" component={AirtimePage} />
      <Route path="/bills" component={BillsPage} />
      <Route path="/merchant-pay">
        <ProtectedRoute component={MerchantPayPage} />
      </Route>
      <Route path="/status" component={StatusPage} />
      <Route path="/payment-callback" component={PaymentCallbackPage} />
      <Route path="/payment-success" component={PaymentSuccessPage} />
      <Route path="/payment-failed" component={PaymentFailedPage} />
      <Route path="/payment-processing" component={PaymentProcessingPage} />
      {/* Main marketing landing page */}
      <Route path="/landing" component={LandingPage} />
      {/* Public SEO landing pages */}
      <Route path="/features/send-money" component={SendMoneyLanding} />
      <Route path="/features/virtual-cards" component={VirtualCardsLanding} />
      <Route path="/features/exchange" component={ExchangeLanding} />
      <Route path="/features/airtime" component={AirtimeLanding} />
      <Route path="/help" component={HelpLanding} />
      <Route path="/about" component={AboutLanding} />
      <Route path="/pricing" component={PricingLanding} />
      <Route path="/security" component={SecurityLanding} />
      <Route path="/contact" component={ContactLanding} />
      <Route path="/terms" component={TermsAndConditionsPage} />
      <Route path="/privacy" component={PrivacyPolicyPage} />
      <Route path="/blog" component={BlogPage} />
      <Route path="/blog/:slug" component={BlogPage} />
      <Route path="/crypto">
        <ProtectedRoute component={CryptoPage} />
      </Route>
      <Route path="/transfer">
        <ProtectedRoute component={TransferPage} />
      </Route>
      <Route path="/analytics">
        <ProtectedRoute component={AnalyticsPage} />
      </Route>
      {/* Admin routes — auth handled inside each page via AdminShell */}
      <Route path="/admin-login" component={AdminLogin} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/home" component={AdminDashboardPage} />
      <Route path="/admin/users" component={AdminUsersPage} />
      <Route path="/admin/account-deletions" component={AdminAccountDeletionsPage} />
      <Route path="/admin/kyc" component={AdminKycPage} />
      <Route path="/admin/advanced-kyc" component={AdminAdvancedKycPage} />
      <Route path="/admin/risks" component={AdminRisksPage} />
      <Route path="/admin/transactions" component={AdminTransactionsPage} />
      <Route path="/admin/withdrawals" component={AdminWithdrawalsPage} />
      <Route path="/admin/cards" component={AdminCardsPage} />
      <Route path="/admin/pricing" component={AdminPricingPage} />
      <Route path="/admin/notifications" component={AdminNotificationsPage} />
      <Route path="/admin/mail" component={AdminMailPage} />
      <Route path="/admin/whatsapp" component={AdminWhatsAppPage} />
      <Route path="/admin/support" component={AdminSupportPage} />
      <Route path="/admin/tickets" component={AdminTicketsPage} />
      <Route path="/admin/logs" component={AdminLogsPage} />
      <Route path="/admin/templates" component={AdminTemplatesPage} />
      <Route path="/admin/activity" component={AdminActivityPage} />
      <Route path="/admin/database" component={AdminDatabasePage} />
      <Route path="/admin/analytics" component={AdminAnalyticsPage} />
      <Route path="/admin/settings" component={AdminSystemSettingsPage} />
      <Route path="/admin/manual-payment" component={AdminManualPaymentSettingsPage} />
      <Route path="/admin/payhero-settings" component={AdminPayHeroSettingsPage} />
      <Route path="/admin/messaging" component={AdminMessagingSMSPage} />
      <Route path="/admin/announcements" component={AdminAnnouncementsDBPage} />
      <Route path="/admin/profile" component={AdminProfilePage} />
      <Route path="/admin/disputes" component={AdminDisputesPage} />
      <Route path="/admin/crypto" component={AdminCryptoPage} />
      <Route path="/admin/deposit-settings" component={AdminDepositSettingsPage} />
      <Route path="/admin/wallets" component={AdminWalletsPage} />
      <Route path="/admin/virtual-accounts" component={AdminVirtualAccountsPage} />
      <Route path="/admin/blogs" component={AdminBlogsPage} />
      <Route component={NotFound} />
    </Switch>
    </Suspense>
  );
}

function MobileOnlyPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
      <div className="max-w-sm space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Smartphone className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Mobile access only</h1>
        <p className="text-sm text-muted-foreground">
          This app is currently optimized for mobile devices. Open Geepay on a phone or smaller screen to continue.
        </p>
      </div>
    </div>
  );
}

function AppContent() {
  const [location] = useLocation();
  const { isAuthenticated, isLoading, user } = useAuth();
  const { getMaintenanceMode, getDesktopAccessEnabled } = useSystemSettings();
  const maintenanceState = useMaintenanceState();
  const [isDesktopViewport, setIsDesktopViewport] = useState(false);
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== "undefined" && !navigator.onLine,
  );
  
  // Initialize FCM push notifications
  useFCM(isAuthenticated);

  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const updateViewport = () => setIsDesktopViewport(mediaQuery.matches);
    updateViewport();
    mediaQuery.addEventListener("change", updateViewport);
    return () => mediaQuery.removeEventListener("change", updateViewport);
  }, []);

  // Use the browser Notification API for web notifications. This is
  // intentionally separate from Capacitor/FCM; the persisted notification
  // feed remains the source of truth after refresh.
  useEffect(() => {
    if (!isAuthenticated || !("Notification" in window)) return;
    if (Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, [isAuthenticated]);

  // Web notifications are delivered from the same persisted notification feed
  // used by the bell menu, so account actions remain visible after refresh.
  const lastNotificationIds = useRef<Set<string> | null>(null);
  const { data: browserNotificationResponse } = useQuery({
    queryKey: [`/api/notifications/${user?.id}`],
    enabled: !!user?.id,
    refetchInterval: 15000,
    staleTime: 0,
  });
  useEffect(() => {
    if (!user?.id) {
      lastNotificationIds.current = null;
      return;
    }
    const items = (browserNotificationResponse as any)?.notifications || [];
    const ids = new Set<string>(items.map((item: any) => String(item.id)));
    if (!lastNotificationIds.current) {
      lastNotificationIds.current = ids;
      return;
    }
    if (
      "Notification" in window &&
      Notification.permission === "granted" &&
      "serviceWorker" in navigator
    ) {
      const newItems = items
        .filter((item: any) => !lastNotificationIds.current?.has(item.id) && !item.isRead)
        .slice(0, 3);

      if (newItems.length > 0) {
        navigator.serviceWorker.ready
          .then((registration) =>
            Promise.all(
              newItems.map((item: any) =>
                registration.showNotification(item.title, {
                  body: item.message,
                  tag: String(item.id),
                  icon: "/greenpay-logo.png",
                  data: { actionUrl: item.actionUrl || "/" },
                }),
              ),
            ),
          )
          .catch((error) => {
            // Notification permission can be revoked while the app is open.
            console.warn("Unable to show browser notification:", error);
          });
      }
    }
    lastNotificationIds.current = ids;
  }, [browserNotificationResponse, user?.id]);
  
  // Landing/public pages and admin pages that should not show user widgets
  const landingPages = ['/', '/landing', '/login', '/signup', '/splash', '/help', '/about', '/pricing', '/security', '/contact', '/terms', '/privacy', '/send-money', '/virtual-cards', '/exchange', '/airtime', '/admin-login'];
  const isLandingPage = landingPages.some(page => location === page || location.startsWith(page + '/'));
  // Keep administrators in the admin panel while maintenance is active.
  // Every other route is replaced by the maintenance screen once either the
  // settings endpoint or any maintenance 503 confirms the server state.
  const isAdminPage =
    location === "/admin-login" ||
    location === "/admin" ||
    location.startsWith("/admin/");
  const showMaintenance =
    !isAdminPage && (maintenanceState.active || (!isLoading && getMaintenanceMode()));
  const showMobileOnly =
    !isAdminPage &&
    !isLandingPage &&
    isDesktopViewport &&
    !getDesktopAccessEnabled();

  const isSupportComposerPage = location.startsWith('/live-chat') || location.startsWith('/support/tickets');

  // Only show user widgets on authenticated non-admin pages where they won't cover message composers
  const shouldShowWidgets = isAuthenticated && !isLandingPage && !isAdminPage && !isSupportComposerPage;

  const showAppShell =
    isAuthenticated && !isLandingPage && !isAdminPage && !showMaintenance && !showMobileOnly;

  return (
    <TooltipProvider>
      <Toaster />
      <OfflineIndicator />
      {showAppShell && <DesktopSidebar />}
      {showAppShell && <DesktopTopbar />}
      <div className={showAppShell ? "md:pl-64" : ""}>
        {isOffline ? (
          <OfflinePage />
        ) : showMaintenance ? (
          <MaintenancePage />
        ) : showMobileOnly ? (
          <MobileOnlyPage />
        ) : (
          <Router />
        )}
      </div>
      {!isAdminPage && !showMaintenance && <BottomNavigation />}
      {!isAdminPage && !showMaintenance && <PWAInstallPrompt />}
      {shouldShowWidgets && !showMaintenance && <TalkToUs />}
    </TooltipProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
