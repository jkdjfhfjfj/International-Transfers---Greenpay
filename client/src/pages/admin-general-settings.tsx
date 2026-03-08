import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import AdminSettings from "@/components/admin/admin-settings";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export default function AdminGeneralSettingsPage() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading } = useAdminAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/admin/login");
    }
  }, [isLoading, isAuthenticated, setLocation]);

  if (isLoading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex items-center gap-4 p-4 md:p-8 border-b">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/admin/dashboard")}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>
      <AdminSettings />
    </div>
  );
}
