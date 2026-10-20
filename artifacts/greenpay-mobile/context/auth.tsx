import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AppState, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";
import { api } from "@/lib/api";

type User = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  email?: string | null;
  country?: string | null;
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
  biometricEnabled: boolean;
  appLocked: boolean;
  setBiometricEnabled: (enabled: boolean) => Promise<void>;
  unlockWithBiometrics: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  requestOtp: (method: string) => Promise<void>;
  verifyOtp: (code: string) => Promise<void>;
  verifyPin: (pin: string) => Promise<void>;
  verifyAuthenticator: (code: string) => Promise<void>;
  completeExternalLogin: (code: string) => Promise<void>;
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
  const [biometricEnabled, setBiometricEnabledState] = useState(false);
  const [appLocked, setAppLocked] = useState(false);
  const mobileLoginRequests = useRef(new Map<string, Promise<void>>());
  const completedMobileLoginCodes = useRef(new Set<string>());

  const refresh = async () => {
    try {
      const result = await api<{ user: User }>("/api/auth/me");
      setUser(result.user);
    } catch (cause) {
      const statusMatch = cause instanceof Error ? cause.message.match(/HTTP (\d{3})/) : null;
      const status = statusMatch ? Number(statusMatch[1]) : 0;
      // A timeout, network error, or 5xx is not proof that the user signed out.
      // Only discard local auth state when the server explicitly rejects it.
      if (status === 401 || status === 403) {
        setUser(null);
        setAppLocked(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const setBiometricEnabled = async (enabled: boolean) => {
    if (Platform.OS === "web") throw new Error("Device biometrics are only available in the native app.");
    if (enabled) {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!hasHardware || !enrolled) throw new Error("Set up Face ID or fingerprint authentication in your device settings first.");
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Enable GreenPay biometric unlock",
        fallbackLabel: "Use device passcode",
      });
      if (!result.success) throw new Error("Biometric verification was cancelled or unsuccessful.");
      await AsyncStorage.setItem("greenpay-native-biometric-lock", "enabled");
      setBiometricEnabledState(true);
      return;
    }
    await AsyncStorage.removeItem("greenpay-native-biometric-lock");
    setBiometricEnabledState(false);
    setAppLocked(false);
  };

  const unlockWithBiometrics = async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Unlock GreenPay",
      fallbackLabel: "Use device passcode",
    });
    if (!result.success) throw new Error("Biometric verification was not successful.");
    setAppLocked(false);
  };

  const appState = useRef(AppState.currentState);
  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const enabled = await AsyncStorage.getItem("greenpay-native-biometric-lock") === "enabled";
        if (mounted) {
          setBiometricEnabledState(enabled);
          if (enabled) setAppLocked(true);
        }
      } finally {
        if (mounted) await refresh();
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (appState.current === "active" && nextState !== "active" && user && biometricEnabled) setAppLocked(true);
      if (appState.current !== "active" && nextState === "active") void refresh();
      appState.current = nextState;
    });
    return () => subscription.remove();
  }, [user, biometricEnabled]);

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

  const completeExternalLogin = async (code: string) => {
    if (completedMobileLoginCodes.current.has(code)) return;
    const inFlight = mobileLoginRequests.current.get(code);
    if (inFlight) return inFlight;
    setError(null);
    const request = (async () => {
      try {
        const result = await api<{ user?: User }>("/api/auth/mobile/exchange", {
          method: "POST",
          body: JSON.stringify({ code }),
        });
        finishChallenge(result);
        completedMobileLoginCodes.current.add(code);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Unable to finish mobile sign-in.");
        throw cause;
      }
    })();
    mobileLoginRequests.current.set(code, request);
    try {
      await request;
    } finally {
      mobileLoginRequests.current.delete(code);
    }
  };

  const logout = async () => {
    try { await api("/api/auth/logout", { method: "POST" }); } finally {
      setUser(null);
      setPendingOtp(false);
      setChallenge(null);
      setAppLocked(false);
    }
  };

  const value = useMemo(() => ({
    user, loading, pendingOtp, challenge, error, biometricEnabled, appLocked, setBiometricEnabled, unlockWithBiometrics,
    login, requestOtp, verifyOtp, verifyPin, verifyAuthenticator, completeExternalLogin, logout, refresh,
    clearError: () => setError(null),
  }), [user, loading, pendingOtp, challenge, error, biometricEnabled, appLocked]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider.");
  return value;
}
