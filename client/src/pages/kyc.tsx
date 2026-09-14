import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { WavyHeader } from "@/components/wavy-header";
import BottomNavigation from "@/components/bottom-navigation";
import {
  CheckCircle,
  Clock,
  XCircle,
  Shield,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  X,
  Fingerprint,
  AlertCircle,
  Loader2,
} from "lucide-react";

type KycStatus = "not_submitted" | "pending" | "verified" | "rejected";

function StatusBadge({ status }: { status: KycStatus | string }) {
  if (status === "verified")
    return (
      <Badge className="bg-green-500 text-white gap-1">
        <CheckCircle className="w-3 h-3" /> Verified
      </Badge>
    );
  if (status === "pending")
    return (
      <Badge className="bg-amber-500 text-white gap-1">
        <Clock className="w-3 h-3" /> Under Review
      </Badge>
    );
  if (status === "rejected")
    return (
      <Badge variant="destructive" className="gap-1">
        <XCircle className="w-3 h-3" /> Rejected
      </Badge>
    );
  return (
    <Badge variant="outline" className="gap-1 text-muted-foreground">
      Not Started
    </Badge>
  );
}

function DiditStatusLabel({ diditStatus }: { diditStatus?: string }) {
  if (!diditStatus) return null;
  const colorMap: Record<string, string> = {
    "Approved": "text-green-600",
    "Declined": "text-red-600",
    "In Review": "text-amber-600",
    "In Progress": "text-blue-600",
    "Awaiting User": "text-purple-600",
    "Expired": "text-gray-500",
    "Abandoned": "text-gray-500",
  };
  return (
    <span className={`text-xs font-medium ${colorMap[diditStatus] || "text-muted-foreground"}`}>
      {diditStatus}
    </span>
  );
}

