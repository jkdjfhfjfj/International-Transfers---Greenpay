import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Shield, Lock, Eye, EyeOff, Key, HelpCircle, AlertTriangle, CheckCircle, Mail } from "lucide-react";
import { useLocation } from "wouter";

const schema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  twoFactorCode: z.string().optional(),
  rememberEmail: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: localStorage.getItem("adminEmail") || "",
      password: "",
      twoFactorCode: "",
      rememberEmail: !!localStorage.getItem("adminEmail"),
    },
  });

  const handleRememberEmail = (checked: boolean) => {
    if (checked && form.getValues("email")) {
      localStorage.setItem("adminEmail", form.getValues("email"));
    } else {
      localStorage.removeItem("adminEmail");
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail) {
      toast({ title: "Error", description: "Enter your email address", variant: "destructive" });
      return;
    }
    setForgotLoading(true);
    try {
      const res = await fetch("/api/admin/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      if (res.ok) {
        toast({ title: "Check Email", description: "Password reset instructions sent to your email." });
        setShowForgotPassword(false);
        setForgotEmail("");
      } else {
        toast({ title: "Error", description: "Could not process request. Contact support.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Connection failed", variant: "destructive" });
    } finally {
      setForgotLoading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      const result = await res.json();

      if (result.requiresTwoFactor) {
        setRequiresTwoFactor(true);
        toast({ title: "2FA Required", description: "Enter your two-factor authentication code." });
        return;
      }

      if (res.ok) {
        toast({ title: "Welcome back!", description: "Signed in to GreenPay Admin." });
        setLocation("/admin/dashboard");
      } else {
        toast({
          title: "Sign In Failed",
          description: result.message || "Invalid credentials. Please try again.",
          variant: "destructive",
        });
      }
    } catch {
      toast({ title: "Connection Error", description: "Could not reach the server.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-500/20 border border-green-500/30 mb-4">
            <Shield className="w-8 h-8 text-green-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">GreenPay Admin</h1>
          <p className="text-slate-400 text-sm">Secure administrative access</p>
        </div>

        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8 shadow-2xl">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300 text-sm">Email Address</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="admin@greenpay.com"
                        disabled={isLoading}
                        className="bg-white/10 border-white/20 text-white placeholder:text-slate-500 focus:border-green-500 focus:ring-green-500/20"
                      />
                    </FormControl>
                    <FormMessage className="text-red-400 text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300 text-sm">Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          disabled={isLoading}
                          className="bg-white/10 border-white/20 text-white placeholder:text-slate-500 focus:border-green-500 focus:ring-green-500/20 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-400 text-xs" />
                  </FormItem>
                )}
              />

              {requiresTwoFactor && (
                <FormField
                  control={form.control}
                  name="twoFactorCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300 text-sm flex items-center gap-2">
                        <Key className="w-3 h-3" /> Two-Factor Code
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="000000"
                          maxLength={6}
                          disabled={isLoading}
                          className="bg-white/10 border-white/20 text-white placeholder:text-slate-500 focus:border-green-500 tracking-widest text-center text-lg"
                        />
                      </FormControl>
                      <FormMessage className="text-red-400 text-xs" />
                    </FormItem>
                  )}
                />
              )}

              {!requiresTwoFactor && (
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="remember"
                    checked={form.watch("rememberEmail")}
                    onChange={(e) => {
                      form.setValue("rememberEmail", e.target.checked);
                      handleRememberEmail(e.target.checked);
                    }}
                    className="w-4 h-4 rounded cursor-pointer bg-white/10 border border-white/20 accent-green-500"
                  />
                  <label htmlFor="remember" className="text-slate-400 text-sm cursor-pointer">
                    Remember email
                  </label>
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-green-600 hover:bg-green-500 text-white font-semibold py-2.5 rounded-xl transition-all"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Lock className="w-4 h-4" />
                    Sign In to Admin Panel
                  </span>
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-6 space-y-4">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowForgotPassword(!showForgotPassword)}
                className="flex-1 bg-slate-700/40 border-slate-600 text-slate-300 hover:bg-slate-700/60 hover:text-white text-xs"
              >
                <Mail className="w-3 h-3 mr-1" />
                Forgot Password?
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 bg-slate-700/40 border-slate-600 text-slate-300 hover:bg-slate-700/60 hover:text-white text-xs"
                onClick={() => {
                  const subject = "Admin Support Request";
                  const body = "Hello GreenPay Admin Support,\n\nI need assistance with my admin account.\n\nDetails: ";
                  window.location.href = `mailto:support@greenpay.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                }}
              >
                <HelpCircle className="w-3 h-3 mr-1" />
                Get Help
              </Button>
            </div>

            {showForgotPassword && (
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 space-y-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-300">Enter your admin email to receive password reset instructions</p>
                </div>
                <Input
                  type="email"
                  placeholder="your.email@greenpay.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  disabled={forgotLoading}
                  className="bg-white/10 border-blue-500/30 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20 text-xs"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleForgotPassword}
                    disabled={forgotLoading || !forgotEmail}
                    size="sm"
                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-xs"
                  >
                    {forgotLoading ? "Sending..." : "Send Reset Link"}
                  </Button>
                  <Button
                    onClick={() => {
                      setShowForgotPassword(false);
                      setForgotEmail("");
                    }}
                    variant="outline"
                    size="sm"
                    className="flex-1 bg-slate-700/40 border-slate-600 text-slate-300 hover:bg-slate-700/60 text-xs"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <p className="text-xs text-slate-300 font-semibold">Security Features</p>
              </div>
              <ul className="space-y-1 text-xs text-slate-400">
                <li className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-green-500" />
                  Two-factor authentication (2FA) enabled
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-green-500" />
                  Encrypted session management
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-green-500" />
                  Rate limiting on login attempts
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-green-500" />
                  Admin activity logging
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
