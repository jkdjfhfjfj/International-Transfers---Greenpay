import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { WavyHeader } from "@/components/wavy-header";
import { mockCountries } from "@/lib/mock-data";
import { CheckCircle2, Phone, MapPin, User, ArrowRight, ArrowLeft, Loader2, AlertCircle } from "lucide-react";

const COUNTRY_CODES = [
  { code: "+254", label: "🇰🇪 Kenya (+254)" },
  { code: "+234", label: "🇳🇬 Nigeria (+234)" },
  { code: "+233", label: "🇬🇭 Ghana (+233)" },
  { code: "+27",  label: "🇿🇦 South Africa (+27)" },
  { code: "+256", label: "🇺🇬 Uganda (+256)" },
  { code: "+255", label: "🇹🇿 Tanzania (+255)" },
  { code: "+20",  label: "🇪🇬 Egypt (+20)" },
  { code: "+1",   label: "🇺🇸 USA / Canada (+1)" },
  { code: "+44",  label: "🇬🇧 United Kingdom (+44)" },
  { code: "+49",  label: "🇩🇪 Germany (+49)" },
  { code: "+33",  label: "🇫🇷 France (+33)" },
  { code: "+971", label: "🇦🇪 UAE (+971)" },
  { code: "+966", label: "🇸🇦 Saudi Arabia (+966)" },
  { code: "+61",  label: "🇦🇺 Australia (+61)" },
  { code: "+91",  label: "🇮🇳 India (+91)" },
];

interface PendingInfo {
  fullName: string;
  email: string;
  profilePhotoUrl?: string;
}

