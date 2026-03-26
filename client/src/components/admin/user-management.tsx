import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Search, 
  Filter, 
  UserCheck, 
  UserX, 
  Eye, 
  CreditCard,
  FileText,
  Shield,
  AlertTriangle,
  Trash2,
  Users,
  DollarSign,
  Plus,
  Minus,
  Mail,
  Phone,
  Calendar,
  Lock,
  Unlock,
  LogOut,
  Bell,
  BellOff,
  Key,
  Settings,
  Activity,
  Download,
  Clock,
  Copy,
  Check,
  Ban,
  RefreshCw,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronDown,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { UserActivityModal } from "./user-activity-modal";

interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  country: string;
  kycStatus: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  hasVirtualCard: boolean;
  balance: string;
  kesBalance?: string;
  createdAt: string;
  twoFactorEnabled: boolean;
  pushNotificationsEnabled: boolean;
  defaultCurrency: string;
  cardStatus?: string;
  isBlocked?: boolean;
  isSuspended?: boolean;
  suspensionReason?: string;
  suspendedAt?: string;
  lastLoginAt?: string;
  totalTransactions?: number;
}

interface UsersResponse {
  users: User[];
  total: number;
  page: number;
  totalPages: number;
}

export default function UserManagement() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [selectedUserForActivity, setSelectedUserForActivity] = useState<User | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: usersData, isLoading, error } = useQuery<UsersResponse>({
    queryKey: ["/api/admin/users", { page, status, search }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...(status && status !== "all" && { status }),
        ...(search && { search }),
      });
      const response = await apiRequest("GET", `/api/admin/users?${params}`);
      return response.json();
    },
  });

  useEffect(() => {
    if (selectedUser && usersData?.users) {
      const updated = usersData.users.find((u) => u.id === selectedUser.id);
      if (updated) setSelectedUser(updated);
    }
  }, [usersData]);

  const blockUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest("PUT", `/api/admin/users/${userId}/block`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "User Blocked",
        description: "User has been successfully blocked",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to block user",
        variant: "destructive",
      });
    },
  });

  const unblockUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest("PUT", `/api/admin/users/${userId}/unblock`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "User Unblocked",
        description: "User has been successfully unblocked",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to unblock user",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest("DELETE", `/api/admin/users/${userId}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "User Deleted",
        description: "User and all related data have been permanently deleted",
      });
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  const getUserStatusBadge = (user: User) => {
    if (!user.isEmailVerified && !user.isPhoneVerified) {
      return <Badge variant="destructive">Blocked</Badge>;
    }
    if (user.kycStatus === "verified") {
      return <Badge variant="default">Verified</Badge>;
    }
    if (user.kycStatus === "pending") {
      return <Badge variant="secondary">Pending KYC</Badge>;
    }
    return <Badge variant="outline">Active</Badge>;
  };

  const isUserBlocked = (user: User) => {
    return !user.isEmailVerified && !user.isPhoneVerified;
  };

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteUser = () => {
    if (userToDelete) {
      deleteUserMutation.mutate(userToDelete.id);
    }
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Failed to load users data
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            User Management
          </CardTitle>
          <CardDescription>
            Manage platform users, review KYC status, and control access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, email, or phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                  data-testid="input-user-search"
                />
              </div>
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full md:w-48" data-testid="select-user-status">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="active">Active Users</SelectItem>
                <SelectItem value="pending">Pending KYC</SelectItem>
                <SelectItem value="verified">Verified Users</SelectItem>
                <SelectItem value="blocked">Blocked Users</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({usersData?.total || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>KYC</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersData?.users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium" data-testid={`text-user-name-${user.id}`}>
                            {user.fullName}
                          </p>
                          <p className="text-sm text-gray-500">{user.country}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="text-sm">{user.email}</p>
                          <p className="text-sm text-gray-500">{user.phone}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getUserStatusBadge(user)}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={user.kycStatus === "verified" ? "default" : "secondary"}
                          data-testid={`badge-kyc-${user.id}`}
                        >
                          {user.kycStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-mono">${user.balance || "0.00"}</span>
                          <span className="text-xs text-gray-500 font-mono">KES {(user as any).kesBalance || "0.00"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {format(new Date(user.createdAt), "MMM dd, yyyy")}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedUser(user)}
                                data-testid={`button-view-user-${user.id}`}
                                title="View User Details"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>User Details: {user.fullName}</DialogTitle>
                                <DialogDescription>
                                  Complete user information and account status
                                </DialogDescription>
                              </DialogHeader>
                              <UserDetailsDialog user={user} />
                            </DialogContent>
                          </Dialog>

                          <Dialog open={activityModalOpen && selectedUserForActivity?.id === user.id} onOpenChange={(open) => {
                            if (!open) {
                              setActivityModalOpen(false);
                              setSelectedUserForActivity(null);
                            }
                          }}>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedUserForActivity(user);
                                  setActivityModalOpen(true);
                                }}
                                title="View User Activity"
                              >
                                <Clock className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>User Activity: {user.fullName}</DialogTitle>
                                <DialogDescription>
                                  Last 48 hours of activity including logins, transactions, actions, and attempts
                                </DialogDescription>
                              </DialogHeader>
                              <UserActivityModal userId={user.id} />
                            </DialogContent>
                          </Dialog>

                          {isUserBlocked(user) ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => unblockUserMutation.mutate(user.id)}
                              disabled={unblockUserMutation.isPending}
                              data-testid={`button-unblock-user-${user.id}`}
                            >
                              <UserCheck className="w-4 h-4 text-green-600" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => blockUserMutation.mutate(user.id)}
                              disabled={blockUserMutation.isPending}
                              data-testid={`button-block-user-${user.id}`}
                            >
                              <UserX className="w-4 h-4 text-red-600" />
                            </Button>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(user)}
                            disabled={deleteUserMutation.isPending}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50"
                            data-testid={`button-delete-user-${user.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {usersData && usersData.totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    Page {usersData.page} of {usersData.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page <= 1}
                      data-testid="button-prev-page"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page >= usersData.totalPages}
                      data-testid="button-next-page"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete User Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Delete User Account
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the user account and all associated data including:
            </DialogDescription>
          </DialogHeader>

          {userToDelete && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-medium text-red-900 mb-2">User to be deleted:</h4>
                <div className="space-y-1 text-sm text-red-800">
                  <p><strong>Name:</strong> {userToDelete.fullName}</p>
                  <p><strong>Email:</strong> {userToDelete.email}</p>
                  <p><strong>Phone:</strong> {userToDelete.phone}</p>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-900 mb-2">The following data will be permanently deleted:</h4>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• User profile and personal information</li>
                  <li>• All transaction history</li>
                  <li>• Virtual card information</li>
                  <li>• KYC documents and verification status</li>
                  <li>• Payment requests and recipients</li>
                  <li>• Notifications and preferences</li>
                </ul>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteUserMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteUser}
              disabled={deleteUserMutation.isPending}
              data-testid="confirm-delete-user"
            >
              {deleteUserMutation.isPending ? "Deleting..." : "Delete User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function UserDetailsDialog({ user }: { user: User }) {
  const [balanceUpdate, setBalanceUpdate] = useState("");
  const [kesBalanceUpdate, setKesBalanceUpdate] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState<"USD" | "KES">("USD");
  const [updateType, setUpdateType] = useState<"add" | "subtract" | "set">("add");
  const [transactionDetails, setTransactionDetails] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [showCardDetails, setShowCardDetails] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [suspendReason, setSuspendReason] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: userTransactions, isLoading: txLoading } = useQuery({
    queryKey: ["/api/admin/users", user.id, "transactions"],
    queryFn: async () => {
      const r = await apiRequest("GET", `/api/admin/users/${user.id}/transactions`);
      return r.json();
    },
  });

  const { data: userCard, isLoading: cardLoading } = useQuery({
    queryKey: ["/api/admin/users", user.id, "card"],
    queryFn: async () => {
      const r = await apiRequest("GET", `/api/admin/users/${user.id}/card`);
      return r.json();
    },
  });

  const txList = (userTransactions as any)?.transactions || [];
  const card = (userCard as any)?.card || null;

  const copyUserId = async () => {
    await navigator.clipboard.writeText(user.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
    toast({ title: "Copied", description: "User ID copied to clipboard" });
  };

  const updateTxStatus = async (txId: string, status: string) => {
    try {
      await apiRequest("PUT", `/api/admin/transactions/${txId}/status`, { status });
      toast({ title: "Updated", description: `Transaction status set to ${status}` });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users", user.id, "transactions"] });
    } catch {
      toast({ title: "Error", description: "Failed to update transaction", variant: "destructive" });
    }
  };

  const onUpdateBalance = async (user: User) => {
    const amountStr = selectedCurrency === "USD" ? balanceUpdate : kesBalanceUpdate;
    if (!amountStr || !transactionDetails) {
      toast({
        title: "Error",
        description: "Please enter both amount and transaction details",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest("PUT", `/api/admin/users/${user.id}/balance`, {
        amount: parseFloat(amountStr),
        type: updateType,
        details: transactionDetails,
        currency: selectedCurrency,
      });

      if (response.ok) {
        toast({
          title: "Balance Updated",
          description: `Successfully updated balance for ${user.fullName}`,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
        setBalanceUpdate("");
        setKesBalanceUpdate("");
        setTransactionDetails("");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user balance",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onUpdateCard = async (action: string) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("PUT", `/api/admin/users/${user.id}/virtual-card`, {
        action,
      });

      if (response.ok) {
        const successMessages: Record<string, string> = {
          activate: "activated",
          freeze: "frozen",
          inactive: "permanently deactivated"
        };
        
        toast({
          title: "Card Updated",
          description: `Successfully ${successMessages[action] || action}d virtual card for ${user.fullName}`,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      }
    } catch (error: any) {
      const errorData = await error.response?.json?.() || {};
      
      if (errorData.requiresPurchase) {
        toast({
          title: "Cannot Reactivate",
          description: "This card is inactive. User must purchase a new card to reactivate.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to update virtual card",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccountAction = async (userId: string, action: string, extra?: Record<string, any>) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("PUT", `/api/admin/users/${userId}/account`, { action, ...extra });
      
      if (response.ok) {
        const actionMessages: Record<string, string> = {
          block: "Account blocked successfully",
          unblock: "Account unblocked successfully", 
          suspend: "Account suspended successfully",
          unsuspend: "Account suspension lifted",
          force_logout: "User logged out successfully",
          reset_password: "Password reset to 12345678",
          change_password: "Password changed successfully",
        };

        toast({
          title: "Done",
          description: actionMessages[action] || "Action completed successfully",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to perform account action",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSecurityAction = async (userId: string, action: string) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("PUT", `/api/admin/users/${userId}/security`, { action });
      
      if (response.ok) {
        const actionMessages: Record<string, string> = {
          reset_2fa: "Two-factor authentication reset successfully",
          verify_email: "Email marked as verified",
          verify_phone: "Phone number marked as verified"
        };

        toast({
          title: "Security Action Completed",
          description: actionMessages[action] || "Security action completed successfully",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to perform security action",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationAction = async (userId: string, action: string) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("PUT", `/api/admin/users/${userId}/notifications`, { action });
      
      if (response.ok) {
        toast({
          title: "Notification Settings Updated",
          description: action.includes("enable") ? "Notifications enabled for user" : "Notifications disabled for user",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update notification settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDataAction = async (userId: string, action: string) => {
    if (action === "view_activity") {
      toast({
        title: "Feature Coming Soon",
        description: "User activity logs will be available in the next update",
      });
      return;
    }

    if (action === "export_data") {
      setIsLoading(true);
      try {
        const response = await apiRequest("GET", `/api/admin/users/${userId}/export`);
        
        if (response.ok) {
          // Create download link for exported data
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `user-data-${userId}.json`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);

          toast({
            title: "Data Exported",
            description: "User data has been exported and downloaded",
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to export user data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSendNotification = async (userId: string) => {
    const title = (document.getElementById("notification-title") as HTMLInputElement)?.value;
    const message = (document.getElementById("notification-message") as HTMLInputElement)?.value;
    
    if (!title || !message) {
      toast({
        title: "Error",
        description: "Please enter both title and message",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest("POST", `/api/admin/users/${userId}/notification`, {
        title,
        message,
        type: "info"
      });
      
      if (response.ok) {
        toast({
          title: "Notification Sent",
          description: "Custom notification sent to user successfully",
        });

        // Clear form
        (document.getElementById("notification-title") as HTMLInputElement).value = "";
        (document.getElementById("notification-message") as HTMLInputElement).value = "";
      }
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to send notification",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const txStatusColor = (status: string) => {
    const map: Record<string, string> = {
      completed: "bg-green-100 text-green-700",
      pending: "bg-yellow-100 text-yellow-700",
      processing: "bg-blue-100 text-blue-700",
      failed: "bg-red-100 text-red-700",
      cancelled: "bg-gray-100 text-gray-600",
    };
    return map[status] || "bg-gray-100 text-gray-600";
  };

  return (
    <div className="space-y-4">
      {/* User ID + Status header */}
      <div className="flex items-start justify-between gap-3 p-3 bg-muted/50 rounded-xl">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground mb-1">User ID</p>
          <p className="font-mono text-xs truncate">{user.id}</p>
          {user.lastLoginAt && (
            <p className="text-xs text-muted-foreground mt-1">
              Last login: {format(new Date(user.lastLoginAt), "MMM dd, yyyy HH:mm")}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {user.isSuspended && (
            <Badge variant="destructive" className="text-xs">Suspended</Badge>
          )}
          {user.isBlocked && !user.isSuspended && (
            <Badge variant="destructive" className="text-xs">Blocked</Badge>
          )}
          <Button size="sm" variant="outline" onClick={copyUserId} className="h-8 text-xs">
            {copiedId ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
            {copiedId ? "Copied" : "Copy ID"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="w-full grid grid-cols-4 h-9">
          <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
          <TabsTrigger value="transactions" className="text-xs">Transactions</TabsTrigger>
          <TabsTrigger value="card" className="text-xs">Card</TabsTrigger>
          <TabsTrigger value="account" className="text-xs">Account</TabsTrigger>
        </TabsList>

        {/* ─── OVERVIEW TAB ─── */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2 bg-muted/40 p-3 rounded-xl">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Profile</p>
              {[
                { label: "Name", value: user.fullName },
                { label: "Email", value: user.email },
                { label: "Phone", value: user.phone },
                { label: "Country", value: user.country },
                { label: "Joined", value: format(new Date(user.createdAt), "MMM dd, yyyy") },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-[10px] text-muted-foreground">{label}</p>
                  <p className="text-xs font-medium break-all">{value}</p>
                </div>
              ))}
            </div>
            <div className="space-y-2 bg-muted/40 p-3 rounded-xl">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</p>
              {[
                { label: "Email", ok: user.isEmailVerified },
                { label: "Phone", ok: user.isPhoneVerified },
              ].map(({ label, ok }) => (
                <div key={label} className="flex justify-between items-center">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <Badge variant={ok ? "default" : "secondary"} className="text-[10px]">{ok ? "Verified" : "Unverified"}</Badge>
                </div>
              ))}
              <div className="flex justify-between items-center">
                <p className="text-xs text-muted-foreground">KYC</p>
                <Badge variant={user.kycStatus === "verified" ? "default" : "secondary"} className="text-[10px] capitalize">{user.kycStatus}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-xs text-muted-foreground">2FA</p>
                <Badge variant={user.twoFactorEnabled ? "default" : "outline"} className="text-[10px]">{user.twoFactorEnabled ? "On" : "Off"}</Badge>
              </div>
              <div className="pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground mb-1">Balances</p>
                <p className="text-sm font-bold text-primary">${user.balance || "0.00"} USD</p>
                <p className="text-xs font-semibold text-muted-foreground">KSh {user.kesBalance || "0.00"} KES</p>
              </div>
            </div>
          </div>

          {/* Balance Management */}
          <div className="bg-muted/40 p-4 rounded-xl space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <DollarSign className="w-3 h-3" /> Balance Adjustment
            </p>
            <div className="grid grid-cols-3 gap-2">
              <Select value={updateType} onValueChange={(v: "add" | "subtract" | "set") => setUpdateType(v)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">Add</SelectItem>
                  <SelectItem value="subtract">Subtract</SelectItem>
                  <SelectItem value="set">Set</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedCurrency} onValueChange={(v: "USD" | "KES") => setSelectedCurrency(v)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="KES">KES</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="number"
                step="0.01"
                className="h-8 text-xs"
                value={selectedCurrency === "USD" ? balanceUpdate : kesBalanceUpdate}
                onChange={(e) => selectedCurrency === "USD" ? setBalanceUpdate(e.target.value) : setKesBalanceUpdate(e.target.value)}
                placeholder="Amount"
              />
            </div>
            <Input
              className="h-8 text-xs"
              value={transactionDetails}
              onChange={(e) => setTransactionDetails(e.target.value)}
              placeholder="Description (e.g., Admin adjustment, Bonus)"
            />
            <Button
              onClick={() => onUpdateBalance(user)}
              disabled={isLoading || (!balanceUpdate && !kesBalanceUpdate)}
              size="sm"
              className="w-full h-8 text-xs"
            >
              {isLoading ? "Updating..." : "Update Balance"}
            </Button>
          </div>
        </TabsContent>

        {/* ─── TRANSACTIONS TAB ─── */}
        <TabsContent value="transactions" className="mt-4">
          {txLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : txList.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">No transactions found</div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {txList.map((tx: any) => (
                <div key={tx.id} className="bg-muted/40 rounded-xl p-3 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      tx.type === "receive" || tx.type === "deposit" ? "bg-primary/10" : "bg-muted"
                    }`}>
                      {tx.type === "receive" || tx.type === "deposit"
                        ? <ArrowDownLeft className="w-4 h-4 text-primary" />
                        : <ArrowUpRight className="w-4 h-4 text-muted-foreground" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold capitalize truncate">{tx.type?.replace("_", " ")}</p>
                      <p className="text-[10px] text-muted-foreground">{tx.createdAt ? format(new Date(tx.createdAt), "MMM dd, HH:mm") : ""}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${txStatusColor(tx.status)}`}>
                        {tx.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold">
                      {tx.currency === "KES" ? "KSh" : "$"}{parseFloat(tx.amount || "0").toFixed(2)}
                    </span>
                    <Select
                      value={tx.status}
                      onValueChange={(s) => updateTxStatus(tx.id, s)}
                    >
                      <SelectTrigger className="h-7 w-28 text-[10px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["pending", "processing", "completed", "failed", "cancelled"].map(s => (
                          <SelectItem key={s} value={s} className="text-xs capitalize">{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ─── CARD TAB ─── */}
        <TabsContent value="card" className="mt-4 space-y-4">
          {cardLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !card ? (
            <div className="text-center py-6 space-y-3">
              <CreditCard className="w-10 h-10 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">No virtual card found for this user</p>
              <Button size="sm" onClick={() => onUpdateCard("issue")} disabled={isLoading}>
                <CreditCard className="w-3 h-3 mr-2" /> Issue Card
              </Button>
            </div>
          ) : (
            <>
              {/* Card Visual */}
              <div className="relative rounded-2xl bg-gradient-to-br from-primary to-secondary p-5 text-white shadow-lg overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full translate-y-12 -translate-x-12" />
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <p className="text-xs text-white/70 font-medium">GreenPay Virtual</p>
                    <Badge className={`text-[10px] ${
                      card.status === "active" ? "bg-green-400/30 text-white border-green-400/30" :
                      card.status === "frozen" ? "bg-blue-400/30 text-white border-blue-400/30" :
                      "bg-red-400/30 text-white border-red-400/30"
                    }`}>
                      {card.status}
                    </Badge>
                  </div>
                  <p className="font-mono text-sm tracking-widest mb-4">
                    {showCardDetails ? card.cardNumber : card.cardNumber?.replace(/\d(?=\d{4})/g, "•")}
                  </p>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] text-white/60">Expires</p>
                      <p className="font-mono text-sm">{card.expiryDate}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/60">CVV</p>
                      <p className="font-mono text-sm">{showCardDetails ? card.cvv : "•••"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-white/60">Balance</p>
                      <p className="font-mono text-sm font-bold">${parseFloat(card.balance || "0").toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={() => setShowCardDetails(!showCardDetails)}
              >
                <Eye className="w-3 h-3 mr-2" />
                {showCardDetails ? "Hide" : "Show"} Full Details
              </Button>

              <div className="grid grid-cols-3 gap-2">
                <Button
                  size="sm"
                  variant={card.status === "active" ? "outline" : "default"}
                  className="text-xs h-9"
                  onClick={() => onUpdateCard("activate")}
                  disabled={isLoading || card.status === "active" || card.status === "inactive"}
                >
                  Activate
                </Button>
                <Button
                  size="sm"
                  variant={card.status === "frozen" ? "default" : "outline"}
                  className="text-xs h-9"
                  onClick={() => onUpdateCard(card.status === "frozen" ? "activate" : "freeze")}
                  disabled={isLoading || card.status === "inactive"}
                >
                  {card.status === "frozen" ? "Unfreeze" : "Freeze"}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="text-xs h-9"
                  onClick={() => onUpdateCard("inactive")}
                  disabled={isLoading || card.status === "inactive"}
                >
                  Block
                </Button>
              </div>
              {card.status === "inactive" && (
                <p className="text-xs text-destructive text-center">Card is blocked. User must purchase a new card.</p>
              )}
            </>
          )}
        </TabsContent>

        {/* ─── ACCOUNT TAB ─── */}
        <TabsContent value="account" className="mt-4 space-y-4">
          {/* Suspend / Unsuspend */}
          <div className="bg-muted/40 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <Ban className="w-3 h-3" /> Account Suspension
            </p>
            {user.isSuspended ? (
              <div className="space-y-2">
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-xs">
                  <p className="font-semibold text-destructive">Account is suspended</p>
                  {user.suspensionReason && <p className="text-muted-foreground mt-1">Reason: {user.suspensionReason}</p>}
                  {user.suspendedAt && <p className="text-muted-foreground">Since: {format(new Date(user.suspendedAt), "MMM dd, yyyy HH:mm")}</p>}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-xs border-green-500 text-green-600 hover:bg-green-50"
                  onClick={() => handleAccountAction(user.id, "unsuspend")}
                  disabled={isLoading}
                >
                  <Unlock className="w-3 h-3 mr-2" /> Lift Suspension
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Input
                  className="h-8 text-xs"
                  placeholder="Suspension reason (optional)"
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                />
                <Button
                  size="sm"
                  variant="destructive"
                  className="w-full text-xs"
                  onClick={() => handleAccountAction(user.id, "suspend", { reason: suspendReason })}
                  disabled={isLoading}
                >
                  <Ban className="w-3 h-3 mr-2" /> Suspend Account
                </Button>
              </div>
            )}
          </div>

          {/* Password Management */}
          <div className="bg-muted/40 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <Key className="w-3 h-3" /> Password Management
            </p>
            <div className="flex gap-2">
              <Input
                type="password"
                className="h-8 text-xs flex-1"
                placeholder="New password (min 6 chars)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs shrink-0"
                disabled={isLoading || newPassword.length < 6}
                onClick={() => handleAccountAction(user.id, "change_password", { newPassword })}
              >
                Set
              </Button>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="w-full text-xs"
              onClick={() => handleAccountAction(user.id, "reset_password")}
              disabled={isLoading}
            >
              <RefreshCw className="w-3 h-3 mr-2" /> Reset to Default (12345678)
            </Button>
          </div>

          {/* Quick Actions */}
          <div className="bg-muted/40 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <Settings className="w-3 h-3" /> Quick Actions
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" variant="outline" className="text-xs h-8"
                onClick={() => handleAccountAction(user.id, user.isBlocked ? "unblock" : "block")} disabled={isLoading}>
                {user.isBlocked ? <Unlock className="w-3 h-3 mr-1" /> : <Lock className="w-3 h-3 mr-1" />}
                {user.isBlocked ? "Unblock" : "Block"}
              </Button>
              <Button size="sm" variant="outline" className="text-xs h-8"
                onClick={() => handleAccountAction(user.id, "force_logout")} disabled={isLoading}>
                <LogOut className="w-3 h-3 mr-1" /> Force Logout
              </Button>
              <Button size="sm" variant="outline" className="text-xs h-8"
                onClick={() => handleSecurityAction(user.id, "reset_2fa")} disabled={isLoading}>
                <Shield className="w-3 h-3 mr-1" /> Reset 2FA
              </Button>
              <Button size="sm" variant="outline" className="text-xs h-8"
                onClick={() => handleSecurityAction(user.id, "verify_email")} disabled={isLoading}>
                <Mail className="w-3 h-3 mr-1" /> Verify Email
              </Button>
              <Button size="sm" variant="outline" className="text-xs h-8"
                onClick={() => handleSecurityAction(user.id, "verify_phone")} disabled={isLoading}>
                <Phone className="w-3 h-3 mr-1" /> Verify Phone
              </Button>
              <Button size="sm" variant="outline" className="text-xs h-8"
                onClick={() => handleNotificationAction(user.id, user.pushNotificationsEnabled ? "disable_notifications" : "enable_notifications")} disabled={isLoading}>
                {user.pushNotificationsEnabled ? <BellOff className="w-3 h-3 mr-1" /> : <Bell className="w-3 h-3 mr-1" />}
                {user.pushNotificationsEnabled ? "Mute" : "Unmute"}
              </Button>
              <Button size="sm" variant="outline" className="text-xs h-8"
                onClick={() => handleDataAction(user.id, "export_data")} disabled={isLoading}>
                <Download className="w-3 h-3 mr-1" /> Export Data
              </Button>
            </div>
          </div>

          {/* Send Notification */}
          <div className="bg-muted/40 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <Bell className="w-3 h-3" /> Send Notification
            </p>
            <Input id="notification-title" className="h-8 text-xs" placeholder="Title" />
            <Input id="notification-message" className="h-8 text-xs" placeholder="Message" />
            <Button size="sm" className="w-full text-xs h-8"
              onClick={() => handleSendNotification(user.id)} disabled={isLoading}>
              <Bell className="w-3 h-3 mr-2" /> Send
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}