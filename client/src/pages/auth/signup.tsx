import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { mockCountries } from "@/lib/mock-data";
import { WavyHeader } from "@/components/wavy-header";

const signupSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string()
    .min(9, "Phone number must be 9 digits")
    .max(9, "Phone number must be 9 digits")
    .regex(/^[17]\d{8}$/, "Phone number must start with 1 or 7 and be 9 digits (e.g., 145454534 or 712345678)"),
  phoneCountryCode: z.string().min(1, "Please select country code"),
  country: z.string().min(1, "Please select your country"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  agreeToTerms: z.boolean().refine(val => val === true, "You must agree to the terms"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupForm = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { login } = useAuth();

  const form = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      phoneCountryCode: "+254", // Default to Kenya
      country: "",
      password: "",
      confirmPassword: "",
      agreeToTerms: false,
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (data: Omit<SignupForm, "confirmPassword" | "agreeToTerms" | "phoneCountryCode">) => {
      const response = await apiRequest("POST", "/api/auth/signup", data);
      return response.json();
    },
    onSuccess: (data) => {
      // login(data.user); // Removed auto-login
      toast({
        title: "Account created!",
        description: "Your account has been created successfully. Please log in.",
      });
      setLocation("/login");
    },
    onError: () => {
      toast({
        title: "Signup failed",
        description: "Unable to create account. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SignupForm) => {
    const { confirmPassword, agreeToTerms, phoneCountryCode, ...signupData } = data;
    // Combine country code with phone number
    const fullPhone = phoneCountryCode + signupData.phone;
    signupMutation.mutate({ ...signupData, phone: fullPhone });
  };

  const countryCodes = [
    { code: "+254", country: "Kenya" },
    { code: "+234", country: "Nigeria" },
    { code: "+233", country: "Ghana" },
    { code: "+27", country: "South Africa" },
    { code: "+20", country: "Egypt" },
    { code: "+256", country: "Uganda" },
    { code: "+255", country: "Tanzania" },
    { code: "+1", country: "USA" },
    { code: "+44", country: "UK" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <WavyHeader size="sm" />
      <div className="flex-1 p-6 pb-36 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-sm mx-auto"
        >
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <span className="material-icons text-white text-2xl">attach_money</span>
            </motion.div>
            <h2 className="text-2xl font-bold mb-2">Join Geepay</h2>
            <p className="text-muted-foreground">Create your account to start sending money</p>
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-left text-xs text-amber-800">
              GreenPay is now Geepay. We moved from <strong>greenpay.world</strong> to <strong>geepay.us</strong>.
            </div>
            <p className="text-xs text-muted-foreground mt-3 px-2">Account verification requires a valid phone number on WhatsApp with SMS capability, a verified email address, and identification that matches your registered name.</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter your full name"
                        data-testid="input-fullname"
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground mt-1">This must match the name on your official identification</p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="Enter your email"
                        data-testid="input-email"
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground mt-1">A verification code will be sent to this address</p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex space-x-2">
                <FormField
                  control={form.control}
                  name="phoneCountryCode"
                  render={({ field }) => (
                    <FormItem className="w-28">
                      <FormLabel>Code</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {countryCodes.map((item) => (
                            <SelectItem key={item.code} value={item.code}>
                              {item.code}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="tel"
                          placeholder="712345678"
                          data-testid="input-phone"
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground mt-1">Must be a WhatsApp-enabled number with SMS capability. A verification code will be sent via SMS.</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-country">
                          <SelectValue placeholder="Select your country" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {mockCountries.map((country) => (
                          <SelectItem key={country.code} value={country.name}>
                            {country.flag} {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="Create a strong password"
                        data-testid="input-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="Confirm your password"
                        data-testid="input-confirm-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="agreeToTerms"
                render={({ field }) => (
                  <FormItem className="flex items-start space-x-2 space-y-0">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="w-4 h-4 text-primary border-border rounded focus:ring-ring mt-1"
                        data-testid="checkbox-terms"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <span className="text-sm text-muted-foreground">
                        I agree to the{" "}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setLocation("/terms");
                          }}
                          className="text-primary hover:underline font-medium"
                        >
                          Terms of Service
                        </button>{" "}
                        and{" "}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setLocation("/privacy");
                          }}
                          className="text-primary hover:underline font-medium"
                        >
                          Privacy Policy
                        </button>
                      </span>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

            </form>
          </Form>

          <div className="mt-6 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-background text-muted-foreground">Or sign up with</span>
            </div>
          </div>

          <div className="mt-4">
            <Button
              variant="outline"
              className="w-full flex items-center justify-center gap-3 h-11"
              onClick={() => {
                const popup = window.open("/auth/google", "GoogleAuth", "width=520,height=620,scrollbars=yes,resizable=yes,left=" + Math.round((screen.width - 520) / 2) + ",top=" + Math.round((screen.height - 620) / 2));
                const handler = (e: MessageEvent) => {
                  if (!e.data?.googleAuth) return;
                  window.removeEventListener("message", handler);
                  const r = e.data.googleAuth;
                  if (r === "login") {
                    window.location.href = "/dashboard";
                  } else if (r === "new_user") {
                    window.location.href = "/auth/google/complete";
                  } else if (r === "suspended") {
                    toast({ title: "Account suspended", description: "Contact support for assistance.", variant: "destructive" });
                  } else if (r === "error") {
                    toast({ title: "Sign-in failed", description: "Could not sign up with Google. Please try again.", variant: "destructive" });
                  }
                };
                window.addEventListener("message", handler);
                const t = setInterval(() => { if (popup?.closed) { clearInterval(t); window.removeEventListener("message", handler); } }, 1000);
              }}
              type="button"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="text-sm font-medium">Sign up with Google</span>
            </Button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <button
                onClick={() => setLocation("/login")}
                className="text-primary hover:underline font-semibold"
                data-testid="link-signin"
              >
                Sign in
              </button>
            </p>
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-muted-foreground">
              By creating an account, you agree to our{" "}
              <button
                onClick={() => setLocation("/terms")}
                className="text-primary hover:underline font-medium"
              >
                Terms and Conditions
              </button>
            </p>
          </div>
        </motion.div>
      </div>

      {/* Fixed bottom Create Account button — Android feel */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-border" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="max-w-sm mx-auto p-4">
          <Button
            onClick={form.handleSubmit(onSubmit)}
            className="w-full ripple"
            style={{ height: 52 }}
            disabled={signupMutation.isPending}
            data-testid="button-create-account"
          >
            {signupMutation.isPending ? "Creating Account..." : "Create Account"}
          </Button>
        </div>
      </div>
    </div>
  );
}
