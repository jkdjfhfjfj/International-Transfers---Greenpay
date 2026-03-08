import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

export interface AdminUser {
  id: string;
  email: string;
  role: string;
  createdAt: string;
}

export function useAdminAuth() {
  const [, setLocation] = useLocation();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const validateAdminSession = async () => {
      try {
        // First check localStorage
        const stored = localStorage.getItem("adminAuth");
        if (!stored) {
          setIsLoading(false);
          setIsAuthenticated(false);
          return;
        }

        // Then validate with server
        const response = await apiRequest("/api/admin/session", "GET");
        if (response.ok) {
          const data = await response.json();
          setAdmin(data.admin);
          setIsAuthenticated(true);
          // Update localStorage with fresh data
          localStorage.setItem("adminAuth", JSON.stringify(data.admin));
        } else if (response.status === 401) {
          // Session expired on server
          localStorage.removeItem("adminAuth");
          setIsAuthenticated(false);
          console.warn("[Admin Auth] Session expired on server");
        }
      } catch (error) {
        console.error("[Admin Auth] Session validation failed:", error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    validateAdminSession();
  }, []);

  const logout = async () => {
    try {
      await apiRequest("/api/admin/logout", "POST");
    } catch (error) {
      console.error("[Admin Auth] Logout error:", error);
    } finally {
      localStorage.removeItem("adminAuth");
      setAdmin(null);
      setIsAuthenticated(false);
      setLocation("/admin/login");
    }
  };

  return {
    admin,
    isAuthenticated,
    isLoading,
    logout,
  };
}
