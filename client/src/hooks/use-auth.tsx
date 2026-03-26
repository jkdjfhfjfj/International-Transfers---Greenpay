import { createContext, useContext, useState, useEffect } from "react";
import { User } from "@shared/schema";
import { getStorageSafe, setStorageSafe } from "@/lib/safe-storage";

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // On boot, verify the stored user against the server session.
    // /api/auth/me uses the HTTP session cookie — never trusts the URL param.
    // If the server says 401 (no session / user deleted from DB), clear local state.
    const verifySession = async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          const freshUser = data.user as User;
          setUser(freshUser);
          setStorageSafe("greenpay_user", freshUser);
          if (freshUser?.darkMode) {
            document.documentElement.classList.add("dark");
          } else {
            document.documentElement.classList.remove("dark");
          }
        } else {
          // Server says no valid session — clear any stale local data
          setUser(null);
          localStorage.removeItem("greenpay_user");
        }
      } catch {
        // Network error — fall back to locally stored data so the app still renders
        const stored = getStorageSafe<User | null>("greenpay_user", null);
        if (stored) {
          setUser(stored);
          if (stored.darkMode) document.documentElement.classList.add("dark");
          else document.documentElement.classList.remove("dark");
        }
      } finally {
        setIsLoading(false);
      }
    };

    verifySession();
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    setStorageSafe("greenpay_user", userData);
    if (userData?.darkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("greenpay_user");
    // Also tell the server to clear the session
    fetch("/api/auth/logout", { method: "POST", credentials: "include" }).catch(() => {});
  };

  const refreshUser = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        const freshUser = data.user as User;
        setUser(freshUser);
        setStorageSafe("greenpay_user", freshUser);
      } else if (res.status === 401) {
        // Session expired or user removed from DB — log out cleanly
        setUser(null);
        localStorage.removeItem("greenpay_user");
      }
    } catch {
      // Network error — keep current state, don't log out
    }
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, login, logout, refreshUser, isAuthenticated, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