export default function KYCPage() {
  const [, setLocation] = useLocation();
  const { user, login, refreshUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [sessionUrl, setSessionUrl] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showIframe, setShowIframe] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const kycStatus = (user?.kycStatus || "not_submitted") as KycStatus;
  const isVerified = kycStatus === "verified";
  const isPending = kycStatus === "pending";
  const isRejected = kycStatus === "rejected";
  const isNotStarted = kycStatus === "not_submitted";
  const hasResumableSession = Boolean(sessionId && sessionUrl);

  // Query current didit session status
  const { data: diditStatusData, refetch: refetchStatus, isFetching: isStatusFetching } = useQuery<{
    status: string | null;
    kycStatus: KycStatus;
    sessionId: string | null;
    sessionUrl: string | null;
    docStatus: string | null;
    extractedData?: Record<string, string | null> | null;
  }>({
    queryKey: ["/api/kyc/didit/status"],
    enabled: !!user?.id && (isPending || isNotStarted || !!sessionId),
    refetchInterval: isPolling ? 5000 : false,
  });

  const isReVerificationRequested = isNotStarted && diditStatusData?.docStatus === "re_verification_requested";

  // Hydrate the resumable session after a page reload.
  useEffect(() => {
    if (diditStatusData?.sessionId) setSessionId(diditStatusData.sessionId);
    if (diditStatusData?.sessionUrl) setSessionUrl(diditStatusData.sessionUrl);
  }, [diditStatusData?.sessionId, diditStatusData?.sessionUrl]);

  // Stop polling when we reach a terminal status
  useEffect(() => {
    const ds = diditStatusData?.status;
    if (ds && ["Approved", "Declined", "Expired", "Abandoned", "Kyc Expired"].includes(ds)) {
      setIsPolling(false);
      setShowIframe(false);

      // Sync status and webhook-extracted identity into the authenticated user.
      const newKycStatus = diditStatusData?.kycStatus;
      if (newKycStatus && user) {
        const extracted = diditStatusData?.extractedData || {};
        login({
          ...user,
          kycStatus: newKycStatus,
          kycFullName: extracted.fullName || user.kycFullName,
          kycDateOfBirth: extracted.dateOfBirth || user.kycDateOfBirth,
          kycIdNumber: extracted.idNumber || user.kycIdNumber,
          kycNationality: extracted.nationality || user.kycNationality,
          kycGender: extracted.gender || user.kycGender,
          kycAddress: extracted.address || user.kycAddress,
          kycDocumentType: extracted.documentType || user.kycDocumentType,
          kycIdExpiryDate: extracted.expiryDate || user.kycIdExpiryDate,
          kycIssuingCountry: extracted.issuingCountry || user.kycIssuingCountry,
        } as any);
        void refreshUser();
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
        toast({
          title: ds === "Approved" ? "KYC Verified! 🎉" : "Verification Update",
          description:
            ds === "Approved"
              ? "Your identity has been successfully verified."
              : ds === "Declined"
              ? "Verification declined. Please try again with clearer documents."
              : "Session expired. Please start a new verification.",
          variant: ds === "Approved" ? "default" : "destructive",
        });
      }
    }
  }, [diditStatusData?.status, diditStatusData?.extractedData, user?.id]);

  // Start a new didit verification session
  const startMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/kyc/didit/start");
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to start verification");
      }
      return res.json() as Promise<{ sessionId: string; url: string; status: string; kycStatus: KycStatus }>;
    },
    onSuccess: (data) => {
      setSessionId(data.sessionId);
      setSessionUrl(data.url);
      setShowIframe(true);
      setIsPolling(true);
      // Keep Didit's initial "Not Started" state separate from an active review.
      if (user) login({ ...user, kycStatus: data.kycStatus } as any);
    },
    onError: (e: any) => {
      toast({ title: "Failed to Start", description: e.message, variant: "destructive" });
    },
  });

  const handleCloseIframe = () => {
    setShowIframe(false);
    // Keep polling in background to catch webhook-updated status
    refetchStatus();
  };

  const handleCheckStatus = async () => {
    const result = await refetchStatus();
    const nextStatus = result.data?.kycStatus;
    const statusCheckFailed = Boolean(result.error);
    if (nextStatus && user) {
      const extracted = result.data?.extractedData || {};
      login({
        ...user,
        kycStatus: nextStatus,
        kycFullName: extracted.fullName || user.kycFullName,
        kycDateOfBirth: extracted.dateOfBirth || user.kycDateOfBirth,
        kycIdNumber: extracted.idNumber || user.kycIdNumber,
        kycNationality: extracted.nationality || user.kycNationality,
        kycGender: extracted.gender || user.kycGender,
        kycAddress: extracted.address || user.kycAddress,
        kycDocumentType: extracted.documentType || user.kycDocumentType,
        kycIdExpiryDate: extracted.expiryDate || user.kycIdExpiryDate,
        kycIssuingCountry: extracted.issuingCountry || user.kycIssuingCountry,
      } as any);
      void refreshUser();
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    }
    toast({
      title: statusCheckFailed ? "Status check failed" : "Status refreshed",
      description: statusCheckFailed
        ? "We could not reach the verification provider. Please try again."
        : nextStatus === "verified"
        ? "Your identity verification is complete."
        : "Your latest verification status has been checked.",
      variant: statusCheckFailed ? "destructive" : "default",
    });
  };

  const handleOpenExternal = () => {
    if (sessionUrl) window.open(sessionUrl, "_blank");
  };

  const handleStartVerification = () => {
    startMutation.mutate();
  };

  const handleRetry = () => {
    setSessionUrl(null);
    setSessionId(null);
    startMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-background pb-28 md:min-h-[calc(100dvh-4rem)] md:pb-8">
      <WavyHeader size="sm" />

      <div className="mx-auto max-w-6xl space-y-5 px-4 pt-6 md:px-8 md:pt-10">

        {/* Page Title */}
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">Account security</p>
            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">Identity verification</h1>
            <p className="mt-1 text-sm text-muted-foreground">Complete a secure Didit check to unlock your account.</p>
          </div>
        </div>

        {/* Re-verification notice */}
        {isReVerificationRequested && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-4 border bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm text-orange-800 dark:text-orange-200">Re-verification Required</p>
              <p className="text-xs text-orange-700 dark:text-orange-300 mt-0.5">
                An admin has requested that you complete a new identity verification. Please start the process below.
              </p>
            </div>
          </motion.div>
        )}

        {/* Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl p-5 border ${
            isVerified
              ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
              : isPending
              ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
              : isRejected
              ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
              : isReVerificationRequested
              ? "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800"
              : "bg-card border-border"
          }`}
        >
          <div className="flex items-center gap-4">
            <div
              className={`p-3 rounded-xl ${
                isVerified
                  ? "bg-green-100 dark:bg-green-800/30"
                  : isPending
                  ? "bg-amber-100 dark:bg-amber-800/30"
                  : isRejected
                  ? "bg-red-100 dark:bg-red-800/30"
                  : isReVerificationRequested
                  ? "bg-orange-100 dark:bg-orange-800/30"
                  : "bg-muted"
              }`}
            >
              {isVerified ? (
                <ShieldCheck className="w-7 h-7 text-green-600" />
              ) : isPending ? (
                <Clock className="w-7 h-7 text-amber-600 animate-pulse" />
              ) : isRejected ? (
                <XCircle className="w-7 h-7 text-red-600" />
              ) : isReVerificationRequested ? (
                <AlertCircle className="w-7 h-7 text-orange-500" />
              ) : (
                <Shield className="w-7 h-7 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="font-semibold text-foreground">
                  {isVerified
                    ? "Verified"
                    : isPending
                    ? "Under Review"
                    : isRejected
                    ? "Verification Failed"
                    : isReVerificationRequested
                    ? "Re-verification Required"
                    : "Not Verified"}
                </p>
                <StatusBadge status={kycStatus} />
              </div>
              <p className="text-xs text-muted-foreground">
                {isVerified
                  ? "Your identity is confirmed. All features unlocked."
                  : isPending
                  ? "Your documents are being reviewed. Usually completes within minutes."
                  : isRejected
                  ? "Verification was not successful. You can try again."
                  : isReVerificationRequested
                  ? "Please complete a fresh verification as requested by our team."
                  : "Complete verification to send money and access all features."}
              </p>
              {diditStatusData?.status && !isVerified && !isReVerificationRequested && (
                <div className="mt-1">
                  <DiditStatusLabel diditStatus={diditStatusData.status} />
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* What You Need — only show if not verified */}
        {!isVerified && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card border border-border rounded-2xl p-5 space-y-4 md:grid md:grid-cols-2 md:gap-x-8 md:space-y-0"
          >
            <h2 className="font-semibold text-sm text-foreground md:col-span-2">Before you start</h2>
            <div className="space-y-3 md:mt-4">
              {[
                {
                  icon: "🪪",
                  title: "Government-issued ID",
                  desc: "Passport, national ID, or driver's license",
                },
                {
                  icon: "🤳",
                  title: "Selfie / Liveness check",
                  desc: "A quick liveness check",
                },
                {
                  icon: "💡",
                  title: "Good lighting & clear images",
                  desc: "Use a well-lit space",
                },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-xl mt-0.5">{item.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Features unlocked */}
            <div className="pt-2 border-t border-border md:mt-4 md:border-t-0 md:border-l md:pl-8">
              <p className="text-xs font-medium text-muted-foreground mb-2">After verification</p>
              <div className="grid grid-cols-2 gap-2">
                {["Send money", "Receive payments", "Virtual card", "Higher limits"].map((f) => (
                  <div key={f} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Action Button */}
        <AnimatePresence mode="wait">
          {!isVerified && (
            <motion.div
              key="action"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.15 }}
            >
              {isRejected ? (
                <Button
                  onClick={handleRetry}
                  disabled={startMutation.isPending}
                  className="w-full rounded-xl h-12 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold"
                >
                  {startMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Starting...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4" /> Retry Verification
                      <ArrowRight className="w-4 h-4 ml-auto" />
                    </span>
                  )}
                </Button>
              ) : hasResumableSession ? (
                <div className="space-y-2">
                  <Button
                    onClick={() => { setShowIframe(true); setIsPolling(true); }}
                    variant="outline"
                    className="w-full rounded-xl h-12"
                  >
                    <span className="flex items-center gap-2">
                      <ExternalLink className="w-4 h-4" /> Continue Verification
                    </span>
                  </Button>
                  <Button
                    onClick={handleCheckStatus}
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    disabled={isStatusFetching}
                    data-testid="button-check-kyc-status"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isStatusFetching ? "animate-spin" : ""}`} />
                    {isStatusFetching ? "Checking..." : "Check Status"}
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={handleStartVerification}
                  disabled={startMutation.isPending}
                  className="w-full rounded-xl h-12 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold"
                >
                  {startMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Preparing...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Fingerprint className="w-4 h-4" /> Start Verification
                      <ArrowRight className="w-4 h-4 ml-auto" />
                    </span>
                  )}
                </Button>
              )}

              <p className="text-xs text-center text-muted-foreground mt-3">Secure verification by Didit.</p>
            </motion.div>
          )}

          {isVerified && (
            <motion.div
              key="verified"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-6 text-center space-y-3"
            >
              <div className="w-16 h-16 bg-green-100 dark:bg-green-800/30 rounded-full flex items-center justify-center mx-auto">
                <ShieldCheck className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-bold text-green-800 dark:text-green-200 text-lg">
                Fully Verified!
              </h3>
              <p className="text-sm text-green-700 dark:text-green-300">
                Your identity is confirmed. You have access to all Geepay features.
              </p>
              <Button
                onClick={() => setLocation("/dashboard")}
                className="bg-green-600 hover:bg-green-700 text-white rounded-xl"
              >
                Go to Dashboard
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Security note */}
        <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-xl">
          <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">Your verification is encrypted and handled securely by Didit.</p>
        </div>
      </div>

      {/* Didit Verification Iframe Modal */}
      <AnimatePresence>
        {showIframe && sessionUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex min-h-0 flex-col overflow-hidden bg-background"
          >
            {/* Top bar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card shrink-0">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">Identity Verification</span>
              </div>
              <div className="flex items-center gap-2">
                {isPolling && (
                  <div className="flex items-center gap-1.5 text-xs text-amber-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    Checking...
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleOpenExternal}
                  title="Open in browser"
                  className="h-8 w-8"
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCloseIframe}
                  className="h-8 w-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Iframe */}
            <iframe
              src={sessionUrl}
              className="min-h-0 flex-1 w-full border-0"
              allow="camera; microphone; geolocation"
              title="Identity Verification"
            />

            {/* Bottom hint */}
            <div className="px-4 py-2 border-t border-border bg-muted/30 shrink-0">
              <p className="text-xs text-center text-muted-foreground">
                Complete all steps, then close this window to see your result
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNavigation />
    </div>
  );
}
