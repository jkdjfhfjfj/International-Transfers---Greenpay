import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";

type User = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  email?: string | null;
  balance?: string | number | null;
};

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  pendingOtp: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  verifyOtp: (code: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: React.PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingOtp, setPendingOtp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    try {
      const result = await api<{ user: User }>("/api/auth/me");
      setUser(result.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void refresh(); }, []);

  const login = async (email: string, password: string) => {
    setError(null);
    try {
      const result = await api<{ user?: User; requiresOtp?: boolean; requiresPin?: boolean; requiresAuthenticator?: boolean; requiresBiometric?: boolean }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      if (result.requiresOtp) {
        setPendingOtp(true);
        return;
      }
      if (result.requiresPin || result.requiresAuthenticator || result.requiresBiometric) {
        throw new Error("This account needs an additional PIN, authenticator, or biometric step. Use GreenPay web sign-in for this account.");
      }
      if (!result.user) throw new Error("Sign-in did not complete. Try again.");
      setUser(result.user);
      setPendingOtp(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to sign in.");
      throw cause;
    }
  };

  const verifyOtp = async (code: string) => {
    setError(null);
    try {
      const result = await api<{ user?: User }>("/api/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ code }),
      });
      if (!result.user) throw new Error("The verification code was not accepted.");
      setUser(result.user);
      setPendingOtp(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to verify code.");
      throw cause;
    }
  };

  const logout = async () => {
    try { await api("/api/auth/logout", { method: "POST" }); } finally {
      setUser(null);
      setPendingOtp(false);
    }
  };

  const value = useMemo(() => ({
    user, loading, pendingOtp, error, login, verifyOtp, logout, refresh,
    clearError: () => setError(null),
  }), [user, loading, pendingOtp, error]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider.");
  return value;
}
