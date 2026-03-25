import { useState, useEffect } from "react";
import AdminShell from "@/components/admin/admin-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Save, Megaphone, Eye, EyeOff, Calendar } from "lucide-react";

interface AnnouncementData {
  message: string;
  enabled: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export default function AdminAnnouncementsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [announcementText, setAnnouncementText] = useState("");
  const [isEnabled, setIsEnabled] = useState(false);

  const { data: announcementData, isLoading } = useQuery<AnnouncementData>({
    queryKey: ["/api/admin/announcement"],
    queryFn: async () => {
      const r = await apiRequest("GET", "/api/admin/announcement");
      return r.json();
    },
  });

  useEffect(() => {
    if (announcementData) {
      setAnnouncementText(announcementData.message || "");
      setIsEnabled(announcementData.enabled || false);
    }
  }, [announcementData]);

  const mutation = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("PUT", "/api/admin/announcement", {
        message: announcementText,
        enabled: isEnabled,
      });
      return r.json();
    },
    onSuccess: () => {
      toast({ title: "Saved", description: "Announcement updated successfully." });
      qc.invalidateQueries({ queryKey: ["/api/admin/announcement"] });
    },
    onError: () => toast({ title: "Error", description: "Failed to save announcement.", variant: "destructive" }),
  });

  if (isLoading) {
    return (
      <AdminShell title="Announcements">
        <div className="max-w-2xl">
          <div className="h-96 rounded-2xl bg-gray-200 animate-pulse" />
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell title="Announcements">
      <div className="max-w-2xl space-y-6">
        <Card className="rounded-2xl border-0 shadow-sm bg-white">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-50">
                <Megaphone className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">Dashboard Announcement</CardTitle>
                <CardDescription className="text-xs">
                  Display a system-wide announcement on the user dashboard
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Announcement Message</Label>
              <Textarea
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                placeholder="Enter your announcement here... (e.g., System maintenance scheduled for tonight)"
                className="rounded-xl min-h-24 resize-none"
              />
              <p className="text-xs text-gray-500">This message will be visible to all users on their dashboard home screen</p>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-200">
              <div>
                <Label className="text-sm font-medium text-gray-700 block mb-0.5">Show Announcement</Label>
                <p className="text-xs text-gray-500">{isEnabled ? "Visible to all users" : "Hidden from users"}</p>
              </div>
              <Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
            </div>

            {announcementData?.updatedAt && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-50 border border-blue-100 text-xs text-blue-700">
                <Calendar className="w-4 h-4" />
                Last updated: {new Date(announcementData.updatedAt).toLocaleString()}
              </div>
            )}

            <Button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
              className="w-full rounded-xl bg-amber-600 hover:bg-amber-500"
            >
              <Save className="w-4 h-4 mr-2" />
              {mutation.isPending ? "Saving..." : "Save Announcement"}
            </Button>
          </CardContent>
        </Card>

        {announcementText && (
          <Card className="rounded-2xl border-0 shadow-sm bg-amber-50 border-l-4 border-l-amber-500">
            <CardHeader>
              <div className="flex items-center gap-2">
                {isEnabled ? (
                  <>
                    <Eye className="w-4 h-4 text-amber-600" />
                    <CardTitle className="text-sm text-amber-900">Preview - Users Will See This</CardTitle>
                  </>
                ) : (
                  <>
                    <EyeOff className="w-4 h-4 text-amber-600" />
                    <CardTitle className="text-sm text-amber-900">Preview - Currently Hidden</CardTitle>
                  </>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-4 bg-white rounded-lg border border-amber-200">
              <p className="text-sm text-gray-700 leading-relaxed">{announcementText}</p>
            </CardContent>
          </Card>
        )}

        <Card className="rounded-2xl border-0 shadow-sm bg-gray-50">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-gray-700">Tips for Announcements</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-xs text-gray-600">
              <li className="flex gap-2">
                <span className="font-semibold text-gray-700">•</span>
                <span>Keep messages concise and clear</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-gray-700">•</span>
                <span>Use for important updates, maintenance notifications, or special offers</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-gray-700">•</span>
                <span>Messages are visible to all users regardless of their account status</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-gray-700">•</span>
                <span>Disable the announcement when no longer needed</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
