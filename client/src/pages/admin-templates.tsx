import { useEffect } from "react";
import { useLocation } from "wouter";
import { getStorageSafe } from "@/lib/safe-storage";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import WhatsAppTemplates from "@/components/admin/whatsapp-templates";

export default function AdminTemplatesPage() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const admin = getStorageSafe<any>("adminAuth", null);
    if (!admin) {
      setLocation("/admin/login");
    }
  }, [setLocation]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/admin/dashboard")}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-3xl font-bold">WhatsApp Templates</h1>
        </div>
        <WhatsAppTemplates />
      </div>
    </div>
  );
}