export default function GoogleCompletePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { login } = useAuth();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [pendingInfo, setPendingInfo] = useState<PendingInfo | null>(null);
  const [notFound, setNotFound] = useState(false);

  // Step 1: full name
  const [fullName, setFullName] = useState("");
  // Step 2: phone
  const [phoneCode, setPhoneCode] = useState("+254");
  const [phone, setPhone] = useState("");
  // Step 3: country + terms
  const [country, setCountry] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  useEffect(() => {
    fetch("/api/auth/google/pending", { credentials: "include" })
      .then(r => r.json())
      .then(d => {
        setLoading(false);
        if (!d.pending) {
          setNotFound(true);
        } else {
          setPendingInfo(d);
          setFullName(d.fullName || "");
        }
      })
      .catch(() => { setLoading(false); setNotFound(true); });
  }, []);

  const completeMutation = useMutation({
    mutationFn: async () => {
      const fullPhone = phoneCode + phone;
      const r = await apiRequest("POST", "/api/auth/google/complete", {
        fullName: fullName.trim(),
        phone: fullPhone,
        country,
      });
      const data = await r.json();
      if (!data.success) throw new Error(data.message || "Failed to create account");
      return data;
    },
    onSuccess: (data) => {
      login(data.user);
      setStep(4);
      setTimeout(() => setLocation("/dashboard"), 1800);
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const goNext = () => {
    if (step === 1) {
      if (!fullName.trim() || fullName.trim().length < 2) {
        toast({ title: "Full name required", description: "Enter your full name (at least 2 characters)", variant: "destructive" });
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!phone || phone.length < 6) {
        toast({ title: "Phone required", description: "Enter a valid phone number", variant: "destructive" });
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (!country) {
        toast({ title: "Country required", description: "Please select your country of residence", variant: "destructive" });
        return;
      }
      if (!agreedToTerms) {
        toast({ title: "Terms required", description: "You must agree to the Terms and Conditions", variant: "destructive" });
        return;
      }
      completeMutation.mutate();
    }
  };

  const STEPS = [
    { id: 1, label: "Name", icon: User },
    { id: 2, label: "Phone", icon: Phone },
    { id: 3, label: "Country", icon: MapPin },
    { id: 4, label: "Done", icon: CheckCircle2 },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
        <AlertCircle className="w-12 h-12 text-amber-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">Session not found</h2>
        <p className="text-muted-foreground text-center text-sm mb-6">
          Your Google session expired or wasn't found. Please sign in with Google again.
        </p>
        <Button onClick={() => setLocation("/signup")}>Back to Sign Up</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <WavyHeader size="sm" />
      <div className="flex-1 p-5 pb-28 max-w-sm mx-auto w-full overflow-y-auto">

        {/* Progress steps */}
        <div className="flex items-center justify-center gap-1 mb-6">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-1">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all duration-300 ${
                step > s.id ? "bg-primary text-white" :
                step === s.id ? "bg-primary text-white ring-4 ring-primary/20" :
                "bg-muted text-muted-foreground"
              }`}>
                {step > s.id ? <CheckCircle2 className="w-4 h-4" /> : s.id}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-6 h-0.5 transition-all duration-300 ${step > s.id ? "bg-primary" : "bg-muted"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Google profile banner */}
        {pendingInfo && step < 4 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-3.5 rounded-2xl bg-card border border-border mb-5">
            {pendingInfo.profilePhotoUrl ? (
              <img src={pendingInfo.profilePhotoUrl} alt="Google profile"
                className="w-11 h-11 rounded-full object-cover border-2 border-primary/20 shrink-0" />
            ) : (
              <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary shrink-0">
                {pendingInfo.fullName?.[0] || "G"}
              </div>
            )}
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{pendingInfo.fullName}</p>
              <p className="text-xs text-muted-foreground truncate">{pendingInfo.email}</p>
              <span className="inline-block mt-0.5 text-[10px] px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full font-medium">
                ✓ Google verified
              </span>
            </div>
          </motion.div>
        )}

        <AnimatePresence mode="wait">

          {/* Step 1: Full Name */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
              className="space-y-5">
              <div className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-xl font-bold">Confirm your name</h2>
                <p className="text-sm text-muted-foreground mt-1">This should match your official ID for KYC</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name</label>
                <Input
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="rounded-xl"
                />
                <p className="text-xs text-muted-foreground">Pre-filled from Google — edit if needed</p>
              </div>
            </motion.div>
          )}

          {/* Step 2: Phone */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
              className="space-y-5">
              <div className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Phone className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-xl font-bold">Your phone number</h2>
                <p className="text-sm text-muted-foreground mt-1">Used for account security and notifications</p>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Country code</label>
                  <Select value={phoneCode} onValueChange={setPhoneCode}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {COUNTRY_CODES.map(c => (
                        <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Phone number</label>
                  <div className="flex gap-2">
                    <div className="flex items-center px-3 rounded-xl bg-muted border border-border text-sm font-mono shrink-0 h-10">
                      {phoneCode}
                    </div>
                    <Input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value.replace(/\D/g, ""))}
                      placeholder="712345678"
                      className="rounded-xl"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Enter without the country code</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Country + Terms */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
              className="space-y-5">
              <div className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-xl font-bold">Country & Agreement</h2>
                <p className="text-sm text-muted-foreground mt-1">Last step before your account is ready</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Country of residence</label>
                  <Select value={country} onValueChange={setCountry}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select your country..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {mockCountries.map((c) => (
                        <SelectItem key={c.code} value={c.name}>{c.flag} {c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={e => setAgreedToTerms(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-border text-primary"
                  />
                  <span className="text-sm text-muted-foreground leading-relaxed">
                    I agree to Geepay's{" "}
                    <a href="/terms" target="_blank" className="text-primary underline font-medium">Terms and Conditions</a>
                    {" "}and{" "}
                    <a href="/privacy" target="_blank" className="text-primary underline font-medium">Privacy Policy</a>
                  </span>
                </label>
              </div>
            </motion.div>
          )}

          {/* Step 4: Success */}
          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-4 py-8">
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.1 }}
                className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </motion.div>
              <div>
                <h2 className="text-2xl font-bold">Welcome to Geepay!</h2>
                <p className="text-muted-foreground mt-2 text-sm">Your account is ready. Taking you to your dashboard…</p>
              </div>
              <Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" />
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Fixed bottom action buttons — Android feel */}
      {step < 4 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-border" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          <div className="max-w-sm mx-auto p-4 flex gap-3">
            {step > 1 && (
              <Button variant="outline" className="rounded-xl" onClick={() => setStep(step - 1)}>
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
            )}
            <Button
              className="flex-1 rounded-xl"
              style={{ height: 52 }}
              onClick={goNext}
              disabled={completeMutation.isPending}
            >
              {step === 3
                ? completeMutation.isPending
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</>
                  : <>Create Account <ArrowRight className="w-4 h-4 ml-2" /></>
                : <>Continue <ArrowRight className="w-4 h-4 ml-2" /></>}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
