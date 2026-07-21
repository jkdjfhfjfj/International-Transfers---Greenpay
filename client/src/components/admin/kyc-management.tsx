import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Shield, RefreshCw, RotateCcw } from "lucide-react";
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
  User,
  Calendar,
  MapPin,
  AlertTriangle,
  Fingerprint,
  CreditCard,
  Globe,
  Hash,
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
  diditSessionId: string | null;
  diditStatus: string | null;
  diditDecision: any | null;
}

interface KycResponse {
  kycDocuments: KycDocument[];
}

// Map Didit status to color/label
function getDiditStatusBadge(diditStatus: string | null | undefined) {
  if (!diditStatus) return <Badge variant="outline" className="text-xs">Not Started</Badge>;
  const map: Record<string, { cls: string; label: string }> = {
    "Approved":       { cls: "bg-green-500 text-white", label: "Approved" },
    "Declined":       { cls: "bg-red-500 text-white", label: "Declined" },
    "In Review":      { cls: "bg-amber-500 text-white", label: "In Review" },
    "In Progress":    { cls: "bg-blue-500 text-white", label: "In Progress" },
    "Awaiting User":  { cls: "bg-purple-500 text-white", label: "Awaiting User" },
    "Resubmitted":    { cls: "bg-sky-500 text-white", label: "Resubmitted" },
    "Expired":        { cls: "bg-gray-400 text-white", label: "Expired" },
    "Abandoned":      { cls: "bg-gray-400 text-white", label: "Abandoned" },
    "Kyc Expired":    { cls: "bg-gray-400 text-white", label: "KYC Expired" },
    "Not Started":    { cls: "bg-gray-200 text-gray-700", label: "Not Started" },
  };
  const s = map[diditStatus] || { cls: "bg-gray-200 text-gray-700", label: diditStatus };
  return <Badge className={`text-xs ${s.cls}`}>{s.label}</Badge>;
}

