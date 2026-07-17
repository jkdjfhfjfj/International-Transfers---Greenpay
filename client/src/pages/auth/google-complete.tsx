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
import { CheckCircle2, Phone, MapPin, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";

const COUNTRY_CODES = [
  { code: "+254", country: "Kenya", flag: "🇰🇪" },
  { code: "+234", country: "Nigeria", flag: "🇳🇬" },
  { code: "+233", country: "Ghana", flag: "🇬🇭" },
  { code: "+27", country: "South Africa", flag: "🇿🇦" },
  { code: "+256", country: "Uganda", flag: "🇺🇬" },
  { code: "+255", country: "Tanzania", flag: "🇹🇿" },
  { code: "+20", country: "Egypt", flag: "🇪🇬" },
  { code: "+1", country: "USA / Canada", flag: "🇺🇸" },
  { code: "+44", country: "United Kingdom", flag: "🇬🇧" },
  { code: "+49", country: "Germany", flag: "🇩🇪" },
  { code: "+33", country: "France", flag: "🇫🇷" },
  { code: "+971", country: "UAE", flag: "🇦🇪" },
  { code: "+966", country: "Saudi Arabia", flag: "🇸🇦" },
];

const STEPS = [
  { id: 1, label: "Phone", icon: Phone },
  { id: 2, label: "Country", icon: MapPin },
  { id: 3, label: "Done", icon: CheckCircle2 },
];

export default function GoogleCompletePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { login } = useAuth();

  const [step, setStep] = useState(1);
  const [phoneCode, setPhoneCode] = useState("+254");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [pendingInfo, setPendingInfo] = useState<{ fullName?: string; email?: string; profilePhotoUrl?: string } | null>(null);

  useEffect(() => {
    fetch("/api/auth/google/pending", { credentials: "include" })
      .then(r => r.json())
      .then(d => {
        if (!d.pending) {
          setLocation("/login");
        } else {
          setPendingInfo(d);
        }
      })
      .catch(() => setLocation("/login"));
  }, []);

  const completeMutation = useMutation({
    mutationFn: async () => {
      const fullPhone = phoneCode + phone;
      const r = await apiRequest("POST", "/api/auth/google/complete", { phone: fullPhone, country });
      const data = await r.json();
      if (!data.success) throw new Error(data.message || "Failed to create account");
      return data;
    },
    onSuccess: (data) => {
      login(data.user);
      setStep(3);
      setTimeout(() => setLocation("/dashboard"), 1500);
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const validatePhone = () => {
    if (!phone || phone.length < 7) {
      toast({ title: "Invalid phone", description: "Enter a valid phone number", variant: "destructive" });
      return false;
    }
    return true;
  };

  const validateCountry = () => {
    if (!country) {
      toast({ title: "Select country", description: "Please select your country", variant: "destructive" });
      return false;
    }
    return true;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <WavyHeader size="sm" />

      <div className="flex-1 p-6 flex flex-col">
        <div className="max-w-sm mx-auto w-full">

          {/* Progress steps */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center gap-2">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all ${
                  step > s.id
                    ? "bg-primary text-white"
                    : step === s.id
                    ? "bg-primary text-white ring-4 ring-primary/20"
                    : "bg-muted text-muted-foreground"
                }`}>
                  {step > s.id ? <CheckCircle2 className="w-4 h-4" /> : s.id}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-8 h-0.5 transition-all ${step > s.id ? "bg-primary" : "bg-muted"}`} />
                )}
              </div>
            ))}
          </div>

          {/* Google profile header */}
          {pendingInfo && step < 3 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border mb-6">
              {pendingInfo.profilePhotoUrl ? (
                <img src={pendingInfo.profilePhotoUrl} alt="Google profile"
                  className="w-12 h-12 rounded-full object-cover border-2 border-primary/20" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">
                  {pendingInfo.fullName?.[0] || "G"}
                </div>
              )}
              <div>
                <p className="font-semibold text-sm">{pendingInfo.fullName}</p>
                <p className="text-xs text-muted-foreground">{pendingInfo.email}</p>
                <span className="inline-block mt-0.5 text-[10px] px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full font-medium">
                  ✓ Google verified
                </span>
              </div>
            </motion.div>
          )}

          <AnimatePresence mode="wait">

            {/* Step 1: Phone */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-6">
                <div className="text-center">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <Phone className="w-7 h-7 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold">Your phone number</h2>
                  <p className="text-sm text-muted-foreground mt-1">We need this to secure your account and send notifications</p>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium">Country code</label>
                  <Select value={phoneCode} onValueChange={setPhoneCode}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRY_CODES.map(c => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.flag} {c.country} ({c.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <label className="text-sm font-medium">Phone number</label>
                  <div className="flex gap-2">
                    <div className="flex items-center px-3 py-2 rounded-xl bg-muted border border-border text-sm font-mono shrink-0">
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
                  <p className="text-xs text-muted-foreground">Enter your number without the country code</p>
                </div>

                <Button className="w-full rounded-xl" onClick={() => { if (validatePhone()) setStep(2); }}>
                  Continue <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </motion.div>
            )}

            {/* Step 2: Country */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-6">
                <div className="text-center">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <MapPin className="w-7 h-7 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold">Country of residence</h2>
                  <p className="text-sm text-muted-foreground mt-1">This helps us provide the right services for your region</p>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium">Select country</label>
                  <Select value={country} onValueChange={setCountry}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Choose your country..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {mockCountries.map((c: string) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setStep(1)}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                  <Button className="flex-1 rounded-xl"
                    onClick={() => { if (validateCountry()) completeMutation.mutate(); }}
                    disabled={completeMutation.isPending}>
                    {completeMutation.isPending
                      ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</>
                      : <>Create Account <ArrowRight className="w-4 h-4 ml-2" /></>}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Success */}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-4">
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.1 }}
                  className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </motion.div>
                <h2 className="text-2xl font-bold">Welcome to GreenPay!</h2>
                <p className="text-muted-foreground">Your account is ready. Taking you to your dashboard...</p>
                <Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" />
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
