import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, KeyRound } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { WavyHeader } from "@/components/wavy-header";

export default function ForgotPasswordPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [contact, setContact] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [sentVia, setSentVia] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!contact.trim()) {
      setError("Please enter your phone number or email address");
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest("POST", "/api/auth/forgot-password", {
        contact: contact.trim(),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("resetPhone", contact.trim());
        setSuccess(true);
        setSentVia(data.sentVia || data.contact);
        toast({
          title: "Reset code sent",
          description: "Check your phone or email for the code.",
        });
        setTimeout(() => {
          setLocation("/auth/reset-password");
        }, 2000);
      } else {
        const data = await response.json();
        setError(data.message || "Failed to send reset code");
      }
    } catch (error: any) {
      setError(error.message || "Failed to send reset code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <WavyHeader
        size="sm"
        onBack={() => setLocation("/login")}
      />

      <div className="flex-1 p-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-sm mx-auto"
        >
          {/* Icon + heading */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: '#16a34a' }}
            >
              <KeyRound className="w-7 h-7 text-white" />
            </motion.div>
            <h2 className="text-2xl font-bold mb-2">Reset Password</h2>
            <p className="text-muted-foreground text-sm">
              Enter your phone number or email and we'll send you a reset code
            </p>
          </div>

          {/* Error */}
          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </motion.div>
          )}

          {/* Success */}
          {success && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4">
              <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
                <AlertDescription className="text-green-700 dark:text-green-400">
                  Reset code sent to {sentVia}. Redirecting…
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

          {!success && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="contact" className="text-sm font-medium">
                  Phone Number or Email
                </label>
                <div className="relative">
                  <span className="material-icons absolute left-3 top-3 text-muted-foreground text-xl">
                    contact_phone
                  </span>
                  <Input
                    id="contact"
                    type="text"
                    placeholder="e.g. +254712345678 or email"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    disabled={loading}
                    className="pl-12"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter your registered phone (with country code) or email address
                </p>
              </div>

              <motion.button
                type="submit"
                disabled={loading || !contact.trim()}
                whileTap={{ scale: 0.97 }}
                className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-50"
                style={{ background: '#16a34a' }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending…
                  </span>
                ) : (
                  "Send Reset Code"
                )}
              </motion.button>
            </form>
          )}

          <button
            onClick={() => setLocation("/login")}
            className="w-full mt-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to Login
          </button>
        </motion.div>
      </div>
    </div>
  );
}
