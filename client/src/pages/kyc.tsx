import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { WavyHeader } from "@/components/wavy-header";
import BottomNavigation from "@/components/bottom-navigation";
import { CheckCircle, Clock, XCircle, Shield, ShieldCheck, ChevronRight, Upload, Camera, FileText, MapPin } from "lucide-react";

type KycLevel = "basic" | "advanced";

function StatusBadge({ status }: { status: string }) {
  if (status === "verified") return <Badge className="bg-green-500 text-white gap-1"><CheckCircle className="w-3 h-3" /> Verified</Badge>;
  if (status === "pending") return <Badge className="bg-amber-500 text-white gap-1"><Clock className="w-3 h-3" /> Under Review</Badge>;
  if (status === "rejected") return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" /> Rejected</Badge>;
  return <Badge variant="outline" className="gap-1 text-muted-foreground">Not Submitted</Badge>;
}

export default function KYCPage() {
  const [, setLocation] = useLocation();
  const { user, login } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeLevel, setActiveLevel] = useState<KycLevel>("basic");

  // Basic KYC state
  const [basicStep, setBasicStep] = useState(1);
  const [basicForm, setBasicForm] = useState({
    documentType: "national_id",
    dateOfBirth: "",
    address: "",
    frontImage: null as File | null,
    backImage: null as File | null,
    selfie: null as File | null,
  });

  // Advanced KYC state
  const [advStep, setAdvStep] = useState(1);
  const [advForm, setAdvForm] = useState({
    addressProofType: "",
    fullAddress: "",
    city: "",
    postalCode: "",
    country: user?.country || "",
    facialPhoto: null as File | null,
    addressProof: null as File | null,
  });

  const { data: kycData, isLoading: kycLoading } = useQuery<{ kyc: any }>({
    queryKey: ["/api/kyc", user?.id],
    enabled: !!user?.id,
  });

  const { data: advKycData, isLoading: advKycLoading } = useQuery<{ advancedKyc: any }>({
    queryKey: ["/api/kyc/advanced"],
    enabled: !!user?.id,
  });

  const basicStatus = user?.kycStatus || "not_submitted";
  const advancedStatus = (user as any)?.advancedKycStatus || advKycData?.advancedKyc?.status || "not_submitted";
  const advancedKycRequested = (user as any)?.advancedKycRequested === true;

  // Basic KYC submit
  const submitBasicMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch("/api/kyc/submit", { method: "POST", body: data });
      if (!response.ok) { const err = await response.json(); throw new Error(err.message || "Failed"); }
      return response.json();
    },
    onSuccess: () => {
      if (user) login({ ...user, kycStatus: "pending" });
      queryClient.invalidateQueries({ queryKey: ["/api/kyc", user?.id] });
      toast({ title: "Basic KYC Submitted!", description: "We'll review your documents within 1-2 business days." });
    },
    onError: (e: any) => toast({ title: "Submission Failed", description: e.message, variant: "destructive" }),
  });

  // Advanced KYC submit
  const submitAdvancedMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch("/api/kyc/advanced/submit", { method: "POST", body: data });
      if (!response.ok) { const err = await response.json(); throw new Error(err.message || "Failed"); }
      return response.json();
    },
    onSuccess: () => {
      if (user) login({ ...user, advancedKycStatus: "pending" } as any);
      queryClient.invalidateQueries({ queryKey: ["/api/kyc/advanced"] });
      toast({ title: "Advanced KYC Submitted!", description: "We'll review your documents within 1-2 business days." });
      setAdvStep(1);
    },
    onError: (e: any) => toast({ title: "Submission Failed", description: e.message, variant: "destructive" }),
  });

  const handleBasicSubmit = () => {
    if (!basicForm.dateOfBirth || !basicForm.address) {
      toast({ title: "Missing Info", description: "Fill in all required fields", variant: "destructive" }); return;
    }
    if (!basicForm.frontImage || !basicForm.backImage || !basicForm.selfie) {
      toast({ title: "Missing Documents", description: "Upload all required images", variant: "destructive" }); return;
    }
    const fd = new FormData();
    fd.append("userId", user?.id || "");
    fd.append("documentType", basicForm.documentType);
    fd.append("dateOfBirth", basicForm.dateOfBirth);
    fd.append("address", basicForm.address);
    fd.append("frontImage", basicForm.frontImage);
    fd.append("backImage", basicForm.backImage);
    fd.append("selfie", basicForm.selfie);
    submitBasicMutation.mutate(fd);
  };

  const handleAdvancedSubmit = () => {
    if (!advForm.addressProofType || !advForm.fullAddress) {
      toast({ title: "Missing Info", description: "Fill in all required fields", variant: "destructive" }); return;
    }
    if (!advForm.facialPhoto || !advForm.addressProof) {
      toast({ title: "Missing Documents", description: "Upload your facial photo and address proof", variant: "destructive" }); return;
    }
    const fd = new FormData();
    fd.append("addressProofType", advForm.addressProofType);
    fd.append("fullAddress", advForm.fullAddress);
    fd.append("city", advForm.city);
    fd.append("postalCode", advForm.postalCode);
    fd.append("country", advForm.country);
    fd.append("facialPhoto", advForm.facialPhoto);
    fd.append("addressProof", advForm.addressProof);
    submitAdvancedMutation.mutate(fd);
  };

  const FileUploadBox = ({ label, file, onFile, id, accept = "image/*", icon: Icon = Upload }: {
    label: string; file: File | null; onFile: (f: File | null) => void; id: string; accept?: string; icon?: any;
  }) => (
    <div className="border-2 border-dashed border-muted rounded-xl p-5 text-center transition-colors hover:border-primary/40">
      {file ? (
        <div className="space-y-2">
          <CheckCircle className="w-8 h-8 text-green-500 mx-auto" />
          <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
          <Button variant="outline" size="sm" onClick={() => onFile(null)}>Remove</Button>
        </div>
      ) : (
        <div className="space-y-2">
          <Icon className="w-8 h-8 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">{label}</p>
          <input type="file" accept={accept} onChange={e => onFile(e.target.files?.[0] || null)} className="hidden" id={id} />
          <Button variant="outline" size="sm" asChild><label htmlFor={id} className="cursor-pointer">Choose File</label></Button>
        </div>
      )}
    </div>
  );

  if (kycLoading || advKycLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="max-w-md mx-auto px-4 pt-6 space-y-6">
        {/* Admin-requested Advanced KYC banner */}
        {advancedKycRequested && advancedStatus === "not_submitted" && basicStatus === "verified" && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-2xl p-4 flex gap-3 items-start">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">Advanced Verification Required</p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
                Our team has requested you complete Advanced KYC to continue using all features. Please submit your facial scan and address proof below.
              </p>
              <Button size="sm" className="mt-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                onClick={() => setActiveLevel("advanced")}>
                Complete Advanced KYC
              </Button>
            </div>
          </motion.div>
        )}

        {advancedKycRequested && advancedStatus === "not_submitted" && basicStatus !== "verified" && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl p-4 flex gap-3 items-start">
            <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">Advanced Verification Requested</p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                Our team has requested Advanced KYC. Please complete Basic KYC first, then return here to submit advanced documents.
              </p>
            </div>
          </motion.div>
        )}

        {/* KYC Level Cards */}
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              level: "basic" as KycLevel,
              label: "Basic KYC",
              desc: "ID document + selfie",
              status: basicStatus,
              icon: Shield,
              features: ["Send money", "Receive payments", "Virtual card"],
            },
            {
              level: "advanced" as KycLevel,
              label: "Advanced KYC",
              desc: "Facial + address proof",
              status: advancedStatus,
              icon: ShieldCheck,
              features: ["Higher limits", "All features", "Priority support"],
              requiresBasic: true,
            },
          ].map(({ level, label, desc, status, icon: Icon, features, requiresBasic }) => {
            const isLocked = requiresBasic && basicStatus !== "verified";
            const isActive = activeLevel === level;
            return (
              <button
                key={level}
                onClick={() => !isLocked && setActiveLevel(level)}
                className={`text-left p-4 rounded-2xl border-2 transition-all ${
                  isActive ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40"
                } ${isLocked ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className={`p-2 rounded-xl ${isActive ? "bg-primary/10" : "bg-muted"}`}>
                    <Icon className={`w-4 h-4 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <StatusBadge status={status} />
                </div>
                <p className="text-sm font-semibold mt-2">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
                {isLocked && <p className="text-xs text-amber-600 mt-1 font-medium">Requires Basic KYC first</p>}
                <ul className="mt-3 space-y-1">
                  {features.map(f => (
                    <li key={f} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>

        {/* Basic KYC Section */}
        <AnimatePresence mode="wait">
          {activeLevel === "basic" && (
            <motion.div key="basic" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              className="space-y-4">
              {basicStatus === "verified" && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-6 text-center">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <h3 className="font-semibold text-green-800 dark:text-green-200">Basic KYC Verified!</h3>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">Your identity has been successfully verified.</p>
                  <Button className="mt-4" variant="outline" onClick={() => setActiveLevel("advanced")}>
                    Upgrade to Advanced KYC <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              )}

              {basicStatus === "pending" && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-6 text-center">
                  <Clock className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                  <h3 className="font-semibold text-amber-800 dark:text-amber-200">Under Review</h3>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">Your documents are being reviewed. This typically takes 1-2 business days.</p>
                </div>
              )}

              {(basicStatus === "not_submitted" || basicStatus === "rejected") && (
                <>
                  {basicStatus === "rejected" && kycData?.kyc && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-xl p-4">
                      <p className="text-sm font-semibold text-red-800 dark:text-red-200">Previous Submission Rejected</p>
                      <p className="text-xs text-red-700 dark:text-red-300 mt-1">{kycData.kyc.verificationNotes || "Please resubmit with clearer documents."}</p>
                    </div>
                  )}

                  <div className="bg-card border border-border rounded-2xl p-5 space-y-5">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex gap-2">
                        {[1, 2, 3].map(s => (
                          <div key={s} className={`h-1.5 w-8 rounded-full transition-colors ${s <= basicStep ? "bg-primary" : "bg-muted"}`} />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground ml-auto">Step {basicStep} of 3</span>
                    </div>

                    <AnimatePresence mode="wait">
                      {basicStep === 1 && (
                        <motion.div key="b1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-4">
                          <h2 className="text-base font-semibold">Personal Information</h2>
                          <div className="space-y-1.5">
                            <Label>Document Type</Label>
                            <Select value={basicForm.documentType} onValueChange={v => setBasicForm(p => ({ ...p, documentType: v }))}>
                              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="national_id">National ID</SelectItem>
                                <SelectItem value="passport">Passport</SelectItem>
                                <SelectItem value="drivers_license">Driver's License</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label>Date of Birth</Label>
                            <Input type="date" value={basicForm.dateOfBirth} onChange={e => setBasicForm(p => ({ ...p, dateOfBirth: e.target.value }))} className="rounded-xl" />
                          </div>
                          <div className="space-y-1.5">
                            <Label>Home Address</Label>
                            <Textarea placeholder="Enter your full address" value={basicForm.address} onChange={e => setBasicForm(p => ({ ...p, address: e.target.value }))} className="rounded-xl" rows={2} />
                          </div>
                          <Button className="w-full rounded-xl" onClick={() => {
                            if (!basicForm.dateOfBirth || !basicForm.address) {
                              toast({ title: "Missing fields", variant: "destructive" }); return;
                            }
                            setBasicStep(2);
                          }}>Continue</Button>
                        </motion.div>
                      )}

                      {basicStep === 2 && (
                        <motion.div key="b2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-4">
                          <h2 className="text-base font-semibold">Document Upload</h2>
                          <FileUploadBox label="Front of document" file={basicForm.frontImage} onFile={f => setBasicForm(p => ({ ...p, frontImage: f }))} id="basic-front" />
                          <FileUploadBox label="Back of document" file={basicForm.backImage} onFile={f => setBasicForm(p => ({ ...p, backImage: f }))} id="basic-back" />
                          <div className="flex gap-3">
                            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setBasicStep(1)}>Back</Button>
                            <Button className="flex-1 rounded-xl" onClick={() => {
                              if (!basicForm.frontImage || !basicForm.backImage) {
                                toast({ title: "Upload both document sides", variant: "destructive" }); return;
                              }
                              setBasicStep(3);
                            }}>Continue</Button>
                          </div>
                        </motion.div>
                      )}

                      {basicStep === 3 && (
                        <motion.div key="b3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-4">
                          <h2 className="text-base font-semibold">Selfie Verification</h2>
                          <FileUploadBox label="Clear photo of your face" file={basicForm.selfie} onFile={f => setBasicForm(p => ({ ...p, selfie: f }))} id="basic-selfie" icon={Camera} />
                          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-3 text-xs text-blue-700 dark:text-blue-300">
                            Ensure your face is clearly visible, well-lit, and matches your ID document.
                          </div>
                          <div className="flex gap-3">
                            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setBasicStep(2)}>Back</Button>
                            <Button className="flex-1 rounded-xl" onClick={handleBasicSubmit} disabled={submitBasicMutation.isPending}>
                              {submitBasicMutation.isPending ? "Submitting..." : "Submit"}
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* Advanced KYC Section */}
          {activeLevel === "advanced" && (
            <motion.div key="advanced" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-4">
              {basicStatus !== "verified" && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-5 text-center">
                  <Shield className="w-10 h-10 text-amber-500 mx-auto mb-3" />
                  <h3 className="font-semibold text-amber-800 dark:text-amber-200">Basic KYC Required First</h3>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">Complete your Basic KYC before applying for Advanced verification.</p>
                  <Button className="mt-4" onClick={() => setActiveLevel("basic")}>Complete Basic KYC</Button>
                </div>
              )}

              {basicStatus === "verified" && advancedStatus === "verified" && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-6 text-center">
                  <ShieldCheck className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <h3 className="font-semibold text-green-800 dark:text-green-200">Fully Verified!</h3>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">Your advanced identity verification is complete. You have access to all features.</p>
                </div>
              )}

              {basicStatus === "verified" && advancedStatus === "pending" && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-6 text-center">
                  <Clock className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                  <h3 className="font-semibold text-amber-800 dark:text-amber-200">Under Review</h3>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">Your advanced KYC documents are being reviewed. This typically takes 1-2 business days.</p>
                </div>
              )}

              {basicStatus === "verified" && (advancedStatus === "not_submitted" || advancedStatus === "rejected") && (
                <>
                  {advancedStatus === "rejected" && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-xl p-4">
                      <p className="text-sm font-semibold text-red-800 dark:text-red-200">Previous Submission Rejected</p>
                      <p className="text-xs text-red-700 dark:text-red-300 mt-1">{advKycData?.advancedKyc?.verificationNotes || "Please resubmit with clearer documents."}</p>
                    </div>
                  )}

                  <div className="bg-card border border-border rounded-2xl p-5 space-y-5">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-2">
                        {[1, 2].map(s => (
                          <div key={s} className={`h-1.5 w-10 rounded-full transition-colors ${s <= advStep ? "bg-primary" : "bg-muted"}`} />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground ml-auto">Step {advStep} of 2</span>
                    </div>

                    <AnimatePresence mode="wait">
                      {advStep === 1 && (
                        <motion.div key="a1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-4">
                          <h2 className="text-base font-semibold">Address Verification</h2>
                          <div className="space-y-1.5">
                            <Label>Address Proof Document Type</Label>
                            <Select value={advForm.addressProofType} onValueChange={v => setAdvForm(p => ({ ...p, addressProofType: v }))}>
                              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select document type" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="utility_bill">Utility Bill (electricity, water, gas)</SelectItem>
                                <SelectItem value="bank_statement">Bank Statement</SelectItem>
                                <SelectItem value="lease">Lease / Rental Agreement</SelectItem>
                                <SelectItem value="government_letter">Government Letter</SelectItem>
                                <SelectItem value="other">Other Official Document</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label>Full Address</Label>
                            <Textarea placeholder="Street, Estate, Area" value={advForm.fullAddress} onChange={e => setAdvForm(p => ({ ...p, fullAddress: e.target.value }))} className="rounded-xl" rows={2} />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <Label>City</Label>
                              <Input placeholder="Nairobi" value={advForm.city} onChange={e => setAdvForm(p => ({ ...p, city: e.target.value }))} className="rounded-xl" />
                            </div>
                            <div className="space-y-1.5">
                              <Label>Postal Code</Label>
                              <Input placeholder="00100" value={advForm.postalCode} onChange={e => setAdvForm(p => ({ ...p, postalCode: e.target.value }))} className="rounded-xl" />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <Label>Country</Label>
                            <Input placeholder="Kenya" value={advForm.country} onChange={e => setAdvForm(p => ({ ...p, country: e.target.value }))} className="rounded-xl" />
                          </div>
                          <Button className="w-full rounded-xl" onClick={() => {
                            if (!advForm.addressProofType || !advForm.fullAddress) {
                              toast({ title: "Fill in required fields", variant: "destructive" }); return;
                            }
                            setAdvStep(2);
                          }}>Continue</Button>
                        </motion.div>
                      )}

                      {advStep === 2 && (
                        <motion.div key="a2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-4">
                          <h2 className="text-base font-semibold">Photo Verification</h2>
                          <div className="space-y-1.5">
                            <Label className="text-sm font-medium flex items-center gap-1.5"><Camera className="w-3.5 h-3.5" /> Facial Photo (Liveness Check)</Label>
                            <FileUploadBox label="Clear, well-lit photo of your face" file={advForm.facialPhoto} onFile={f => setAdvForm(p => ({ ...p, facialPhoto: f }))} id="adv-facial" icon={Camera} />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-sm font-medium flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Address Proof Document</Label>
                            <FileUploadBox label="Upload your address proof document" file={advForm.addressProof} onFile={f => setAdvForm(p => ({ ...p, addressProof: f }))} id="adv-address" icon={MapPin} />
                          </div>
                          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-3 text-xs text-blue-700 dark:text-blue-300 space-y-1">
                            <p className="font-medium">Tips for approval:</p>
                            <p>• Document must be dated within the last 3 months</p>
                            <p>• Your name and address must be clearly visible</p>
                            <p>• Facial photo should match your ID on file</p>
                          </div>
                          <div className="flex gap-3">
                            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setAdvStep(1)}>Back</Button>
                            <Button className="flex-1 rounded-xl" onClick={handleAdvancedSubmit} disabled={submitAdvancedMutation.isPending}>
                              {submitAdvancedMutation.isPending ? "Submitting..." : "Submit"}
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <BottomNavigation />
    </div>
  );
}
