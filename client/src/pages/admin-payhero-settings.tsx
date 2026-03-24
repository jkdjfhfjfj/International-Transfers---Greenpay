import { useEffect } from "react";
import { useLocation } from "wouter";
import { getStorageSafe } from "@/lib/safe-storage";
import PayHeroSettings from "@/components/admin/payhero-settings";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export default function AdminPayHeroSettingsPage() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const admin = getStorageSafe<any>("adminAuth", null);
    if (!admin) {
      setLocation("/admin/login");
    }
  }, [setLocation]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/admin/dashboard")}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-3xl font-bold">PayHero Settings</h1>
        </div>
        <PayHeroSettings />
      </div>
    </div>
  );
}