function getKycStatusBadge(status: string) {
  switch (status) {
    case "verified":
      return <Badge className="bg-green-500 text-white">Verified</Badge>;
    case "rejected":
      return <Badge variant="destructive">Rejected</Badge>;
    case "pending":
      return <Badge variant="secondary">Pending Review</Badge>;
    case "re_verification_requested":
      return <Badge className="bg-orange-500 text-white">Re-verify Requested</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function getDocumentTypeName(type: string) {
  const map: Record<string, string> = {
    national_id: "National ID",
    passport: "Passport",
    drivers_license: "Driver's License",
    didit_verification: "Didit eKYC",
  };
  return map[type] || type;
}

// Extract structured data from a Didit decision payload
function extractDiditData(diditDecision: any) {
  if (!diditDecision) return null;
  const doc = diditDecision?.features?.document || {};
  return {
    firstName: doc.first_name || null,
    lastName: doc.last_name || null,
    fullName: [doc.first_name, doc.last_name].filter(Boolean).join(" ") || null,
    dateOfBirth: doc.date_of_birth || null,
    idNumber: doc.document_number || null,
    documentType: doc.document_type || null,
    nationality: doc.nationality || null,
    gender: doc.gender || null,
    expiryDate: doc.expiry_date || null,
    address: doc.address || null,
    issuingCountry: doc.issuing_country || null,
  };
}

export default function KycManagement() {
  const [selectedKyc, setSelectedKyc] = useState<KycDocument | null>(null);
  const [reviewStatus, setReviewStatus] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");
  const [viewKyc, setViewKyc] = useState<KycDocument | null>(null);
  const [pollingId, setPollingId] = useState<string | null>(null);
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
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/kyc"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
      const label = vars.status === "re_verification_requested" ? "Re-verification requested" : "KYC status updated";
      toast({ title: label, description: "User has been notified." });
      setSelectedKyc(null);
      setReviewStatus("");
      setReviewNotes("");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update KYC document", variant: "destructive" });
    },
  });

  const pollDiditMutation = useMutation({
    mutationFn: async (id: string) => {
      setPollingId(id);
      const response = await apiRequest("POST", `/api/admin/kyc/${id}/poll-didit`);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/kyc"] });
      toast({
        title: "Didit polled",
        description: `Status: ${data.diditStatus} → KYC: ${data.kycStatus}`,
      });
      setPollingId(null);
    },
    onError: (err: any) => {
      toast({ title: "Poll failed", description: err?.message || "Could not reach Didit", variant: "destructive" });
      setPollingId(null);
    },
  });

  const handleSubmitReview = () => {
    if (!selectedKyc || !reviewStatus) return;
    updateKycMutation.mutate({ id: selectedKyc.id, status: reviewStatus, notes: reviewNotes });
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">Failed to load KYC documents</div>
        </CardContent>
      </Card>
    );
  }

  const allDocs = kycData?.kycDocuments || [];
  const pendingKyc = allDocs.filter(doc => doc.status === "pending");
  const verifiedKyc = allDocs.filter(doc => doc.status === "verified");
  const rejectedKyc = allDocs.filter(doc => doc.status === "rejected");
  const reVerifyKyc = allDocs.filter(doc => doc.status === "re_verification_requested");

  return (
    <div className="space-y-6">
      {/* Header stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="w-5 h-5" />
            KYC Document Review
          </CardTitle>
          <CardDescription>
            Review, update, and sync user identity verification with Didit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600">{pendingKyc.length}</p>
              <p className="text-sm text-yellow-600">Pending</p>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{verifiedKyc.length}</p>
              <p className="text-sm text-green-600">Verified</p>
            </div>
            <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-2xl font-bold text-red-600">{rejectedKyc.length}</p>
              <p className="text-sm text-red-600">Rejected</p>
            </div>
            <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <p className="text-2xl font-bold text-orange-600">{reVerifyKyc.length}</p>
              <p className="text-sm text-orange-600">Re-verify</p>
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
          </CardHeader>
          <CardContent>
            <KycTable
              docs={pendingKyc}
              isLoading={isLoading}
              pollingId={pollingId}
              onReview={(kyc) => setSelectedKyc(kyc)}
              onView={(kyc) => setViewKyc(kyc)}
              onPollDidit={(id) => pollDiditMutation.mutate(id)}
            />
          </CardContent>
        </Card>
      )}

      {/* All Documents */}
      <Card>
        <CardHeader>
          <CardTitle>All KYC Documents</CardTitle>
          <CardDescription>Complete history of KYC submissions</CardDescription>
        </CardHeader>
        <CardContent>
          <KycTable
            docs={allDocs}
            isLoading={isLoading}
            pollingId={pollingId}
            onReview={(kyc) => setSelectedKyc(kyc)}
            onView={(kyc) => setViewKyc(kyc)}
            onPollDidit={(id) => pollDiditMutation.mutate(id)}
          />
        </CardContent>
      </Card>

      {/* Review Dialog (edit status) */}
      <Dialog open={!!selectedKyc} onOpenChange={(open) => { if (!open) { setSelectedKyc(null); setReviewStatus(""); setReviewNotes(""); } }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>KYC Review</DialogTitle>
            <DialogDescription>
              {selectedKyc && `User ${selectedKyc.userId.slice(0, 8)}… — Current: ${selectedKyc.status}`}
            </DialogDescription>
          </DialogHeader>
          {selectedKyc && (
            <KycReviewContent
              kyc={selectedKyc}
              reviewStatus={reviewStatus}
              setReviewStatus={setReviewStatus}
              reviewNotes={reviewNotes}
              setReviewNotes={setReviewNotes}
              onSubmit={handleSubmitReview}
              isLoading={updateKycMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* View-only Dialog */}
      <Dialog open={!!viewKyc} onOpenChange={(open) => { if (!open) setViewKyc(null); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>KYC Document Details</DialogTitle>
            <DialogDescription>
              {viewKyc && `User ${viewKyc.userId.slice(0, 8)}… — Status: ${viewKyc.status}`}
            </DialogDescription>
          </DialogHeader>
          {viewKyc && <KycDetailsView kyc={viewKyc} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Shared table component ────────────────────────────────────────────────────
function KycTable({
  docs, isLoading, pollingId, onReview, onView, onPollDidit,
}: {
  docs: KycDocument[];
  isLoading: boolean;
  pollingId: string | null;
  onReview: (k: KycDocument) => void;
  onView: (k: KycDocument) => void;
  onPollDidit: (id: string) => void;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (docs.length === 0) {
    return <p className="text-center text-sm text-muted-foreground py-6">No documents found.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User ID</TableHead>
          <TableHead>Document</TableHead>
          <TableHead>Didit Status</TableHead>
          <TableHead>KYC Status</TableHead>
          <TableHead>Submitted</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {docs.map((kyc) => (
          <TableRow key={kyc.id}>
            <TableCell>
              <span className="font-mono text-sm">{kyc.userId.slice(0, 8)}…</span>
            </TableCell>
            <TableCell>
              <span className="font-medium text-sm">{getDocumentTypeName(kyc.documentType)}</span>
            </TableCell>
            <TableCell>
              {kyc.diditSessionId ? (
                <div className="space-y-1">
                  {getDiditStatusBadge(kyc.diditStatus)}
                  <p className="font-mono text-xs text-muted-foreground">{kyc.diditSessionId.slice(0, 8)}…</p>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">Manual</span>
              )}
            </TableCell>
            <TableCell>{getKycStatusBadge(kyc.status)}</TableCell>
            <TableCell>
              <span className="text-sm">{format(new Date(kyc.createdAt), "MMM dd, yyyy")}</span>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1 flex-wrap">
                {/* Poll Didit button */}
                {kyc.diditSessionId && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
                    disabled={pollingId === kyc.id}
                    onClick={() => onPollDidit(kyc.id)}
                    title="Poll Didit for latest status"
                  >
                    {pollingId === kyc.id ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3 h-3" />
                    )}
                    <span className="ml-1">Sync</span>
                  </Button>
                )}
                {/* Review button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => onReview(kyc)}
                >
                  <Eye className="w-3 h-3 mr-1" />
                  Review
                </Button>
                {/* View button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => onView(kyc)}
                >
                  <Eye className="w-3 h-3 mr-1" />
                  View
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// ── Review content (edit status) ─────────────────────────────────────────────
function KycReviewContent({
  kyc, reviewStatus, setReviewStatus, reviewNotes, setReviewNotes, onSubmit, isLoading,
}: {
  kyc: KycDocument;
  reviewStatus: string;
  setReviewStatus: (s: string) => void;
  reviewNotes: string;
  setReviewNotes: (s: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
}) {
  const extracted = extractDiditData(kyc.diditDecision);

  return (
    <div className="space-y-6">
      {/* Didit extracted data */}
      {extracted && (extracted.fullName || extracted.idNumber) && (
        <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 space-y-3">
          <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-2">
            <Shield className="w-4 h-4" /> Didit Extracted Identity Data
          </p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {extracted.fullName && (
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-blue-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Full Name</p>
                  <p className="font-medium">{extracted.fullName}</p>
                </div>
              </div>
            )}
            {extracted.dateOfBirth && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Date of Birth</p>
                  <p className="font-medium">{extracted.dateOfBirth}</p>
                </div>
              </div>
            )}
            {extracted.idNumber && (
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-blue-500" />
                <div>
                  <p className="text-xs text-muted-foreground">ID / Document Number</p>
                  <p className="font-medium font-mono">{extracted.idNumber}</p>
                </div>
              </div>
            )}
            {extracted.nationality && (
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Nationality</p>
                  <p className="font-medium">{extracted.nationality}</p>
                </div>
              </div>
            )}
            {extracted.gender && (
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-blue-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Gender</p>
                  <p className="font-medium">{extracted.gender}</p>
                </div>
              </div>
            )}
            {extracted.expiryDate && (
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Document Expiry</p>
                  <p className="font-medium">{extracted.expiryDate}</p>
                </div>
              </div>
            )}
            {extracted.address && (
              <div className="flex items-center gap-2 col-span-2">
                <MapPin className="w-4 h-4 text-blue-500 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Address</p>
                  <p className="font-medium">{extracted.address}</p>
                </div>
              </div>
            )}
            {extracted.issuingCountry && (
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Issuing Country</p>
                  <p className="font-medium">{extracted.issuingCountry}</p>
                </div>
              </div>
            )}
          </div>
          {kyc.diditSessionId && (
            <a
              href="https://business.didit.me"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-blue-500 hover:underline"
            >
              <ExternalLink className="w-3 h-3" /> View in Didit Dashboard
            </a>
          )}
        </div>
      )}

      {/* Document info */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="space-y-2">
          <h4 className="font-medium">Document Info</h4>
          <div className="flex items-center gap-2"><FileCheck className="w-4 h-4" /> Type: {getDocumentTypeName(kyc.documentType)}</div>
          <div className="flex items-center gap-2"><Calendar className="w-4 h-4" /> DOB: {kyc.dateOfBirth || extracted?.dateOfBirth || "Not provided"}</div>
          <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Address: {kyc.address || extracted?.address || "Not provided"}</div>
        </div>
        <div className="space-y-2">
          <h4 className="font-medium">Status</h4>
          <div className="flex items-center gap-2">Current: {getKycStatusBadge(kyc.status)}</div>
          {kyc.diditStatus && <div className="flex items-center gap-2">Didit: {getDiditStatusBadge(kyc.diditStatus)}</div>}
          <div className="flex items-center gap-2"><Calendar className="w-4 h-4" /> Submitted: {format(new Date(kyc.createdAt), "MMM dd, yyyy HH:mm")}</div>
        </div>
      </div>

      {/* Document images */}
      <div>
        <h4 className="font-medium mb-4">Document Images</h4>
        <div className="grid grid-cols-3 gap-4">
          {kyc.frontImageUrl && (
            <div className="space-y-1">
              <p className="text-sm font-medium">Front</p>
              <img src={kyc.frontImageUrl} alt="Front" className="w-full h-40 object-cover rounded-lg border cursor-pointer" onClick={() => window.open(kyc.frontImageUrl!, '_blank')} />
            </div>
          )}
          {kyc.backImageUrl && (
            <div className="space-y-1">
              <p className="text-sm font-medium">Back</p>
              <img src={kyc.backImageUrl} alt="Back" className="w-full h-40 object-cover rounded-lg border cursor-pointer" onClick={() => window.open(kyc.backImageUrl!, '_blank')} />
            </div>
          )}
          {kyc.selfieUrl && (
            <div className="space-y-1">
              <p className="text-sm font-medium">Selfie</p>
              <img src={kyc.selfieUrl} alt="Selfie" className="w-full h-40 object-cover rounded-lg border cursor-pointer" onClick={() => window.open(kyc.selfieUrl!, '_blank')} />
            </div>
          )}
          {!kyc.frontImageUrl && !kyc.backImageUrl && !kyc.selfieUrl && (
            <p className="text-sm text-muted-foreground col-span-3">No document images — Didit eKYC flow (documents processed externally).</p>
          )}
        </div>
      </div>

      {/* Review form */}
      <div className="space-y-3 pt-4 border-t">
        <h4 className="font-medium">Admin Decision</h4>
        <Select value={reviewStatus} onValueChange={setReviewStatus}>
          <SelectTrigger>
            <SelectValue placeholder="Select action..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="verified">
              <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600" /> Approve &amp; Verify</div>
            </SelectItem>
            <SelectItem value="pending">
              <div className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-yellow-600" /> Mark as Pending</div>
            </SelectItem>
            <SelectItem value="rejected">
              <div className="flex items-center gap-2"><XCircle className="w-4 h-4 text-red-600" /> Reject</div>
            </SelectItem>
            <SelectItem value="re_verification_requested">
              <div className="flex items-center gap-2"><RotateCcw className="w-4 h-4 text-orange-600" /> Request Re-verification</div>
            </SelectItem>
          </SelectContent>
        </Select>
        <Textarea
          value={reviewNotes}
          onChange={(e) => setReviewNotes(e.target.value)}
          placeholder="Notes to user (shown in notification & rejection reason)..."
          rows={3}
        />
        <Button
          className="w-full"
          disabled={!reviewStatus || isLoading}
          onClick={onSubmit}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Updating...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> Submit Decision
            </span>
          )}
        </Button>
        {reviewStatus === "re_verification_requested" && (
          <p className="text-xs text-orange-600 text-center">
            This will reset the user's KYC to "not submitted" so they can start a fresh Didit verification.
          </p>
        )}
      </div>

      {kyc.verificationNotes && (
        <div className="p-3 bg-muted rounded-lg text-sm">
          <p className="font-medium mb-1">Previous Notes</p>
          <p className="text-muted-foreground">{kyc.verificationNotes}</p>
        </div>
      )}
    </div>
  );
}

// ── View-only details dialog ──────────────────────────────────────────────────
function KycDetailsView({ kyc }: { kyc: KycDocument }) {
  const extracted = extractDiditData(kyc.diditDecision);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 text-sm">
          <h4 className="font-medium">Document Information</h4>
          <div className="flex items-center gap-2"><FileCheck className="w-4 h-4" /> Type: {getDocumentTypeName(kyc.documentType)}</div>
          <div className="flex items-center gap-2"><Calendar className="w-4 h-4" /> DOB: {kyc.dateOfBirth || extracted?.dateOfBirth || "Not provided"}</div>
          <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Address: {kyc.address || extracted?.address || "Not provided"}</div>
        </div>
        <div className="space-y-2 text-sm">
          <h4 className="font-medium">Review Details</h4>
          <div className="flex items-center gap-2"><User className="w-4 h-4" /> User: {kyc.userId.slice(0, 8)}…</div>
          <div className="flex items-center gap-2"><Calendar className="w-4 h-4" /> Submitted: {format(new Date(kyc.createdAt), "MMM dd, yyyy HH:mm")}</div>
          <div className="flex items-center gap-2">Status: {getKycStatusBadge(kyc.status)}</div>
          {kyc.diditStatus && <div className="flex items-center gap-2">Didit: {getDiditStatusBadge(kyc.diditStatus)}</div>}
          {kyc.verifiedAt && <div className="flex items-center gap-2"><Calendar className="w-4 h-4" /> Reviewed: {format(new Date(kyc.verifiedAt), "MMM dd, yyyy HH:mm")}</div>}
          {kyc.diditSessionId && (
            <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-1 mb-1">
                <Shield className="w-3 h-3" /> Didit Session
              </p>
              <p className="text-xs text-blue-600 font-mono">{kyc.diditSessionId}</p>
              <a href="https://business.didit.me" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-blue-500 hover:underline mt-1">
                <ExternalLink className="w-3 h-3" /> View in Didit Dashboard
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Extracted data */}
      {extracted && (extracted.fullName || extracted.idNumber || extracted.nationality) && (
        <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-3 flex items-center gap-2">
            <Fingerprint className="w-4 h-4" /> Extracted Identity Data
          </p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {extracted.fullName && (
              <div><p className="text-xs text-muted-foreground">Full Name</p><p className="font-medium">{extracted.fullName}</p></div>
            )}
            {extracted.dateOfBirth && (
              <div><p className="text-xs text-muted-foreground">Date of Birth</p><p className="font-medium">{extracted.dateOfBirth}</p></div>
            )}
            {extracted.idNumber && (
              <div><p className="text-xs text-muted-foreground">ID / Document #</p><p className="font-medium font-mono">{extracted.idNumber}</p></div>
            )}
            {extracted.nationality && (
              <div><p className="text-xs text-muted-foreground">Nationality</p><p className="font-medium">{extracted.nationality}</p></div>
            )}
            {extracted.gender && (
              <div><p className="text-xs text-muted-foreground">Gender</p><p className="font-medium">{extracted.gender}</p></div>
            )}
            {extracted.expiryDate && (
              <div><p className="text-xs text-muted-foreground">Doc Expiry</p><p className="font-medium">{extracted.expiryDate}</p></div>
            )}
            {extracted.issuingCountry && (
              <div><p className="text-xs text-muted-foreground">Issuing Country</p><p className="font-medium">{extracted.issuingCountry}</p></div>
            )}
            {extracted.address && (
              <div className="col-span-2"><p className="text-xs text-muted-foreground">Address</p><p className="font-medium">{extracted.address}</p></div>
            )}
          </div>
        </div>
      )}

      {/* Document images */}
      <div>
        <h4 className="font-medium mb-4">Document Images</h4>
        <div className="grid grid-cols-3 gap-4">
          {kyc.frontImageUrl && (
            <div className="space-y-1">
              <p className="text-sm font-medium">Front</p>
              <img src={kyc.frontImageUrl} alt="Front" className="w-full h-40 object-cover rounded-lg border cursor-pointer hover:scale-105 transition-transform" onClick={() => window.open(kyc.frontImageUrl!, '_blank')} />
            </div>
          )}
          {kyc.backImageUrl && (
            <div className="space-y-1">
              <p className="text-sm font-medium">Back</p>
              <img src={kyc.backImageUrl} alt="Back" className="w-full h-40 object-cover rounded-lg border cursor-pointer hover:scale-105 transition-transform" onClick={() => window.open(kyc.backImageUrl!, '_blank')} />
            </div>
          )}
          {kyc.selfieUrl && (
            <div className="space-y-1">
              <p className="text-sm font-medium">Selfie</p>
              <img src={kyc.selfieUrl} alt="Selfie" className="w-full h-40 object-cover rounded-lg border cursor-pointer hover:scale-105 transition-transform" onClick={() => window.open(kyc.selfieUrl!, '_blank')} />
            </div>
          )}
          {!kyc.frontImageUrl && !kyc.backImageUrl && !kyc.selfieUrl && (
            <p className="text-sm text-muted-foreground col-span-3">No document images available.</p>
          )}
        </div>
      </div>

      {kyc.verificationNotes && (
        <div className="p-4 bg-muted rounded-lg">
          <h5 className="font-medium mb-2">Review Notes</h5>
          <p className="text-sm text-muted-foreground">{kyc.verificationNotes}</p>
        </div>
      )}
    </div>
  );
}

// ── Advanced KYC Section ──────────────────────────────────────────────────────

interface AdvancedKycDoc {
  id: string;
  userId: string;
  facialPhotoUrl: string | null;
  addressProofUrl: string | null;
  addressProofType: string | null;
  fullAddress: string | null;
  city: string | null;
  postalCode: string | null;
  country: string | null;
  status: string;
  verificationNotes: string | null;
  verifiedAt: string | null;
  createdAt: string;
}

export function AdvancedKycSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<AdvancedKycDoc | null>(null);
  const [reviewStatus, setReviewStatus] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");

  const { data, isLoading } = useQuery<{ advancedKycDocuments: AdvancedKycDoc[] }>({
    queryKey: ["/api/admin/kyc/advanced"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/kyc/advanced");
      return res.json();
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes: string }) => {
      const res = await apiRequest("PUT", `/api/admin/kyc/advanced/${id}`, { status, verificationNotes: notes });
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

  const submissions = data?.advancedKycDocuments || [];
  const pending = submissions.filter(s => s.status === "pending");
  const verified = submissions.filter(s => s.status === "verified");
  const rejected = submissions.filter(s => s.status === "rejected");

  const statusBadge = (s: string) => {
    if (s === "verified") return <Badge className="bg-green-500 text-white">Verified</Badge>;
    if (s === "rejected") return <Badge variant="destructive">Rejected</Badge>;
    return <Badge variant="secondary">Pending</Badge>;
  };

  const addressProofLabel = (type: string | null) => {
    const map: Record<string, string> = {
      utility_bill: "Utility Bill", bank_statement: "Bank Statement",
      lease: "Lease Agreement", government_letter: "Government Letter", other: "Other",
    };
    return type ? (map[type] || type) : "Address Proof";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-blue-500" />
            Advanced KYC Review
            {pending.length > 0 && <Badge className="bg-yellow-500 text-white ml-2">{pending.length} pending</Badge>}
          </CardTitle>
          <CardDescription>Review facial photo and address proof for advanced identity verification</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600">{pending.length}</p>
              <p className="text-sm text-yellow-600">Pending Review</p>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{verified.length}</p>
              <p className="text-sm text-green-600">Verified</p>
            </div>
            <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-2xl font-bold text-red-600">{rejected.length}</p>
              <p className="text-sm text-red-600">Rejected</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Submissions</CardTitle>
          <CardDescription>Complete list of advanced KYC submissions</CardDescription>
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
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell><span className="font-mono text-sm">{sub.userId.slice(0, 8)}…</span></TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {sub.facialPhotoUrl && <Badge variant="outline" className="text-xs">Facial Photo</Badge>}
                        {sub.addressProofUrl && <Badge variant="outline" className="text-xs">{addressProofLabel(sub.addressProofType)}</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {[sub.city, sub.country].filter(Boolean).join(", ") || "-"}
                      </span>
                    </TableCell>
                    <TableCell>{statusBadge(sub.status)}</TableCell>
                    <TableCell><span className="text-sm">{format(new Date(sub.createdAt), "MMM dd, yyyy")}</span></TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" onClick={() => { setSelected(sub); setReviewStatus(""); setReviewNotes(sub.verificationNotes || ""); }}>
                            <Eye className="w-4 h-4 mr-1" /> Review
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Advanced KYC Review</DialogTitle>
                            <DialogDescription>User {sub.userId.slice(0, 8)}… — {statusBadge(sub.status)}</DialogDescription>
                          </DialogHeader>
                          {selected && selected.id === sub.id && (
                            <div className="space-y-5">
                              <div className="grid grid-cols-2 gap-4">
                                {selected.facialPhotoUrl && (
                                  <div className="space-y-2">
                                    <p className="text-sm font-medium">Facial Photo</p>
                                    <img src={selected.facialPhotoUrl} alt="Facial" className="w-full h-52 object-cover rounded-lg border cursor-pointer hover:scale-105 transition-transform" onClick={() => window.open(selected.facialPhotoUrl!, "_blank")} />
                                  </div>
                                )}
                                {selected.addressProofUrl && (
                                  <div className="space-y-2">
                                    <p className="text-sm font-medium">{addressProofLabel(selected.addressProofType)}</p>
                                    <img src={selected.addressProofUrl} alt="Address" className="w-full h-52 object-cover rounded-lg border cursor-pointer hover:scale-105 transition-transform" onClick={() => window.open(selected.addressProofUrl!, "_blank")} />
                                  </div>
                                )}
                              </div>
                              {(selected.fullAddress || selected.city || selected.country) && (
                                <div className="p-3 rounded-lg bg-muted text-sm space-y-1">
                                  <p className="font-medium flex items-center gap-2"><MapPin className="w-4 h-4" /> Declared Address</p>
                                  {selected.fullAddress && <p className="text-muted-foreground">{selected.fullAddress}</p>}
                                  <p className="text-muted-foreground">
                                    {[selected.city, selected.postalCode, selected.country].filter(Boolean).join(", ")}
                                  </p>
                                </div>
                              )}
                              <div className="space-y-3 pt-2 border-t">
                                <h4 className="font-medium">Admin Decision</h4>
                                <Select value={reviewStatus} onValueChange={setReviewStatus}>
                                  <SelectTrigger><SelectValue placeholder="Select decision..." /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="verified">
                                      <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600" /> Approve &amp; Verify</div>
                                    </SelectItem>
                                    <SelectItem value="rejected">
                                      <div className="flex items-center gap-2"><XCircle className="w-4 h-4 text-red-600" /> Reject</div>
                                    </SelectItem>
                                    <SelectItem value="pending">
                                      <div className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-yellow-600" /> Keep Pending</div>
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                <Textarea value={reviewNotes} onChange={e => setReviewNotes(e.target.value)} placeholder="Review notes (optional)..." rows={3} />
                                <Button
                                  className="w-full"
                                  disabled={!reviewStatus || reviewMutation.isPending}
                                  onClick={() => reviewMutation.mutate({ id: selected.id, status: reviewStatus, notes: reviewNotes })}
                                >
                                  {reviewMutation.isPending ? "Submitting..." : "Submit Review"}
                                </Button>
                              </div>
                              {selected.verificationNotes && (
                                <div className="p-3 bg-muted rounded-lg text-sm">
                                  <p className="font-medium mb-1">Previous Notes</p>
                                  <p className="text-muted-foreground">{selected.verificationNotes}</p>
                                </div>
                              )}
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
    </div>
  );
}
