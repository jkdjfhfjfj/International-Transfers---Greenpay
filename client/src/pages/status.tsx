import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, AlertCircle, RefreshCw, Activity, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { WavyHeader } from "@/components/wavy-header";

interface FeatureStatus {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  message: string;
  icon?: string;
}

interface SystemStatus {
  timestamp: string;
  overall: 'healthy' | 'degraded' | 'unhealthy';
  features: {
    [key: string]: FeatureStatus;
  };
}

export default function StatusPage() {
  const [, navigate] = useLocation();

  const { data: statusData, isLoading, refetch, isFetching } = useQuery<SystemStatus>({
    queryKey: ["/api/system/status"],
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'degraded':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'unhealthy':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'healthy':
        return 'default';
      case 'degraded':
        return 'secondary';
      case 'unhealthy':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const featureNames: { [key: string]: string } = {
    accountAccess: 'Account Access',
    fileUploads: 'Document Uploads',
    currencyExchange: 'Currency Exchange',
    airtimePurchase: 'Airtime Purchase',
    moneyTransfers: 'Money Transfers',
    virtualCards: 'Virtual Cards',
    notifications: 'Notifications',
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <WavyHeader
        
        
        rightContent={
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        }
        size="md"
      />

      <div className="max-w-2xl mx-auto p-4 space-y-6 mt-4">

        {/* Overall Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Overall System Health</CardTitle>
                  <CardDescription>
                    {statusData?.timestamp ? new Date(statusData.timestamp).toLocaleString() : 'Loading...'}
                  </CardDescription>
                </div>
                {statusData && (
                  <Badge 
                    variant={getStatusBadgeVariant(statusData.overall)}
                    className="text-base px-4 py-1 capitalize"
                  >
                    {statusData.overall}
                  </Badge>
                )}
              </div>
            </CardHeader>
          </Card>
        </motion.div>

        {/* Features Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          <h2 className="text-lg font-semibold">Features</h2>
          
          {isLoading ? (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-center text-muted-foreground">
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  Loading status information...
                </div>
              </CardContent>
            </Card>
          ) : statusData?.features ? (
            Object.entries(statusData.features).map(([key, feature], idx) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + idx * 0.05 }}
              >
                <Card className="transition-all hover:shadow-md hover:border-primary/30">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="p-2 rounded-lg bg-muted">
                          {feature.icon ? (
                            <span className="text-xl">{feature.icon}</span>
                          ) : (
                            getStatusIcon(feature.status)
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm md:text-base">
                            {featureNames[key] || key}
                          </h3>
                          <p className="text-xs md:text-sm text-muted-foreground">
                            {feature.message}
                          </p>
                        </div>
                      </div>
                      <Badge variant={getStatusBadgeVariant(feature.status)} className="capitalize ml-2 flex-shrink-0">
                        {feature.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (
            <Card>
              <CardContent className="p-6">
                <div className="text-center text-muted-foreground">
                  No status data available
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Info Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200 dark:from-amber-900/20 dark:to-amber-900/10">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <Activity className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-900 dark:text-amber-200">
                  <p className="font-medium mb-1">Auto-refresh enabled</p>
                  <p className="text-xs md:text-sm opacity-90">
                    This page automatically refreshes every 30 seconds. All app features are continuously monitored for optimal performance.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 p-4 shadow-lg max-w-md mx-auto">
        <div className="space-y-3">
          <div className="px-2">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Overall Status</p>
            <div className="flex items-center gap-2">
              {statusData?.overall === 'healthy' ? (
                <>
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400">All Systems Operational</span>
                </>
              ) : statusData?.overall === 'degraded' ? (
                <>
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">Degraded Performance</span>
                </>
              ) : (
                <>
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-sm font-semibold text-red-600 dark:text-red-400">Issues Detected</span>
                </>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() => refetch()}
              disabled={isFetching}
              className="bg-blue-600 hover:bg-blue-700 text-white w-full"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              onClick={() => navigate('/dashboard')}
              className="bg-green-600 hover:bg-green-700 text-white w-full"
            >
              Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
