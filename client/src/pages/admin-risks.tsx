import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle, ShieldAlert, ShieldCheck } from "lucide-react";
import AdminShell from "@/components/admin/admin-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";

type RiskLevel = "high" | "medium" | "low" | "unknown";

interface RiskRecord {
  id: string;
  userId: string;
  user: { fullName: string; email: string; country: string } | null;
  kycStatus: string;
  diditStatus: string | null;
  diditSessionId: string | null;
  createdAt: string | null;
  risk: {
    level: RiskLevel;
    score: number | null;
    flags: string[];
    indicators: string[];
  };
}

const levelStyles: Record<RiskLevel, string> = {
  high: "bg-red-100 text-red-700 border-red-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  low: "bg-green-100 text-green-700 border-green-200",
  unknown: "bg-slate-100 text-slate-600 border-slate-200",
};

function RiskBadge({ level }: { level: RiskLevel }) {
  return (
    <Badge variant="outline" className={`capitalize ${levelStyles[level]}`}>
      {level} risk
    </Badge>
  );
}

export default function AdminRisksPage() {
  const { data, isLoading, error } = useQuery<{ risks: RiskRecord[] }>({
    queryKey: ["/api/admin/risks"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/risks");
      return response.json();
    },
  });

  const risks = data?.risks || [];
  const high = risks.filter(item => item.risk.level === "high").length;
  const medium = risks.filter(item => item.risk.level === "medium").length;
  const low = risks.filter(item => item.risk.level === "low").length;

  return (
    <AdminShell title="Risk Monitoring">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Didit Risk Monitoring</h1>
          <p className="mt-1 text-sm text-gray-500">
            Review risk signals returned by Didit before approving or following up on KYC.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-3 p-5">
              <ShieldAlert className="h-8 w-8 text-red-600" />
              <div><p className="text-2xl font-bold">{high}</p><p className="text-sm text-gray-500">High risk</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-5">
              <AlertTriangle className="h-8 w-8 text-amber-600" />
              <div><p className="text-2xl font-bold">{medium}</p><p className="text-sm text-gray-500">Medium risk</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-5">
              <ShieldCheck className="h-8 w-8 text-green-600" />
              <div><p className="text-2xl font-bold">{low}</p><p className="text-sm text-gray-500">Low risk</p></div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Verification risk signals</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 text-sm text-gray-500">Loading Didit risk data...</div>
            ) : error ? (
              <div className="p-6 text-sm text-red-600">Unable to load risk signals.</div>
            ) : risks.length === 0 ? (
              <div className="p-10 text-center text-sm text-gray-500">
                No Didit decisions are available yet.
              </div>
            ) : (
              <div className="divide-y">
                {risks.map(item => {
                  const signals = [...item.risk.flags, ...item.risk.indicators];
                  return (
                    <div key={item.id} className="space-y-3 p-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">{item.user?.fullName || "Unknown user"}</p>
                          <p className="text-sm text-gray-500">
                            {item.user?.email || item.userId}
                            {item.user?.country ? ` · ${item.user.country}` : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <RiskBadge level={item.risk.level} />
                          <Badge variant="outline" className="capitalize">{item.kycStatus.replaceAll("_", " ")}</Badge>
                        </div>
                      </div>
                      <div className="grid gap-2 text-sm text-gray-600 sm:grid-cols-3">
                        <p><span className="font-medium text-gray-900">Didit:</span> {item.diditStatus || "Not available"}</p>
                        <p><span className="font-medium text-gray-900">Risk score:</span> {item.risk.score === null ? "Not provided" : `${item.risk.score}/100`}</p>
                        <p><span className="font-medium text-gray-900">Session:</span> {item.diditSessionId ? `${item.diditSessionId.slice(0, 12)}…` : "Not available"}</p>
                      </div>
                      {signals.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {signals.map(signal => <Badge key={signal} variant="secondary">{signal}</Badge>)}
                        </div>
                      ) : (
                        <p className="flex items-center gap-2 text-sm text-green-700">
                          <CheckCircle className="h-4 w-4" /> No explicit risk flags were returned.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}