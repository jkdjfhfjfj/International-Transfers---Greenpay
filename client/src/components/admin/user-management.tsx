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
  Pencil,
  Save,
  X,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  ShieldCheck,
  ShieldAlert,
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
  advancedKycStatus?: string;
  advancedKycRequested?: boolean;
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

  const requestAdvancedKycMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest("POST", `/api/admin/users/${userId}/request-advanced-kyc`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Advanced KYC Requested", description: "User will be prompted to complete advanced KYC." });
    },
    onError: () => toast({ title: "Error", description: "Failed to request advanced KYC.", variant: "destructive" }),
  });

  const cancelAdvancedKycRequestMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest("POST", `/api/admin/users/${userId}/cancel-advanced-kyc-request`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Request Cancelled", description: "Advanced KYC request has been removed." });
    },
    onError: () => toast({ title: "Error", description: "Failed to cancel request.", variant: "destructive" }),
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

                          {/* Request / Cancel Advanced KYC */}
                          {user.advancedKycStatus !== "verified" && (
                            user.advancedKycRequested ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => cancelAdvancedKycRequestMutation.mutate(user.id)}
                                disabled={cancelAdvancedKycRequestMutation.isPending}
                                title="Cancel Advanced KYC Request"
                                data-testid={`button-cancel-adv-kyc-${user.id}`}
                              >
                                <ShieldCheck className="w-4 h-4 text-blue-500" />
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => requestAdvancedKycMutation.mutate(user.id)}
                                disabled={requestAdvancedKycMutation.isPending}
                                title="Request Advanced KYC from user"
                                data-testid={`button-request-adv-kyc-${user.id}`}
                              >
                                <ShieldAlert className="w-4 h-4 text-amber-500" />
                              </Button>
                            )
                          )}

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
  // Local copy of user so account actions (suspend/unsuspend/block/unblock) update
  // the dialog immediately without waiting for a background query refetch.
  const [localUser, setLocalUser] = useState<User>(user);

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
  const [smsMessage, setSmsMessage] = useState("");
  const [smsSending, setSmsSending] = useState(false);

  // Transaction CRUD state
  const [editingTxId, setEditingTxId] = useState<string | null>(null);
  const [editTxData, setEditTxData] = useState<any>({});
  const [deletingTxId, setDeletingTxId] = useState<string | null>(null);
  const [editingCryptoTxId, setEditingCryptoTxId] = useState<string | null>(null);
  const [editCryptoTxData, setEditCryptoTxData] = useState<any>({});
  const [deletingCryptoTxId, setDeletingCryptoTxId] = useState<string | null>(null);
  const [txTab, setTxTab] = useState<"regular" | "crypto">("regular");

  // Edit profile state
  const [editingProfile, setEditingProfile] = useState(false);
  const [editName, setEditName] = useState(user.fullName);
  const [editEmail, setEditEmail] = useState(user.email);
  const [editPhone, setEditPhone] = useState(user.phone);
  const [editCountry, setEditCountry] = useState(user.country);
  // Edit KYC identity state (admin-only)
  const [editingKyc, setEditingKyc] = useState(false);
  const [editKycFullName, setEditKycFullName] = useState((user as any).kycFullName || '');
  const [editKycDob, setEditKycDob] = useState((user as any).kycDateOfBirth || '');
  const [editKycIdNumber, setEditKycIdNumber] = useState((user as any).kycIdNumber || '');
  const [editKycNationality, setEditKycNationality] = useState((user as any).kycNationality || '');
  const [editKycGender, setEditKycGender] = useState((user as any).kycGender || '');
  const [editKycAddress, setEditKycAddress] = useState((user as any).kycAddress || '');
  const [editKycDocType, setEditKycDocType] = useState((user as any).kycDocumentType || '');
  const [editKycExpiry, setEditKycExpiry] = useState((user as any).kycIdExpiryDate || '');
  const [editKycCountry, setEditKycCountry] = useState((user as any).kycIssuingCountry || '');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { fullName: string; email: string; phone: string; country: string }) => {
      const res = await apiRequest("PUT", `/api/admin/users/${user.id}/profile`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setEditingProfile(false);
      toast({ title: "Profile Updated", description: "User profile saved successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update user profile", variant: "destructive" });
    },
  });

  const updateKycIdentityMutation = useMutation({
    mutationFn: async (data: Record<string, string | null>) => {
      const res = await apiRequest("PUT", `/api/admin/users/${user.id}/profile`, data);
      if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setEditingKyc(false);
      toast({ title: "KYC Identity Updated", description: "Verified identity fields saved" });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message || "Failed to update KYC identity", variant: "destructive" });
    },
  });

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

  const { data: userCardsData, isLoading: cardsLoading } = useQuery({
    queryKey: ["/api/admin/users", user.id, "cards"],
    queryFn: async () => {
      const r = await apiRequest("GET", `/api/admin/users/${user.id}/cards`);
      return r.json();
    },
  });

  const txList = (userTransactions as any)?.transactions || [];
  const card = (userCard as any)?.card || null;
  const allCards: any[] = (userCardsData as any)?.cards || [];

  const { data: userCryptoTxData, isLoading: cryptoTxLoading } = useQuery({
    queryKey: ["/api/admin/users", user.id, "crypto-transactions"],
    queryFn: async () => {
      const r = await apiRequest("GET", `/api/admin/users/${user.id}/crypto-transactions`);
      return r.json();
    },
  });
  const cryptoTxList: any[] = (userCryptoTxData as any)?.transactions || [];

  const editTxMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const r = await apiRequest("PUT", `/api/admin/transactions/${id}/edit`, data);
      return r.json();
    },
    onSuccess: () => {
      toast({ title: "Saved", description: "Transaction updated successfully" });
      setEditingTxId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users", user.id, "transactions"] });
    },
    onError: () => toast({ title: "Error", description: "Failed to update transaction", variant: "destructive" }),
  });

  const deleteTxMutation = useMutation({
    mutationFn: async (id: string) => {
      const r = await apiRequest("DELETE", `/api/admin/transactions/${id}`);
      return r.json();
    },
    onSuccess: () => {
      toast({ title: "Deleted", description: "Transaction deleted" });
      setDeletingTxId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users", user.id, "transactions"] });
    },
    onError: () => toast({ title: "Error", description: "Failed to delete transaction", variant: "destructive" }),
  });

  const editCryptoTxMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const r = await apiRequest("PUT", `/api/admin/crypto/transactions/${id}/edit`, data);
      return r.json();
    },
    onSuccess: () => {
      toast({ title: "Saved", description: "Crypto transaction updated" });
      setEditingCryptoTxId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users", user.id, "crypto-transactions"] });
    },
    onError: () => toast({ title: "Error", description: "Failed to update crypto transaction", variant: "destructive" }),
  });

  const deleteCryptoTxMutation = useMutation({
    mutationFn: async (id: string) => {
      const r = await apiRequest("DELETE", `/api/admin/crypto/transactions/${id}`);
      return r.json();
    },
    onSuccess: () => {
      toast({ title: "Deleted", description: "Crypto transaction deleted" });
      setDeletingCryptoTxId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users", user.id, "crypto-transactions"] });
    },
    onError: () => toast({ title: "Error", description: "Failed to delete crypto transaction", variant: "destructive" }),
  });

  const startEditTx = (tx: any) => {
    setEditingTxId(tx.id);
    setEditTxData({
      type: tx.type || "",
      amount: tx.amount || "",
      currency: tx.currency || "USD",
      fee: tx.fee || "0.00",
      status: tx.status || "pending",
      description: tx.description || "",
      createdAt: tx.createdAt ? new Date(tx.createdAt).toISOString().slice(0, 16) : "",
    });
  };

  const startEditCryptoTx = (tx: any) => {
    setEditingCryptoTxId(tx.id);
    setEditCryptoTxData({
      coin: tx.coin || "",
      network: tx.network || "",
      amount: tx.amount || "",
      usdValue: tx.usdValue || "",
      status: tx.status || "pending",
      txHash: tx.txHash || "",
      adminNotes: tx.adminNotes || "",
      createdAt: tx.createdAt ? new Date(tx.createdAt).toISOString().slice(0, 16) : "",
    });
  };

  const { data: userDevicesData, isLoading: devicesLoading, refetch: refetchDevices } = useQuery({
    queryKey: ["/api/admin/users", user.id, "devices"],
    queryFn: async () => {
      const r = await apiRequest("GET", `/api/admin/users/${user.id}/devices`);
      return r.json();
    },
  });

  const userDevices: any[] = (userDevicesData as any)?.devices || [];

  const revokeUserSessionsMutation = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", `/api/admin/users/${user.id}/revoke-all-sessions`, {});
      return r.json();
    },
    onSuccess: () => {
      toast({ title: "Sessions Revoked", description: "All active sessions for this user have been terminated." });
      refetchDevices();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to revoke user sessions", variant: "destructive" });
    },
  });

  const getDeviceIcon = (deviceType: string) => {
    if (deviceType === 'mobile') return <Smartphone className="w-4 h-4 text-primary" />;
    if (deviceType === 'tablet') return <Tablet className="w-4 h-4 text-primary" />;
    return <Monitor className="w-4 h-4 text-primary" />;
  };

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
        const data = await response.json();
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

        // Immediately apply the updated user so the dialog reflects the new state
        // without waiting for the background query refetch cycle.
        if (data.user) {
          setLocalUser(data.user);
        }

        // Also refresh the list in the background
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
        <TabsList className="w-full grid grid-cols-5 h-9">
          <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
          <TabsTrigger value="transactions" className="text-xs">Txns</TabsTrigger>
          <TabsTrigger value="card" className="text-xs">Card</TabsTrigger>
          <TabsTrigger value="account" className="text-xs">Account</TabsTrigger>
          <TabsTrigger value="devices" className="text-xs">Devices</TabsTrigger>
        </TabsList>

        {/* ─── OVERVIEW TAB ─── */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2 bg-muted/40 p-3 rounded-xl">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Profile</p>
                {!editingProfile ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 text-xs px-2"
                    onClick={() => {
                      setEditName(user.fullName);
                      setEditEmail(user.email);
                      setEditPhone(user.phone);
                      setEditCountry(user.country);
                      setEditingProfile(true);
                    }}
                  >
                    <Pencil className="w-3 h-3 mr-1" /> Edit
                  </Button>
                ) : (
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 text-xs px-2 text-green-600"
                      disabled={updateProfileMutation.isPending}
                      onClick={() => updateProfileMutation.mutate({ fullName: editName, email: editEmail, phone: editPhone, country: editCountry })}
                    >
                      <Save className="w-3 h-3 mr-1" /> Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 text-xs px-2"
                      onClick={() => setEditingProfile(false)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
              {editingProfile ? (
                <div className="space-y-2">
                  {[
                    { label: "Name", value: editName, onChange: setEditName },
                    { label: "Email", value: editEmail, onChange: setEditEmail },
                    { label: "Phone", value: editPhone, onChange: setEditPhone },
                    { label: "Country", value: editCountry, onChange: setEditCountry },
                  ].map(({ label, value, onChange }) => (
                    <div key={label}>
                      <p className="text-[10px] text-muted-foreground">{label}</p>
                      <Input
                        className="h-7 text-xs"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                      />
                    </div>
                  ))}
                  <div>
                    <p className="text-[10px] text-muted-foreground">Joined</p>
                    <p className="text-xs font-medium">{format(new Date(user.createdAt), "MMM dd, yyyy")}</p>
                  </div>
                </div>
              ) : (
                <>
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
                </>
              )}
            </div>
            {/* KYC Verified Identity — admin editable */}
            {user.kycStatus === 'verified' && (
              <div className="space-y-2 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 p-3 rounded-xl">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide flex items-center gap-1">
                    <span>🛡</span> Verified Identity
                  </p>
                  {!editingKyc ? (
                    <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={() => setEditingKyc(true)}>
                      <Pencil className="w-3 h-3 mr-1" /> Edit
                    </Button>
                  ) : (
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="h-6 text-xs px-2 text-green-600"
                        disabled={updateKycIdentityMutation.isPending}
                        onClick={() => updateKycIdentityMutation.mutate({
                          kycFullName: editKycFullName || null,
                          kycDateOfBirth: editKycDob || null,
                          kycIdNumber: editKycIdNumber || null,
                          kycNationality: editKycNationality || null,
                          kycGender: editKycGender || null,
                          kycAddress: editKycAddress || null,
                          kycDocumentType: editKycDocType || null,
                          kycIdExpiryDate: editKycExpiry || null,
                          kycIssuingCountry: editKycCountry || null,
                        })}>
                        <Save className="w-3 h-3 mr-1" /> Save
                      </Button>
                      <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={() => setEditingKyc(false)}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
                {editingKyc ? (
                  <div className="space-y-2">
                    {[
                      { label: "Full Name (KYC)", value: editKycFullName, onChange: setEditKycFullName },
                      { label: "Date of Birth", value: editKycDob, onChange: setEditKycDob },
                      { label: "ID / Doc Number", value: editKycIdNumber, onChange: setEditKycIdNumber },
                      { label: "Nationality", value: editKycNationality, onChange: setEditKycNationality },
                      { label: "Gender", value: editKycGender, onChange: setEditKycGender },
                      { label: "Document Type", value: editKycDocType, onChange: setEditKycDocType },
                      { label: "Doc Expiry", value: editKycExpiry, onChange: setEditKycExpiry },
                      { label: "Issuing Country", value: editKycCountry, onChange: setEditKycCountry },
                      { label: "Address (from ID)", value: editKycAddress, onChange: setEditKycAddress },
                    ].map(({ label, value, onChange }) => (
                      <div key={label}>
                        <p className="text-[10px] text-muted-foreground">{label}</p>
                        <Input className="h-7 text-xs" value={value} onChange={(e) => onChange(e.target.value)} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {[
                      { label: "Full Name", value: (user as any).kycFullName },
                      { label: "Date of Birth", value: (user as any).kycDateOfBirth },
                      { label: "ID / Doc Number", value: (user as any).kycIdNumber },
                      { label: "Nationality", value: (user as any).kycNationality },
                      { label: "Gender", value: (user as any).kycGender },
                      { label: "Document Type", value: (user as any).kycDocumentType },
                      { label: "Doc Expiry", value: (user as any).kycIdExpiryDate },
                      { label: "Issuing Country", value: (user as any).kycIssuingCountry },
                      { label: "Address (from ID)", value: (user as any).kycAddress },
                    ].filter(f => f.value).map(({ label, value }) => (
                      <div key={label} className="flex justify-between items-start gap-2">
                        <p className="text-[10px] text-muted-foreground shrink-0">{label}</p>
                        <p className="text-[10px] font-medium text-right break-all">{value}</p>
                      </div>
                    ))}
                    {![(user as any).kycFullName, (user as any).kycIdNumber, (user as any).kycDateOfBirth].some(Boolean) && (
                      <p className="text-[10px] text-muted-foreground italic">No identity data extracted yet — use Poll Didit to sync.</p>
                    )}
                  </div>
                )}
              </div>
            )}

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
        <TabsContent value="transactions" className="mt-4 space-y-3">
          {/* Sub-tabs: Regular / Crypto */}
          <div className="flex gap-1 bg-muted/50 rounded-lg p-1">
            <button
              onClick={() => setTxTab("regular")}
              className={`flex-1 text-xs py-1 rounded-md font-medium transition-colors ${txTab === "regular" ? "bg-white dark:bg-card shadow text-primary" : "text-muted-foreground hover:text-foreground"}`}
              data-testid="button-tx-tab-regular"
            >
              Regular ({txList.length})
            </button>
            <button
              onClick={() => setTxTab("crypto")}
              className={`flex-1 text-xs py-1 rounded-md font-medium transition-colors ${txTab === "crypto" ? "bg-white dark:bg-card shadow text-primary" : "text-muted-foreground hover:text-foreground"}`}
              data-testid="button-tx-tab-crypto"
            >
              Crypto ({cryptoTxList.length})
            </button>
          </div>

          {/* ── Regular transactions ── */}
          {txTab === "regular" && (
            txLoading ? (
              <div className="flex justify-center py-8"><div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
            ) : txList.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">No transactions found</div>
            ) : (
              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {txList.map((tx: any) => (
                  <div key={tx.id} className="bg-muted/40 rounded-xl overflow-hidden" data-testid={`card-tx-${tx.id}`}>
                    {editingTxId === tx.id ? (
                      /* ── Edit form ── */
                      <div className="p-3 space-y-2">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Editing transaction</p>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-muted-foreground">Type</label>
                            <Select value={editTxData.type} onValueChange={v => setEditTxData((d: any) => ({ ...d, type: v }))}>
                              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {["deposit","withdraw","send","receive","exchange","airtime","bills","card_purchase"].map(t => (
                                  <SelectItem key={t} value={t} className="text-xs capitalize">{t.replace("_"," ")}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-[10px] text-muted-foreground">Status</label>
                            <Select value={editTxData.status} onValueChange={v => setEditTxData((d: any) => ({ ...d, status: v }))}>
                              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {["pending","processing","completed","failed","cancelled"].map(s => (
                                  <SelectItem key={s} value={s} className="text-xs capitalize">{s}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-[10px] text-muted-foreground">Amount</label>
                            <Input className="h-7 text-xs" value={editTxData.amount} onChange={e => setEditTxData((d: any) => ({ ...d, amount: e.target.value }))} />
                          </div>
                          <div>
                            <label className="text-[10px] text-muted-foreground">Currency</label>
                            <Select value={editTxData.currency} onValueChange={v => setEditTxData((d: any) => ({ ...d, currency: v }))}>
                              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {["USD","KES","EUR","GBP","NGN"].map(c => (
                                  <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-[10px] text-muted-foreground">Fee</label>
                            <Input className="h-7 text-xs" value={editTxData.fee} onChange={e => setEditTxData((d: any) => ({ ...d, fee: e.target.value }))} />
                          </div>
                          <div>
                            <label className="text-[10px] text-muted-foreground">Date & Time</label>
                            <Input type="datetime-local" className="h-7 text-xs" value={editTxData.createdAt} onChange={e => setEditTxData((d: any) => ({ ...d, createdAt: e.target.value }))} />
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] text-muted-foreground">Description</label>
                          <Input className="h-7 text-xs" value={editTxData.description} onChange={e => setEditTxData((d: any) => ({ ...d, description: e.target.value }))} />
                        </div>
                        <div className="flex gap-2 pt-1">
                          <Button size="sm" className="h-7 text-xs flex-1" onClick={() => editTxMutation.mutate({ id: tx.id, data: editTxData })} disabled={editTxMutation.isPending}>
                            <Save className="w-3 h-3 mr-1" />{editTxMutation.isPending ? "Saving…" : "Save"}
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setEditingTxId(null)}><X className="w-3 h-3" /></Button>
                        </div>
                      </div>
                    ) : deletingTxId === tx.id ? (
                      /* ── Delete confirm ── */
                      <div className="p-3 space-y-2">
                        <p className="text-xs font-semibold text-destructive">Delete this transaction?</p>
                        <p className="text-[10px] text-muted-foreground">This action cannot be undone.</p>
                        <div className="flex gap-2">
                          <Button size="sm" variant="destructive" className="h-7 text-xs flex-1" onClick={() => deleteTxMutation.mutate(tx.id)} disabled={deleteTxMutation.isPending}>
                            <Trash2 className="w-3 h-3 mr-1" />{deleteTxMutation.isPending ? "Deleting…" : "Confirm Delete"}
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setDeletingTxId(null)}><X className="w-3 h-3" /></Button>
                        </div>
                      </div>
                    ) : (
                      /* ── Normal row ── */
                      <div className="p-3 flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${tx.type === "receive" || tx.type === "deposit" ? "bg-primary/10" : "bg-muted"}`}>
                            {tx.type === "receive" || tx.type === "deposit"
                              ? <ArrowDownLeft className="w-4 h-4 text-primary" />
                              : <ArrowUpRight className="w-4 h-4 text-muted-foreground" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold capitalize truncate">{tx.type?.replace("_", " ")}</p>
                            <p className="text-[10px] text-muted-foreground">{tx.createdAt ? format(new Date(tx.createdAt), "MMM dd, yyyy HH:mm") : ""}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{tx.description}</p>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${txStatusColor(tx.status)}`}>{tx.status}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className="text-xs font-bold">{tx.currency === "KES" ? "KSh" : "$"}{parseFloat(tx.amount || "0").toFixed(2)}</span>
                          {tx.fee && parseFloat(tx.fee) > 0 && <span className="text-[10px] text-muted-foreground">Fee: {tx.currency === "KES" ? "KSh" : "$"}{parseFloat(tx.fee).toFixed(2)}</span>}
                          <div className="flex gap-1 mt-1">
                            <Button size="sm" variant="outline" className="h-6 px-2 text-[10px]" onClick={() => startEditTx(tx)} data-testid={`button-edit-tx-${tx.id}`}>
                              <Pencil className="w-3 h-3 mr-1" />Edit
                            </Button>
                            <Button size="sm" variant="outline" className="h-6 px-2 text-[10px] text-destructive hover:text-destructive" onClick={() => setDeletingTxId(tx.id)} data-testid={`button-delete-tx-${tx.id}`}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          )}

          {/* ── Crypto transactions ── */}
          {txTab === "crypto" && (
            cryptoTxLoading ? (
              <div className="flex justify-center py-8"><div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
            ) : cryptoTxList.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">No crypto transactions found</div>
            ) : (
              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {cryptoTxList.map((tx: any) => (
                  <div key={tx.id} className="bg-muted/40 rounded-xl overflow-hidden" data-testid={`card-crypto-tx-${tx.id}`}>
                    {editingCryptoTxId === tx.id ? (
                      /* ── Edit form ── */
                      <div className="p-3 space-y-2">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Editing crypto transaction</p>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-muted-foreground">Coin</label>
                            <Input className="h-7 text-xs" value={editCryptoTxData.coin} onChange={e => setEditCryptoTxData((d: any) => ({ ...d, coin: e.target.value }))} />
                          </div>
                          <div>
                            <label className="text-[10px] text-muted-foreground">Network</label>
                            <Input className="h-7 text-xs" value={editCryptoTxData.network} onChange={e => setEditCryptoTxData((d: any) => ({ ...d, network: e.target.value }))} />
                          </div>
                          <div>
                            <label className="text-[10px] text-muted-foreground">Amount (crypto)</label>
                            <Input className="h-7 text-xs" value={editCryptoTxData.amount} onChange={e => setEditCryptoTxData((d: any) => ({ ...d, amount: e.target.value }))} />
                          </div>
                          <div>
                            <label className="text-[10px] text-muted-foreground">USD Value</label>
                            <Input className="h-7 text-xs" value={editCryptoTxData.usdValue} onChange={e => setEditCryptoTxData((d: any) => ({ ...d, usdValue: e.target.value }))} />
                          </div>
                          <div>
                            <label className="text-[10px] text-muted-foreground">Status</label>
                            <Select value={editCryptoTxData.status} onValueChange={v => setEditCryptoTxData((d: any) => ({ ...d, status: v }))}>
                              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {["pending","confirming","completed","failed","cancelled"].map(s => (
                                  <SelectItem key={s} value={s} className="text-xs capitalize">{s}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-[10px] text-muted-foreground">Date & Time</label>
                            <Input type="datetime-local" className="h-7 text-xs" value={editCryptoTxData.createdAt} onChange={e => setEditCryptoTxData((d: any) => ({ ...d, createdAt: e.target.value }))} />
                          </div>
                          <div className="col-span-2">
                            <label className="text-[10px] text-muted-foreground">TX Hash</label>
                            <Input className="h-7 text-xs font-mono" value={editCryptoTxData.txHash} onChange={e => setEditCryptoTxData((d: any) => ({ ...d, txHash: e.target.value }))} />
                          </div>
                          <div className="col-span-2">
                            <label className="text-[10px] text-muted-foreground">Admin Notes</label>
                            <Input className="h-7 text-xs" value={editCryptoTxData.adminNotes} onChange={e => setEditCryptoTxData((d: any) => ({ ...d, adminNotes: e.target.value }))} />
                          </div>
                        </div>
                        <div className="flex gap-2 pt-1">
                          <Button size="sm" className="h-7 text-xs flex-1" onClick={() => editCryptoTxMutation.mutate({ id: tx.id, data: editCryptoTxData })} disabled={editCryptoTxMutation.isPending}>
                            <Save className="w-3 h-3 mr-1" />{editCryptoTxMutation.isPending ? "Saving…" : "Save"}
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setEditingCryptoTxId(null)}><X className="w-3 h-3" /></Button>
                        </div>
                      </div>
                    ) : deletingCryptoTxId === tx.id ? (
                      /* ── Delete confirm ── */
                      <div className="p-3 space-y-2">
                        <p className="text-xs font-semibold text-destructive">Delete this crypto transaction?</p>
                        <p className="text-[10px] text-muted-foreground">This action cannot be undone.</p>
                        <div className="flex gap-2">
                          <Button size="sm" variant="destructive" className="h-7 text-xs flex-1" onClick={() => deleteCryptoTxMutation.mutate(tx.id)} disabled={deleteCryptoTxMutation.isPending}>
                            <Trash2 className="w-3 h-3 mr-1" />{deleteCryptoTxMutation.isPending ? "Deleting…" : "Confirm Delete"}
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setDeletingCryptoTxId(null)}><X className="w-3 h-3" /></Button>
                        </div>
                      </div>
                    ) : (
                      /* ── Normal crypto row ── */
                      <div className="p-3 flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${tx.type === "deposit" ? "bg-primary/10" : "bg-muted"}`}>
                            {tx.type === "deposit"
                              ? <ArrowDownLeft className="w-4 h-4 text-primary" />
                              : <ArrowUpRight className="w-4 h-4 text-muted-foreground" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold capitalize truncate">{tx.coin} {tx.type}</p>
                            <p className="text-[10px] text-muted-foreground">{tx.network} · {tx.createdAt ? format(new Date(tx.createdAt), "MMM dd, yyyy HH:mm") : ""}</p>
                            {tx.txHash && <p className="text-[10px] text-muted-foreground font-mono truncate">TX: {tx.txHash.slice(0, 16)}…</p>}
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${txStatusColor(tx.status)}`}>{tx.status}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className="text-xs font-bold">{tx.amount} {tx.coin}</span>
                          <span className="text-[10px] text-muted-foreground">${parseFloat(tx.usdValue || "0").toFixed(2)} USD</span>
                          <div className="flex gap-1 mt-1">
                            <Button size="sm" variant="outline" className="h-6 px-2 text-[10px]" onClick={() => startEditCryptoTx(tx)} data-testid={`button-edit-crypto-tx-${tx.id}`}>
                              <Pencil className="w-3 h-3 mr-1" />Edit
                            </Button>
                            <Button size="sm" variant="outline" className="h-6 px-2 text-[10px] text-destructive hover:text-destructive" onClick={() => setDeletingCryptoTxId(tx.id)} data-testid={`button-delete-crypto-tx-${tx.id}`}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          )}
        </TabsContent>

        {/* ─── CARD TAB ─── */}
        <TabsContent value="card" className="mt-4 space-y-4">
          {cardLoading || cardsLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : allCards.length === 0 && !card ? (
            <div className="text-center py-6 space-y-3">
              <CreditCard className="w-10 h-10 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">No virtual card found for this user</p>
              <Button size="sm" onClick={() => onUpdateCard("issue")} disabled={isLoading}>
                <CreditCard className="w-3 h-3 mr-2" /> Issue Card
              </Button>
            </div>
          ) : (
            <>
              {/* All Cards Summary */}
              {allCards.length > 1 && (
                <div className="bg-muted/40 rounded-lg p-3 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    All Cards ({allCards.length})
                  </p>
                  <div className="space-y-1.5">
                    {allCards.map((c, idx) => (
                      <div key={c.id} className="flex items-center justify-between text-xs bg-card rounded p-2 border border-border" data-testid={`row-card-${c.id}`}>
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-3 h-3 text-muted-foreground" />
                          <span className="font-mono">•••• {c.cardNumber?.slice(-4)}</span>
                          <span className="text-muted-foreground">{format(new Date(c.purchaseDate), "MMM d, yyyy")}</span>
                        </div>
                        <Badge variant={c.status === "active" ? "default" : c.status === "frozen" ? "secondary" : "destructive"} className="text-[10px]">
                          {c.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground italic">Active card details shown below.</p>
                </div>
              )}

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
            {localUser.isSuspended ? (
              <div className="space-y-2">
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-xs">
                  <p className="font-semibold text-destructive">Account is suspended</p>
                  {localUser.suspensionReason && <p className="text-muted-foreground mt-1">Reason: {localUser.suspensionReason}</p>}
                  {localUser.suspendedAt && <p className="text-muted-foreground">Since: {format(new Date(localUser.suspendedAt), "MMM dd, yyyy HH:mm")}</p>}
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
              <Bell className="w-3 h-3" /> Send In-App Notification
            </p>
            <Input id="notification-title" className="h-8 text-xs" placeholder="Title" />
            <Input id="notification-message" className="h-8 text-xs" placeholder="Message" />
            <Button size="sm" className="w-full text-xs h-8"
              onClick={() => handleSendNotification(user.id)} disabled={isLoading}>
              <Bell className="w-3 h-3 mr-2" /> Send Notification
            </Button>
          </div>

          {/* Send SMS */}
          <div className="bg-muted/40 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <Phone className="w-3 h-3" /> Send SMS to {user.fullName?.split(' ')[0]}
            </p>
            {user.phone ? (
              <>
                <p className="text-xs text-muted-foreground">Sending to: <span className="font-mono font-medium">{user.phone}</span></p>
                <Input
                  className="h-8 text-xs"
                  placeholder="SMS message (max 160 chars)"
                  maxLength={160}
                  value={smsMessage}
                  onChange={(e) => setSmsMessage(e.target.value)}
                  data-testid="input-user-sms-message"
                />
                <p className="text-[10px] text-muted-foreground text-right">{smsMessage.length}/160 — [GREENPAY] prefix added automatically</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-xs h-8 border-primary/40 text-primary hover:bg-primary/5"
                  disabled={smsSending || !smsMessage.trim()}
                  onClick={async () => {
                    setSmsSending(true);
                    try {
                      const r = await apiRequest("POST", "/api/admin/sms/send-user", { userId: user.id, message: smsMessage.trim() });
                      const result = await r.json();
                      if (result.success) {
                        toast({ title: "SMS Sent", description: `Message delivered to ${user.phone}` });
                        setSmsMessage("");
                      } else {
                        toast({ title: "Send Failed", description: result.message || "Failed to send SMS", variant: "destructive" });
                      }
                    } catch {
                      toast({ title: "Error", description: "Failed to send SMS", variant: "destructive" });
                    } finally {
                      setSmsSending(false);
                    }
                  }}
                  data-testid="button-send-user-sms"
                >
                  <Phone className="w-3 h-3 mr-2" /> {smsSending ? "Sending..." : "Send SMS"}
                </Button>
              </>
            ) : (
              <p className="text-xs text-destructive">This user has no phone number registered.</p>
            )}
          </div>
        </TabsContent>

        {/* ─── DEVICES TAB ─── */}
        <TabsContent value="devices" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Login History & Active Sessions</p>
            <Button
              size="sm"
              variant="outline"
              className="text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={() => revokeUserSessionsMutation.mutate()}
              disabled={revokeUserSessionsMutation.isPending}
            >
              <LogOut className="w-3 h-3 mr-1" />
              {revokeUserSessionsMutation.isPending ? "Revoking..." : "Revoke All Sessions"}
            </Button>
          </div>

          {devicesLoading ? (
            <div className="text-center py-8 text-sm text-muted-foreground">Loading devices...</div>
          ) : userDevices.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              <Monitor className="w-8 h-8 mx-auto mb-2 opacity-30" />
              No login history found
            </div>
          ) : (
            <div className="space-y-2">
              {userDevices.map((device: any, i: number) => (
                <div key={device.id || i} className="bg-muted/40 border border-border rounded-xl p-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      {getDeviceIcon(device.deviceType || 'desktop')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-sm truncate">
                          {device.browser || 'Unknown Browser'}
                          {device.deviceType && (
                            <span className="text-muted-foreground font-normal"> · {device.deviceType}</span>
                          )}
                        </p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${
                          device.status === 'success'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        }`}>
                          {device.status === 'success' ? 'Success' : 'Failed'}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                        {device.ipAddress && (
                          <span className="text-xs text-muted-foreground">{device.ipAddress}</span>
                        )}
                        {device.location && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Globe className="w-3 h-3" /> {device.location}
                          </span>
                        )}
                      </div>
                      {device.createdAt && (
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(device.createdAt), "MMM dd, yyyy HH:mm")}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}