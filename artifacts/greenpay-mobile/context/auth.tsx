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

export type OtpMethod = { id: string; label: string };
export type LoginChallenge = {
  requiresOtp?: boolean;
  otpMethods?: OtpMethod[];
  requiresPin?: boolean;
  requiresAuthenticator?: boolean;
  requiresBiometric?: boolean;
};

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  pendingOtp: boolean;
  challenge: LoginChallenge | null;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  requestOtp: (method: string) => Promise<void>;
  verifyOtp: (code: string) => Promise<void>;
  verifyPin: (pin: string) => Promise<void>;
  verifyAuthenticator: (code: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: React.PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingOtp, setPendingOtp] = useState(false);
  const [challenge, setChallenge] = useState<LoginChallenge | null>(null);
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
      const result = await api<{ user?: User } & LoginChallenge>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      if (result.requiresOtp || result.requiresPin || result.requiresAuthenticator || result.requiresBiometric) {
        setChallenge(result);
        setPendingOtp(false);
        return;
      }
      if (!result.user) throw new Error("Sign-in did not complete. Try again.");
      setUser(result.user);
      setChallenge(null);
      setPendingOtp(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to sign in.");
      throw cause;
    }
  };

  const requestOtp = async (method: string) => {
    setError(null);
    try {
      await api("/api/auth/resend-otp", {
        method: "POST",
        body: JSON.stringify({ method }),
      });
      setPendingOtp(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to send a verification code.");
      throw cause;
    }
  };

  const finishChallenge = (result: { user?: User }) => {
    if (!result.user) throw new Error("Verification did not complete. Try again.");
    setUser(result.user);
    setChallenge(null);
    setPendingOtp(false);
  };

  const verifyOtp = async (code: string) => {
    setError(null);
    try {
      const result = await api<{ user?: User }>("/api/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ code }),
      });
      finishChallenge(result);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to verify code.");
      throw cause;
    }
  };

  const verifyPin = async (pin: string) => {
    setError(null);
    try {
      const result = await api<{ user?: User }>("/api/auth/verify-pin", {
        method: "POST",
        body: JSON.stringify({ pin }),
      });
      finishChallenge(result);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to verify PIN.");
      throw cause;
    }
  };

  const verifyAuthenticator = async (code: string) => {
    setError(null);
    try {
      const result = await api<{ user?: User }>("/api/auth/verify-authenticator", {
        method: "POST",
        body: JSON.stringify({ code }),
      });
      finishChallenge(result);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to verify authenticator code.");
      throw cause;
    }
  };

  const logout = async () => {
    try { await api("/api/auth/logout", { method: "POST" }); } finally {
      setUser(null);
      setPendingOtp(false);
      setChallenge(null);
    }
  };

  const value = useMemo(() => ({
    user, loading, pendingOtp, challenge, error, login, requestOtp, verifyOtp, verifyPin, verifyAuthenticator, logout, refresh,
    clearError: () => setError(null),
  }), [user, loading, pendingOtp, challenge, error]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider.");
  return value;
}
