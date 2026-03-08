import { useEffect } from "react";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { useLocation } from "wouter";
import { getStorageSafe } from "@/lib/safe-storage";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default function AdminAnalyticsPage() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading } = useAdminAuth();

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
          <h1 className="text-3xl font-bold">Analytics & Reports</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Analytics & Reports
            </CardTitle>
            <CardDescription>
              Detailed analytics and reporting tools
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500">Advanced analytics interface coming soon...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
