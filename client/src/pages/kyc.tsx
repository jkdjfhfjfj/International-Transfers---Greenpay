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
  const { user, login } = useAuth();
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

  // Query current didit session status
  const { data: diditStatusData, refetch: refetchStatus } = useQuery<{
    status: string | null;
    kycStatus: KycStatus;
    sessionId: string | null;
    docStatus: string | null;
  }>({
    queryKey: ["/api/kyc/didit/status"],
    enabled: !!user?.id && (isPending || isNotStarted || !!sessionId),
    refetchInterval: isPolling ? 5000 : false,
  });

  const isReVerificationRequested = isNotStarted && diditStatusData?.docStatus === "re_verification_requested";

  // Stop polling when we reach a terminal status
  useEffect(() => {
    const ds = diditStatusData?.status;
    if (ds && ["Approved", "Declined", "Expired", "Abandoned", "Kyc Expired"].includes(ds)) {
      setIsPolling(false);
      setShowIframe(false);

      // Sync user auth state
      const newKycStatus = diditStatusData?.kycStatus;
      if (newKycStatus && user && newKycStatus !== user.kycStatus) {
        login({ ...user, kycStatus: newKycStatus } as any);
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
  }, [diditStatusData?.status]);

  // Start a new didit verification session
  const startMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/kyc/didit/start");
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to start verification");
      }
      return res.json() as Promise<{ sessionId: string; url: string; status: string }>;
    },
    onSuccess: (data) => {
      setSessionId(data.sessionId);
      setSessionUrl(data.url);
      setShowIframe(true);
      setIsPolling(true);
      // Update user status to pending in auth context
      if (user) login({ ...user, kycStatus: "pending" } as any);
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
    <div className="min-h-screen bg-background pb-28">
      <WavyHeader size="sm" />

      <div className="max-w-md mx-auto px-4 pt-6 space-y-5">

        {/* Page Title */}
        <div>
          <h1 className="text-xl font-bold text-foreground">Identity Verification</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Verify your identity to unlock all Geepay features
          </p>
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
            className="bg-card border border-border rounded-2xl p-5 space-y-4"
          >
            <h2 className="font-semibold text-sm text-foreground">What you'll need</h2>
            <div className="space-y-3">
              {[
                {
                  icon: "🪪",
                  title: "Government-issued ID",
                  desc: "National ID, passport, or driver's license",
                },
                {
                  icon: "🤳",
                  title: "Selfie / Liveness check",
                  desc: "A quick photo to confirm it's you",
                },
                {
                  icon: "💡",
                  title: "Good lighting & clear images",
                  desc: "Ensure documents are clearly visible",
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
            <div className="pt-2 border-t border-border">
              <p className="text-xs font-medium text-muted-foreground mb-2">What you unlock</p>
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
              ) : isPending && diditStatusData?.sessionId ? (
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
                    onClick={() => refetchStatus()}
                    variant="ghost"
                    size="sm"
                    className="w-full"
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Check Status
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

              <p className="text-xs text-center text-muted-foreground mt-3">
                Powered by Didit — secure, AI-assisted identity verification in under 2 minutes
              </p>
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
          <p className="text-xs text-muted-foreground">
            Your data is encrypted and processed securely. We never store your ID documents — they are verified instantly and discarded.
          </p>
        </div>
      </div>

      {/* Didit Verification Iframe Modal */}
      <AnimatePresence>
        {showIframe && sessionUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background flex flex-col"
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
              className="flex-1 w-full border-0"
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
