import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { WavyHeader } from "@/components/wavy-header";
import { Input } from "@/components/ui/input";
import { verifyBiometric } from "@/lib/webauthn";

interface LoginChallenge {
  requiresPin?: boolean;
  requiresAuthenticator?: boolean;
  requiresBiometric?: boolean;
  requiresOtp?: boolean;
  otpMethods?: Array<{ id: string; label: string }>;
}

export default function OtpVerificationPage() {
  const [, setLocation] = useLocation();
  const [otp, setOtp] = useState<string[]>(new Array(6).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { toast } = useToast();
  const { login } = useAuth();
  const [userId, setUserId] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [sentVia, setSentVia] = useState<string>("");
  const [challenge, setChallenge] = useState<LoginChallenge | null>(() => {
    try {
      const stored = localStorage.getItem("otpChallengeData");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [challengeMode, setChallengeMode] = useState<"pin" | "authenticator" | "biometric" | "otp" | null>(null);
  const [pin, setPin] = useState("");
  const [authenticatorCode, setAuthenticatorCode] = useState("");

  useEffect(() => {
    const storedUserId = localStorage.getItem("otpUserId");
    const storedPhone = localStorage.getItem("otpPhone");
    const storedEmail = localStorage.getItem("otpEmail");
    const storedSentVia = localStorage.getItem("otpSentVia");
    let storedChallenge: LoginChallenge | null = null;
    try {
      const rawChallenge = localStorage.getItem("otpChallengeData");
      if (rawChallenge) storedChallenge = JSON.parse(rawChallenge);
    } catch {
      localStorage.removeItem("otpChallengeData");
    }

    if (!storedUserId) {
      toast({
        title: "Session expired",
        description: "Please login again.",
        variant: "destructive",
      });
      setLocation("/login");
      return;
    }

    setUserId(storedUserId);
    setPhone(storedPhone || "");
    setEmail(storedEmail || "");
    setSentVia(storedSentVia || "");
    if (storedChallenge) {
      setChallenge(storedChallenge);
      const choices = [
        storedChallenge.requiresPin && "pin",
        storedChallenge.requiresAuthenticator && "authenticator",
        storedChallenge.requiresBiometric && "biometric",
        ...(storedChallenge.requiresOtp ? (storedChallenge.otpMethods || []).map(() => "otp") : []),
      ].filter(Boolean);
      if (choices.length === 1 && choices[0] !== "otp") {
        setChallengeMode(choices[0] as "pin" | "authenticator" | "biometric" | "otp");
      }
    }

    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [setLocation, toast]);

  const clearChallengeStorage = () => {
    ["otpUserId", "otpPhone", "otpEmail", "otpSentVia", "otpMethod", "otpChallengeData"]
      .forEach((key) => localStorage.removeItem(key));
  };

  const finishLogin = (data: any) => {
    clearChallengeStorage();
    login(data.user);
    toast({ title: "Login successful!", description: "You have been successfully verified and logged in." });
    setTimeout(() => setLocation("/dashboard"), 100);
  };

  const verifyOtpMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await apiRequest("POST", "/api/auth/verify-otp", {
        code,
        userId,
      });
      return response.json();
    },
    onSuccess: finishLogin,
    onError: () => {
      toast({
        title: "Verification failed",
        description: "Invalid or expired OTP code. Please try again.",
        variant: "destructive",
      });

      setOtp(new Array(6).fill(""));
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
    },
  });

  const verifyPinMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/verify-pin", { pin });
      return response.json();
    },
    onSuccess: finishLogin,
    onError: (error: any) => {
      toast({ title: "PIN verification failed", description: error.message || "Invalid PIN. Please try again.", variant: "destructive" });
      setPin("");
    },
  });

  const verifyAuthenticatorMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/verify-authenticator", { code: authenticatorCode });
      return response.json();
    },
    onSuccess: finishLogin,
    onError: (error: any) => {
      toast({ title: "Authenticator verification failed", description: error.message || "Invalid code. Please try again.", variant: "destructive" });
      setAuthenticatorCode("");
    },
  });

  const verifyBiometricMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/biometric/login", await verifyBiometric());
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Biometric verification failed");
      }
      return response.json();
    },
    onSuccess: finishLogin,
    onError: (error: any) => toast({ title: "Biometric verification failed", description: error.message, variant: "destructive" }),
  });

  const requestChallengeOtpMutation = useMutation({
    mutationFn: async (method: string) => {
      const response = await apiRequest("POST", "/api/auth/resend-otp", { method });
      return response.json();
    },
    onSuccess: (data, method) => {
      localStorage.setItem("otpMethod", method);
      localStorage.setItem("otpSentVia", data.sentVia || "");
      setSentVia(data.sentVia || "");
      setOtp(new Array(6).fill(""));
      setChallengeMode("otp");
      toast({ title: "Verification code sent", description: data.message || "Enter the code to continue." });
    },
    onError: (error: any) => toast({ title: "Could not send code", description: error.message || "Please try another method.", variant: "destructive" }),
  });

  const handleChange = (element: HTMLInputElement, index: number) => {
    const digits = element.value.replace(/\D/g, "");
    if (!digits) {
      setOtp([...otp.map((d, idx) => (idx === index ? "" : d))]);
      return;
    }
    if (digits.length > 1) {
      const next = [...otp];
      digits.slice(0, 6 - index).split("").forEach((digit, offset) => {
        next[index + offset] = digit;
      });
      setOtp(next);
      inputRefs.current[Math.min(index + digits.length, 6) - 1]?.focus();
      return;
    }

    setOtp([...otp.map((d, idx) => (idx === index ? digits : d))]);

    if (element.nextSibling && element.value !== "") {
      (element.nextSibling as HTMLInputElement).focus();
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = new Array(6).fill("").map((_, index) => pasted[index] || "");
    setOtp(next);
    inputRefs.current[Math.min(pasted.length, 6) - 1]?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join("");
    if (otpCode.length === 6) {
      verifyOtpMutation.mutate(otpCode);
    }
  };

  const resendOtpMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/resend-otp", {
        method: localStorage.getItem("otpMethod"),
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.sentVia) {
        setSentVia(data.sentVia);
        localStorage.setItem("otpSentVia", data.sentVia);
      }
      toast({
        title: "OTP Resent",
        description: data.message || "A new verification code has been sent.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Resend failed",
        description: error.message || "Failed to resend verification code. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleResend = () => {
    resendOtpMutation.mutate();
  };

  if (challenge) {
    const chooseMode = (mode: typeof challengeMode) => {
      setOtp(new Array(6).fill(""));
      setPin("");
      setAuthenticatorCode("");
      setChallengeMode(mode);
    };

    return (
      <div className="min-h-screen flex flex-col bg-background">
        <WavyHeader size="sm" />
        <main className="flex-1 p-6 pb-32 flex items-center justify-center">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm mx-auto">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-5">
                <span className="material-icons text-white text-2xl">verified_user</span>
              </div>
              <h2 className="text-2xl font-bold mb-2">Verify your sign-in</h2>
              <p className="text-muted-foreground">
                {challengeMode === "pin" ? "Enter your account PIN to continue." :
                  challengeMode === "authenticator" ? "Enter the code from your authenticator app." :
                  challengeMode === "biometric" ? "Verify with your device passkey." :
                  challengeMode === "otp" ? `Enter the code sent via ${sentVia || "your selected method"}.` :
                  "Choose a verification method to continue."}
              </p>
            </div>

            {challengeMode === null && (
              <div className="space-y-3">
                {challenge.requiresPin && (
                  <button onClick={() => chooseMode("pin")} className="w-full p-4 border border-border rounded-xl bg-card text-left hover:bg-muted">
                    <span className="font-semibold">Use PIN</span>
                    <span className="block text-sm text-muted-foreground">Enter your 4–6 digit account PIN</span>
                  </button>
                )}
                {challenge.requiresAuthenticator && (
                  <button onClick={() => chooseMode("authenticator")} className="w-full p-4 border border-border rounded-xl bg-card text-left hover:bg-muted">
                    <span className="font-semibold">Use authenticator app</span>
                    <span className="block text-sm text-muted-foreground">Enter a 6-digit verification code</span>
                  </button>
                )}
                {challenge.requiresBiometric && (
                  <button onClick={() => chooseMode("biometric")} className="w-full p-4 border border-border rounded-xl bg-card text-left hover:bg-muted">
                    <span className="font-semibold">Use device passkey</span>
                    <span className="block text-sm text-muted-foreground">Verify with this device</span>
                  </button>
                )}
                {challenge.requiresOtp && (challenge.otpMethods || []).map((method) => (
                  <button
                    key={method.id}
                    onClick={() => requestChallengeOtpMutation.mutate(method.id)}
                    disabled={requestChallengeOtpMutation.isPending}
                    className="w-full p-4 border border-border rounded-xl bg-card text-left hover:bg-muted disabled:opacity-60"
                    data-testid={`button-otp-method-${method.id}`}
                  >
                    <span className="font-semibold">
                      {requestChallengeOtpMutation.isPending ? "Sending code…" : `Send code by ${method.label}`}
                    </span>
                    <span className="block text-sm text-muted-foreground">To your verified {method.label} contact</span>
                  </button>
                ))}
              </div>
            )}

            {challengeMode === "pin" && (
              <div className="space-y-4">
                <Input
                  type="password"
                  inputMode="numeric"
                  autoFocus
                  maxLength={6}
                  placeholder="Enter PIN"
                  value={pin}
                  onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="text-center text-2xl tracking-widest font-bold"
                />
                <Button className="w-full" disabled={pin.length < 4 || verifyPinMutation.isPending} onClick={() => verifyPinMutation.mutate()}>
                  {verifyPinMutation.isPending ? "Verifying…" : "Verify PIN"}
                </Button>
              </div>
            )}

            {challengeMode === "authenticator" && (
              <div className="space-y-4">
                <Input
                  inputMode="numeric"
                  autoFocus
                  maxLength={6}
                  placeholder="000000"
                  value={authenticatorCode}
                  onChange={(event) => setAuthenticatorCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="text-center text-2xl tracking-widest font-bold"
                />
                <Button className="w-full" disabled={authenticatorCode.length !== 6 || verifyAuthenticatorMutation.isPending} onClick={() => verifyAuthenticatorMutation.mutate()}>
                  {verifyAuthenticatorMutation.isPending ? "Verifying…" : "Verify code"}
                </Button>
              </div>
            )}

            {challengeMode === "biometric" && (
              <Button className="w-full" disabled={verifyBiometricMutation.isPending} onClick={() => verifyBiometricMutation.mutate()}>
                {verifyBiometricMutation.isPending ? "Authenticating…" : "Verify with passkey"}
              </Button>
            )}

            {challengeMode === "otp" && (
              <>
                <div className="flex justify-center gap-2 mb-6">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      type="text"
                      inputMode="numeric"
                      autoComplete={index === 0 ? "one-time-code" : "off"}
                      maxLength={1}
                      value={digit}
                      onChange={(event) => handleChange(event.target, index)}
                      onKeyDown={(event) => handleKeyDown(event, index)}
                      onFocus={(event) => event.target.select()}
                      onPaste={handlePaste}
                      ref={(element) => (inputRefs.current[index] = element)}
                      className="w-11 h-12 text-center text-xl font-bold border border-border rounded-xl bg-input focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  ))}
                </div>
                <Button className="w-full" disabled={verifyOtpMutation.isPending || otp.join("").length !== 6} onClick={() => verifyOtpMutation.mutate(otp.join(""))}>
                  {verifyOtpMutation.isPending ? "Verifying…" : "Verify code"}
                </Button>
                <p className="text-center text-sm text-muted-foreground mt-4">
                  Didn’t receive it?{" "}
                  <button onClick={handleResend} disabled={resendOtpMutation.isPending} className="text-primary font-medium hover:underline">
                    {resendOtpMutation.isPending ? "Sending…" : "Resend code"}
                  </button>
                </p>
              </>
            )}

            <div className="flex gap-3 mt-6">
              {challengeMode !== null && (
                <Button variant="outline" className="flex-1" onClick={() => chooseMode(null)}>Other methods</Button>
              )}
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  clearChallengeStorage();
                  setLocation("/login");
                }}
              >
                Back to login
              </Button>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <WavyHeader size="sm" />

      <div className="flex-1 p-6 pb-32 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-sm mx-auto text-center"
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <span className="material-icons text-white text-2xl">sms</span>
          </motion.div>

          <h2 className="text-2xl font-bold mb-2">Verify Login</h2>
          <p className="text-muted-foreground mb-8">
            We've sent a 6-digit verification code via {sentVia || "your selected method"}.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="flex justify-center space-x-3 mb-8">
              {otp.map((data, index) => (
                <input
                  key={index}
                  type="text"
                  inputMode="numeric"
                  autoComplete={index === 0 ? "one-time-code" : "off"}
                  maxLength={1}
                  value={data}
                  onChange={(e) => handleChange(e.target, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  onFocus={(e) => e.target.select()}
                  onPaste={handlePaste}
                  ref={(ref) => (inputRefs.current[index] = ref)}
                  className="w-12 h-12 text-center text-xl font-bold border border-border rounded-xl bg-input focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                />
              ))}
            </div>

          </form>

          {/* Fixed bottom Verify button — Android feel */}
          <div className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-border" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
            <div className="max-w-sm mx-auto p-4">
              <Button
                onClick={() => {
                  const otpCode = otp.join("");
                  if (otpCode.length === 6) verifyOtpMutation.mutate(otpCode);
                }}
                className="w-full ripple"
                style={{ height: 52 }}
                disabled={verifyOtpMutation.isPending || otp.join("").length !== 6}
              >
                {verifyOtpMutation.isPending ? "Verifying..." : "Verify Code"}
              </Button>
            </div>
          </div>

          <p className="text-muted-foreground text-sm">
            Didn't receive a code?{" "}
            <button
              onClick={handleResend}
              disabled={resendOtpMutation.isPending}
              className="text-primary hover:underline font-medium disabled:opacity-50"
            >
              {resendOtpMutation.isPending ? "Sending..." : "Resend Code"}
            </button>
          </p>

          {/* ✅ WhatsApp Support Link */}
          <p className="text-muted-foreground text-sm mt-4">
            Having OTP issues?{" "}
            <a
              href="https://wa.me/14704657028"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-green-600 hover:underline font-medium"
            >
              <span className="material-icons text-base">chat</span>
              Contact Support on WhatsApp (+1 470 465 7028)
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  );
    }
