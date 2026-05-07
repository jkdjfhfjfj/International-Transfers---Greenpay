import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  FileCheck, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Image,
  User,
  Calendar,
  MapPin,
  AlertTriangle
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface KycDocument {
  id: string;
  userId: string;
  documentType: string;
  frontImageUrl: string | null;
  backImageUrl: string | null;
  selfieUrl: string | null;
  dateOfBirth: string | null;
  address: string | null;
  status: string;
  verificationNotes: string | null;
  verifiedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
}

interface KycResponse {
  kycDocuments: KycDocument[];
}

export default function KycManagement() {
  const [selectedKyc, setSelectedKyc] = useState<KycDocument | null>(null);
  const [reviewStatus, setReviewStatus] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");
  const [viewKyc, setViewKyc] = useState<KycDocument | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: kycData, isLoading, error } = useQuery<KycResponse>({
    queryKey: ["/api/admin/kyc"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/kyc");
      return response.json();
    },
  });

  const updateKycMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes: string }) => {
      const response = await apiRequest("PUT", `/api/admin/kyc/${id}`, {
        status,
        verificationNotes: notes,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/kyc"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
      toast({
        title: "KYC Updated",
        description: "KYC document status has been updated successfully",
      });
      setSelectedKyc(null);
      setReviewStatus("");
      setReviewNotes("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update KYC document",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return <Badge variant="default" className="bg-green-500">Verified</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending Review</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDocumentTypeName = (type: string) => {
    switch (type) {
      case "national_id":
        return "National ID";
      case "passport":
        return "Passport";
      case "drivers_license":
        return "Driver's License";
      default:
        return type;
    }
  };

  const handleSubmitReview = () => {
    if (!selectedKyc || !reviewStatus) return;
    
    updateKycMutation.mutate({
      id: selectedKyc.id,
      status: reviewStatus,
      notes: reviewNotes,
    });
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Failed to load KYC documents
          </div>
        </CardContent>
      </Card>
    );
  }

  const pendingKyc = kycData?.kycDocuments.filter(doc => doc.status === "pending") || [];
  const reviewedKyc = kycData?.kycDocuments.filter(doc => doc.status !== "pending") || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="w-5 h-5" />
            KYC Document Review
          </CardTitle>
          <CardDescription>
            Review and approve user identity verification documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600">{pendingKyc.length}</p>
              <p className="text-sm text-yellow-600">Pending Review</p>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-2xl font-bold text-green-600">
                {reviewedKyc.filter(doc => doc.status === "verified").length}
              </p>
              <p className="text-sm text-green-600">Verified</p>
            </div>
            <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-2xl font-bold text-red-600">
                {reviewedKyc.filter(doc => doc.status === "rejected").length}
              </p>
              <p className="text-sm text-red-600">Rejected</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending Reviews */}
      {pendingKyc.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-600">
              <AlertTriangle className="w-5 h-5" />
              Pending Reviews ({pendingKyc.length})
            </CardTitle>
            <CardDescription>
              Documents awaiting verification
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User ID</TableHead>
                    <TableHead>Document Type</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Documents</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingKyc.map((kyc) => (
                    <TableRow key={kyc.id}>
                      <TableCell>
                        <span className="font-mono text-sm">{kyc.userId.slice(0, 8)}...</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{getDocumentTypeName(kyc.documentType)}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {format(new Date(kyc.createdAt), "MMM dd, yyyy")}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {kyc.frontImageUrl && (
                            <Badge variant="outline" className="text-xs">Front</Badge>
                          )}
                          {kyc.backImageUrl && (
                            <Badge variant="outline" className="text-xs">Back</Badge>
                          )}
                          {kyc.selfieUrl && (
                            <Badge variant="outline" className="text-xs">Selfie</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(kyc.status)}
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedKyc(kyc)}
                              data-testid={`button-review-kyc-${kyc.id}`}
                            >
                              <Eye className="w-4 h-4" />
                              Review
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>KYC Document Review</DialogTitle>
                              <DialogDescription>
                                Review identity verification documents for user {kyc.userId.slice(0, 8)}...
                              </DialogDescription>
                            </DialogHeader>
                            {selectedKyc && (
                              <KycReviewDialog 
                                kyc={selectedKyc} 
                                onSubmit={handleSubmitReview}
                                reviewStatus={reviewStatus}
                                setReviewStatus={setReviewStatus}
                                reviewNotes={reviewNotes}
                                setReviewNotes={setReviewNotes}
                                isLoading={updateKycMutation.isPending}
                              />
                            )}
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* All Documents */}
      <Card>
        <CardHeader>
          <CardTitle>All KYC Documents</CardTitle>
          <CardDescription>
            Complete history of KYC document submissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User ID</TableHead>
                  <TableHead>Document Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {kycData?.kycDocuments.map((kyc) => (
                  <TableRow key={kyc.id}>
                    <TableCell>
                      <span className="font-mono text-sm">{kyc.userId.slice(0, 8)}...</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{getDocumentTypeName(kyc.documentType)}</span>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(kyc.status)}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {format(new Date(kyc.createdAt), "MMM dd, yyyy")}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {kyc.verifiedAt ? format(new Date(kyc.verifiedAt), "MMM dd, yyyy") : "-"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewKyc(kyc)}
                        data-testid={`button-view-kyc-${kyc.id}`}
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Advanced KYC Section */}
      <AdvancedKycSection />

      {/* View-only KYC details dialog (for reviewed/verified docs) */}
      <Dialog open={!!viewKyc} onOpenChange={(open) => { if (!open) setViewKyc(null); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>KYC Document Details</DialogTitle>
            <DialogDescription>
              {viewKyc && `Submitted by user ${viewKyc.userId.slice(0, 8)}... — Status: ${viewKyc.status}`}
            </DialogDescription>
          </DialogHeader>
          {viewKyc && (
            <div className="space-y-6">
              {/* Info grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Document Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2"><FileCheck className="w-4 h-4" /><span>Type: {getDocumentTypeName(viewKyc.documentType)}</span></div>
                    <div className="flex items-center gap-2"><Calendar className="w-4 h-4" /><span>DOB: {viewKyc.dateOfBirth || "Not provided"}</span></div>
                    <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /><span>Address: {viewKyc.address || "Not provided"}</span></div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Review Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2"><User className="w-4 h-4" /><span>User: {viewKyc.userId.slice(0, 8)}...</span></div>
                    <div className="flex items-center gap-2"><Calendar className="w-4 h-4" /><span>Submitted: {format(new Date(viewKyc.createdAt), "MMM dd, yyyy HH:mm")}</span></div>
                    {viewKyc.verifiedAt && (
                      <div className="flex items-center gap-2"><Calendar className="w-4 h-4" /><span>Reviewed: {format(new Date(viewKyc.verifiedAt), "MMM dd, yyyy HH:mm")}</span></div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Status:</span>
                      {getStatusBadge(viewKyc.status)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Document images */}
              <div>
                <h4 className="font-medium mb-4">Document Images</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {viewKyc.frontImageUrl && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Front Image</p>
                      <div className="border rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800">
                        <img src={viewKyc.frontImageUrl} alt="Front" className="w-full h-48 object-cover cursor-pointer hover:scale-105 transition-transform" onClick={() => window.open(viewKyc.frontImageUrl!, '_blank')} />
                        <p className="text-xs text-center p-2 text-gray-500">Click to view full size</p>
                      </div>
                    </div>
                  )}
                  {viewKyc.backImageUrl && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Back Image</p>
                      <div className="border rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800">
                        <img src={viewKyc.backImageUrl} alt="Back" className="w-full h-48 object-cover cursor-pointer hover:scale-105 transition-transform" onClick={() => window.open(viewKyc.backImageUrl!, '_blank')} />
                        <p className="text-xs text-center p-2 text-gray-500">Click to view full size</p>
                      </div>
                    </div>
                  )}
                  {viewKyc.selfieUrl && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Selfie</p>
                      <div className="border rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800">
                        <img src={viewKyc.selfieUrl} alt="Selfie" className="w-full h-48 object-cover cursor-pointer hover:scale-105 transition-transform" onClick={() => window.open(viewKyc.selfieUrl!, '_blank')} />
                        <p className="text-xs text-center p-2 text-gray-500">Click to view full size</p>
                      </div>
                    </div>
                  )}
                  {!viewKyc.frontImageUrl && !viewKyc.backImageUrl && !viewKyc.selfieUrl && (
                    <p className="text-sm text-muted-foreground col-span-3">No document images available.</p>
                  )}
                </div>
              </div>

              {/* Review notes */}
              {viewKyc.verificationNotes && (
                <div className="p-4 bg-muted rounded-lg">
                  <h5 className="font-medium mb-2">Review Notes</h5>
                  <p className="text-sm text-muted-foreground">{viewKyc.verificationNotes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface AdvancedKycDoc {
  id: number;
  userId: string;
  faceScanUrl: string | null;
  addressProofUrl: string | null;
  addressText: string | null;
  status: string;
  reviewNotes: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

function AdvancedKycSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<AdvancedKycDoc | null>(null);
  const [reviewStatus, setReviewStatus] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");

  const { data, isLoading } = useQuery<{ submissions: AdvancedKycDoc[] }>({
    queryKey: ["/api/admin/kyc/advanced"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/kyc/advanced");
      return res.json();
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: number; status: string; notes: string }) => {
      const res = await apiRequest("PUT", `/api/admin/kyc/advanced/${id}`, { status, reviewNotes: notes });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/kyc/advanced"] });
      toast({ title: "Advanced KYC Updated", description: "Status updated successfully." });
      setSelected(null);
      setReviewStatus("");
      setReviewNotes("");
    },
    onError: () => toast({ title: "Error", description: "Failed to update advanced KYC.", variant: "destructive" }),
  });

  const submissions = data?.submissions || [];
  const pending = submissions.filter(s => s.status === "pending");

  const statusBadge = (s: string) => {
    if (s === "approved") return <Badge className="bg-green-500 text-white">Approved</Badge>;
    if (s === "rejected") return <Badge variant="destructive">Rejected</Badge>;
    return <Badge variant="secondary">Pending</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-blue-500" />
          Advanced KYC Review
          {pending.length > 0 && <Badge className="bg-yellow-500 text-white ml-2">{pending.length} pending</Badge>}
        </CardTitle>
        <CardDescription>Review facial verification and address proof documents for advanced KYC tier</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : submissions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No advanced KYC submissions yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User ID</TableHead>
                <TableHead>Documents</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell><span className="font-mono text-sm">{sub.userId.slice(0, 8)}...</span></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {sub.faceScanUrl && <Badge variant="outline" className="text-xs">Face Scan</Badge>}
                      {sub.addressProofUrl && <Badge variant="outline" className="text-xs">Address Proof</Badge>}
                    </div>
                  </TableCell>
                  <TableCell><span className="text-sm max-w-32 truncate block">{sub.addressText || "-"}</span></TableCell>
                  <TableCell>{statusBadge(sub.status)}</TableCell>
                  <TableCell><span className="text-sm">{format(new Date(sub.createdAt), "MMM dd, yyyy")}</span></TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={() => { setSelected(sub); setReviewStatus(""); setReviewNotes(sub.reviewNotes || ""); }}>
                          <Eye className="w-4 h-4 mr-1" />
                          Review
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Advanced KYC Review</DialogTitle>
                          <DialogDescription>User {sub.userId.slice(0, 8)}... — {statusBadge(sub.status)}</DialogDescription>
                        </DialogHeader>
                        {selected && selected.id === sub.id && (
                          <div className="space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                              {selected.faceScanUrl && (
                                <div className="space-y-2">
                                  <p className="text-sm font-medium">Face Scan</p>
                                  <div className="border rounded-lg overflow-hidden bg-gray-50">
                                    <img src={selected.faceScanUrl} alt="Face scan" className="w-full h-48 object-cover cursor-pointer hover:scale-105 transition-transform" onClick={() => window.open(selected.faceScanUrl!, "_blank")} />
                                    <p className="text-xs text-center p-1 text-gray-400">Click to view full size</p>
                                  </div>
                                </div>
                              )}
                              {selected.addressProofUrl && (
                                <div className="space-y-2">
                                  <p className="text-sm font-medium">Address Proof</p>
                                  <div className="border rounded-lg overflow-hidden bg-gray-50">
                                    <img src={selected.addressProofUrl} alt="Address proof" className="w-full h-48 object-cover cursor-pointer hover:scale-105 transition-transform" onClick={() => window.open(selected.addressProofUrl!, "_blank")} />
                                    <p className="text-xs text-center p-1 text-gray-400">Click to view full size</p>
                                  </div>
                                </div>
                              )}
                            </div>
                            {selected.addressText && (
                              <div className="p-3 rounded-lg bg-muted text-sm">
                                <p className="font-medium mb-1 flex items-center gap-2"><MapPin className="w-4 h-4" /> Declared Address</p>
                                <p>{selected.addressText}</p>
                              </div>
                            )}
                            <div className="space-y-3">
                              <Select value={reviewStatus} onValueChange={setReviewStatus}>
                                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select decision..." /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="approved">Approve</SelectItem>
                                  <SelectItem value="rejected">Reject</SelectItem>
                                </SelectContent>
                              </Select>
                              <Textarea value={reviewNotes} onChange={e => setReviewNotes(e.target.value)} placeholder="Review notes (optional)..." className="rounded-xl" rows={3} />
                              <Button
                                className="w-full rounded-xl bg-blue-600 hover:bg-blue-700"
                                disabled={!reviewStatus || reviewMutation.isPending}
                                onClick={() => reviewMutation.mutate({ id: selected.id, status: reviewStatus, notes: reviewNotes })}
                              >
                                {reviewMutation.isPending ? "Submitting..." : "Submit Review"}
                              </Button>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function KycReviewDialog({ 
  kyc, 
  onSubmit, 
  reviewStatus, 
  setReviewStatus, 
  reviewNotes, 
  setReviewNotes, 
  isLoading 
}: {
  kyc: KycDocument;
  onSubmit: () => void;
  reviewStatus: string;
  setReviewStatus: (status: string) => void;
  reviewNotes: string;
  setReviewNotes: (notes: string) => void;
  isLoading: boolean;
}) {
  return (
    <div className="space-y-6">
      {/* Document Information */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Document Information</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4" />
              <span className="text-sm">Type: {kyc.documentType}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">DOB: {kyc.dateOfBirth || "Not provided"}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">Address: {kyc.address || "Not provided"}</span>
            </div>
          </div>
        </div>
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Submission Details</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="text-sm">User: {kyc.userId ? kyc.userId.slice(0, 8) + '...' : 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">Submitted: {format(new Date(kyc.createdAt), "MMM dd, yyyy HH:mm")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Document Images */}
      <div>
        <h4 className="font-medium text-gray-900 dark:text-white mb-4">Document Images</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {kyc.frontImageUrl && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Front Image</p>
              <div className="border rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800">
                <img 
                  src={kyc.frontImageUrl} 
                  alt="Front of document" 
                  className="w-full h-48 object-cover cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => window.open(kyc.frontImageUrl, '_blank')}
                  data-testid="img-kyc-front"
                />
                <p className="text-xs text-center p-2 text-gray-500">Click to view full size</p>
              </div>
            </div>
          )}
          {kyc.backImageUrl && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Back Image</p>
              <div className="border rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800">
                <img 
                  src={kyc.backImageUrl} 
                  alt="Back of document" 
                  className="w-full h-48 object-cover cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => window.open(kyc.backImageUrl, '_blank')}
                  data-testid="img-kyc-back"
                />
                <p className="text-xs text-center p-2 text-gray-500">Click to view full size</p>
              </div>
            </div>
          )}
          {kyc.selfieUrl && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Selfie</p>
              <div className="border rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800">
                <img 
                  src={kyc.selfieUrl} 
                  alt="Verification selfie" 
                  className="w-full h-48 object-cover cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => window.open(kyc.selfieUrl, '_blank')}
                  data-testid="img-kyc-selfie"
                />
                <p className="text-xs text-center p-2 text-gray-500">Click to view full size</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Review Form */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900 dark:text-white">Review Decision</h4>
        
        <div>
          <label className="text-sm font-medium">Status</label>
          <Select value={reviewStatus} onValueChange={setReviewStatus}>
            <SelectTrigger data-testid="select-kyc-status">
              <SelectValue placeholder="Select review decision" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="verified">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Approve & Verify
                </div>
              </SelectItem>
              <SelectItem value="rejected">
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-600" />
                  Reject
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium">Review Notes</label>
          <Textarea
            placeholder="Add notes about your review decision..."
            value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)}
            className="mt-1"
            data-testid="textarea-kyc-notes"
          />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={onSubmit}
            disabled={!reviewStatus || isLoading}
            className="flex items-center gap-2"
            data-testid="button-submit-kyc-review"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
            Submit Review
          </Button>
        </div>
      </div>

      {/* Existing Notes */}
      {kyc.verificationNotes && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h5 className="font-medium mb-2">Previous Review Notes</h5>
          <p className="text-sm text-gray-600 dark:text-gray-400">{kyc.verificationNotes}</p>
        </div>
      )}
    </div>
  );
}