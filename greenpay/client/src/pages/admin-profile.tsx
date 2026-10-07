import { useState, useEffect } from "react";
import AdminShell from "@/components/admin/admin-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Save, User } from "lucide-react";

export default function AdminProfilePage() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const { data: adminData, isLoading } = useQuery({
    queryKey: ["/api/admin/profile"],
    queryFn: async () => {
      const r = await apiRequest("GET", "/api/admin/profile");
      return r.json();
    },
  });

  useEffect(() => {
    if (adminData) {
      setEmail(adminData.email || "");
    }
  }, [adminData]);

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      const payload: any = { email };
      if (newPassword) {
        if (newPassword !== confirmPassword) {
          throw new Error("Passwords do not match");
        }
        if (!currentPassword) {
          throw new Error("Current password is required to set a new password");
        }
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }
      const r = await apiRequest("PUT", "/api/admin/profile", payload);
      return r.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Profile updated successfully." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      qc.invalidateQueries({ queryKey: ["/api/admin/profile"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile.",
        variant: "destructive",
      });
    },
  });

  return (
    <AdminShell title="Admin Profile">
      <div className="max-w-2xl space-y-6">
        <Card className="rounded-2xl border-0 shadow-sm bg-white">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-50">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">Admin Account</CardTitle>
                <CardDescription className="text-xs">
                  Manage your admin email and password
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {isLoading ? (
              <div className="space-y-3">
                <div className="h-10 rounded-lg bg-gray-100 animate-pulse" />
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-700">Email Address</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@example.com"
                    className="rounded-xl"
                  />
                </div>

                <div className="border-t pt-5">
                  <h3 className="font-semibold text-sm mb-4">Change Password</h3>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-gray-700">Current Password</Label>
                      <Input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        className="rounded-xl"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-gray-700">New Password</Label>
                      <Input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="rounded-xl"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-gray-700">Confirm New Password</Label>
                      <Input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className="rounded-xl"
                      />
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => updateProfileMutation.mutate()}
                  disabled={updateProfileMutation.isPending || !email}
                  className="w-full rounded-xl bg-blue-600 hover:bg-blue-500"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-gray-700">Security Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-600">
            <p>• Your email is used for account recovery and notifications</p>
            <p>• Passwords must be at least 8 characters long</p>
            <p>• Current password is required to change your password</p>
            <p>• Changes take effect immediately</p>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
