import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { WhatsAppSupportFAB } from "@/components/whatsapp-support-fab";
import NotFound from "@/pages/not-found";
import SplashPage from "@/pages/splash";
import LoginPage from "@/pages/auth/login";
import SignupPage from "@/pages/auth/signup";
import OtpVerificationPage from "@/pages/auth/otp-verification";
import KycVerificationPage from "@/pages/auth/kyc-verification";
import VirtualCardPurchasePage from "@/pages/auth/virtual-card-purchase";
import ForgotPasswordPage from "@/pages/auth/forgot-password";
import ResetPasswordPage from "@/pages/auth/reset-password";
import DashboardPage from "@/pages/dashboard";
import SendMoneyPage from "@/pages/send-money";
import SendAmountPage from "@/pages/send-amount";
import SendConfirmPage from "@/pages/send-confirm";
import ReceiveMoneyPage from "@/pages/receive-money";
import TransactionsPage from "@/pages/transactions";
import VirtualCardPage from "@/pages/virtual-card";
import SettingsPage from "@/pages/settings";
import SupportPage from "@/pages/support";
import LiveChatPage from "@/pages/live-chat";
import DepositPage from "@/pages/deposit";
import WithdrawPage from "@/pages/withdraw";
import ExchangePage from "@/pages/exchange";
import KycPage from "@/pages/kyc";
import AirtimePage from "@/pages/airtime";
import BillsPage from "@/pages/bills";
import StatusPage from "@/pages/status";
import LoadingScreen from "@/components/loading-screen";
import BottomNavigation from "@/components/bottom-navigation";
import { PWAInstallPrompt } from "@/components/pwa-install";
import { AIChatWidget } from "@/components/ai-chat-widget";
import PaymentCallbackPage from "@/pages/payment-callback";
import PaymentSuccessPage from "@/pages/payment-success";
import PaymentFailedPage from "@/pages/payment-failed";
import PaymentProcessingPage from "@/pages/payment-processing";
import AdminLogin from "@/pages/admin-login";
import AdminDashboard from "@/pages/admin-dashboard-new";
import AdminDashboardPage from "@/pages/admin-dashboard";
import AdminUsersPage from "@/pages/admin-users";
import AdminKycPage from "@/pages/admin-kyc";
import AdminTransactionsPage from "@/pages/admin-transactions";
import AdminWithdrawalsPage from "@/pages/admin-withdrawals";
import AdminCardsPage from "@/pages/admin-cards";
import AdminPricingPage from "@/pages/admin-pricing";
import AdminNotificationsPage from "@/pages/admin-notifications";
import AdminMailPage from "@/pages/admin-mail";
import AdminWhatsAppPage from "@/pages/admin-whatsapp";
import AdminSupportPage from "@/pages/admin-support";
import AdminTicketsPage from "@/pages/admin-tickets";
import AdminLogsPage from "@/pages/admin-logs";
import AdminTemplatesPage from "@/pages/admin-templates";
import AdminActivityPage from "@/pages/admin-activity";
import AdminDatabasePage from "@/pages/admin-database";
import AdminAnalyticsPage from "@/pages/admin-analytics";
import AdminSystemSettingsPage from "@/pages/admin-system-settings";
import AdminManualPaymentSettingsPage from "@/pages/admin-manual-payment-settings";
import AdminPayHeroSettingsPage from "@/pages/admin-payhero-fresh";
import AdminMessagingSMSPage from "@/pages/admin-messaging-sms";
import AdminAnnouncementsDBPage from "@/pages/admin-announcements-db";
import AdminProfilePage from "@/pages/admin-profile";
import SendMoneyLanding from "@/pages/landing/send-money";
import VirtualCardsLanding from "@/pages/landing/virtual-cards";
import ExchangeLanding from "@/pages/landing/exchange";
import HelpLanding from "@/pages/landing/help";
import AirtimeLanding from "@/pages/landing/airtime";
import AboutLanding from "@/pages/landing/about";
import PricingLanding from "@/pages/landing/pricing";
import SecurityLanding from "@/pages/landing/security";
import ContactLanding from "@/pages/landing/contact";
import TermsAndConditionsPage from "@/pages/terms-and-conditions";
import PrivacyPolicyPage from "@/pages/privacy-policy";
import LoansPage from "@/pages/loans";
import APIServicePage from "@/pages/api-service";
import ApiDocumentationPage from "@/pages/api-documentation";
import UserSupportTickets from "@/pages/user-support-tickets";
import { useFCM } from "@/hooks/use-fcm";

// User Route Guard Component
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  
  // Show loading screen while checking authentication
  if (isLoading) {
    return <LoadingScreen />;
  }
  
  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    setLocation("/login");
    return null;
  }
  
  return <Component />;
}


function Router() {
  return (
    <Switch>
      <Route path="/" component={SplashPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/signup" component={SignupPage} />
      <Route path="/auth/otp-verification" component={OtpVerificationPage} />
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
      <Route path="/pay-to/:userId" component={ReceiveMoneyPage} />
      <Route path="/transactions" component={TransactionsPage} />
      <Route path="/virtual-card">
        <ProtectedRoute component={VirtualCardPage} />
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
      <Route path="/airtime" component={AirtimePage} />
      <Route path="/bills" component={BillsPage} />
      <Route path="/status" component={StatusPage} />
      <Route path="/payment-callback" component={PaymentCallbackPage} />
      <Route path="/payment-success" component={PaymentSuccessPage} />
      <Route path="/payment-failed" component={PaymentFailedPage} />
      <Route path="/payment-processing" component={PaymentProcessingPage} />
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
      <Route path="/loans" component={LoansPage} />
      <Route path="/api-service" component={APIServicePage} />
      <Route path="/api-documentation" component={ApiDocumentationPage} />
      {/* Admin routes — auth handled inside each page via AdminShell */}
      <Route path="/admin-login" component={AdminLogin} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/home" component={AdminDashboardPage} />
      <Route path="/admin/users" component={AdminUsersPage} />
      <Route path="/admin/kyc" component={AdminKycPage} />
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
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const [location] = useLocation();
  const { isAuthenticated } = useAuth();
  
  // Initialize FCM push notifications
  useFCM();
  
  // Landing/public pages and admin pages that should not show user widgets
  const landingPages = ['/', '/login', '/signup', '/splash', '/help', '/about', '/pricing', '/security', '/contact', '/terms', '/privacy', '/loans', '/api-service', '/api-documentation', '/send-money', '/virtual-cards', '/exchange', '/airtime', '/admin-login'];
  const isLandingPage = landingPages.some(page => location === page || location.startsWith(page + '/'));
  const isAdminPage = location.startsWith('/admin');

  // Only show user widgets on authenticated non-admin pages
  const shouldShowWidgets = isAuthenticated && !isLandingPage && !isAdminPage;

  return (
    <TooltipProvider>
      <Toaster />
      <Router />
      {!isAdminPage && <BottomNavigation />}
      {!isAdminPage && <PWAInstallPrompt />}
      {shouldShowWidgets && (
        <>
          <WhatsAppSupportFAB />
          <AIChatWidget />
        </>
      )}
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
