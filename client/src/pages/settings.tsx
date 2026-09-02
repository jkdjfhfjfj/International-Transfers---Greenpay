import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useCurrencies } from "@/hooks/use-wallets";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ObjectUploader } from "@/components/ObjectUploader";
import { HelpCircle, ChevronRight, LogOut, Monitor, Smartphone, Tablet, Download, Globe, Clock, ShieldCheck, User, Calendar, Hash, MapPin, CreditCard, AlertCircle } from "lucide-react";
import { WavyHeader } from "@/components/wavy-header";

export default function SettingsPage() {
  const [, setLocation] = useLocation();
  const { user, logout, login } = useAuth();
  const { currencies: availableCurrencies } = useCurrencies();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Profile editing states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    country: user?.country || "",
  });

  // Password change states
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Settings states
  const [settings, setSettings] = useState({
    defaultCurrency: user?.defaultCurrency || "KES",
    pushNotificationsEnabled: user?.pushNotificationsEnabled !== false,
    twoFactorEnabled: user?.twoFactorEnabled || false,
    biometricEnabled: user?.biometricEnabled || false,
    pinEnabled: user?.pinEnabled || false,
    darkMode: user?.darkMode || false,
  });

  // PIN setup states
  const [isPinSetup, setIsPinSetup] = useState(false);
  const [pinSetupStep, setPinSetupStep] = useState<'create' | 'confirm'>('create');
  const [pinValue, setPinValue] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [isPinDisable, setIsPinDisable] = useState(false);
  const [disablePinPassword, setDisablePinPassword] = useState('');

  // Profile editing states
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [is2FASetup, setIs2FASetup] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [twoFAStep, setTwoFAStep] = useState<'qr' | 'verify' | 'backup'>('qr');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [twoFASecret, setTwoFASecret] = useState<string | null>(null);
  const [disablePasswordConfirm, setDisablePasswordConfirm] = useState('');
  const [fingerprintSetup, setFingerprintSetup] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  
  // Photo upload states
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(user?.profilePhotoUrl || null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof profileData) => {
      const response = await apiRequest("PUT", `/api/users/${user?.id}/profile`, data);
      return response.json();
    },
    onSuccess: (data) => {
      login(data.user); // Update user context
      setIsEditingProfile(false);
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Unable to update profile",
        variant: "destructive",
      });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: typeof passwordData) => {
      const response = await apiRequest("POST", `/api/users/${user?.id}/change-password`, {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      return response.json();
    },
    onSuccess: () => {
      setIsChangingPassword(false);
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast({
        title: "Password Changed",
        description: "Your password has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Password Change Failed",
        description: error.message || "Unable to change password",
        variant: "destructive",
      });
    },
  });

  const uploadPhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("photo", file);
      
      const response = await fetch(`/api/users/${user?.id}/profile-photo`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error("Failed to upload photo");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      login(data.user); // Update user context with new photo URL
      setPhotoPreview(data.user.profilePhotoUrl);
      setSelectedPhoto(null);
      toast({
        title: "Photo Updated",
        description: "Your profile photo has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Unable to upload photo",
        variant: "destructive",
      });
    },
  });

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select an image under 5MB",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedPhoto(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      // Upload immediately
      uploadPhotoMutation.mutate(file);
    }
  };

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: typeof settings) => {
      const response = await apiRequest("PUT", `/api/users/${user?.id}/settings`, data);
      return response.json();
    },
    onSuccess: (data) => {
      login(data.user); // Update user context
      toast({
        title: "Settings Updated",
        description: "Your preferences have been saved",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Settings Update Failed",
        description: error.message || "Unable to update settings",
        variant: "destructive",
      });
    },
  });

  const handleProfileUpdate = () => {
    if (!profileData.fullName || !profileData.email || !profileData.phone || !profileData.country) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    updateProfileMutation.mutate(profileData);
  };

  const handlePasswordChange = () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast({
        title: "Missing Information",
        description: "Please fill in all password fields",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "New password and confirmation do not match",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 8 characters long",
        variant: "destructive",
      });
      return;
    }

    changePasswordMutation.mutate(passwordData);
  };

  const handleSettingUpdate = (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    updateSettingsMutation.mutate(newSettings);
  };

  const setup2FAMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/auth/setup-2fa`, { userId: user?.id });
      return response.json();
    },
    onSuccess: (data) => {
      setQrCodeUrl(data.qrCodeUrl);
      setTwoFASecret(data.secret);
      // Store backup codes in state so they persist through verification
      setBackupCodes(Array.isArray(data.backupCodes) ? data.backupCodes : []);
      setTwoFAStep('qr');
      setIs2FASetup(true);
    },
    onError: (error: any) => {
      toast({
        title: "Setup Failed",
        description: error.message || "Unable to setup 2FA",
        variant: "destructive",
      });
    },
  });

  const verify2FAMutation = useMutation({
    mutationFn: async (token: string) => {
      const response = await apiRequest("POST", `/api/auth/2fa/verify`, { 
        userId: user?.id,
        token
      });
      return response.json();
    },
    onSuccess: (data) => {
      // Update user context with new 2FA setting
      if (data.user) {
        login(data.user);
      }
      
      // Show backup codes if they exist in state
      if (backupCodes.length > 0) {
        setTwoFAStep('backup');
      } else {
        // If no codes in state, close the dialog
        setIs2FASetup(false);
        setTwoFAStep('qr');
        setVerificationCode('');
        setBackupCodes([]);
        // Update local settings state
        setSettings({ ...settings, twoFactorEnabled: true });
      }
      setVerificationCode('');
      toast({
        title: "2FA Enabled",
        description: "Your authenticator has been successfully set up",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid authenticator code",
        variant: "destructive",
      });
    },
  });

  const setupPinMutation = useMutation({
    mutationFn: async (pin: string) => {
      const response = await apiRequest("POST", `/api/users/${user?.id}/pin/setup`, { pin });
      return response.json();
    },
    onSuccess: (data) => {
      login(data.user);
      setSettings({ ...settings, pinEnabled: true });
      setIsPinSetup(false);
      setPinValue('');
      setPinConfirm('');
      toast({
        title: "PIN Set Successfully",
        description: "Your PIN has been saved. It will be required for future logins and transactions.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "PIN Setup Failed",
        description: error.message || "Unable to set PIN",
        variant: "destructive",
      });
    },
  });

  const disablePinMutation = useMutation({
    mutationFn: async (password: string) => {
      const response = await apiRequest("POST", `/api/users/${user?.id}/pin/disable`, { password });
      return response.json();
    },
    onSuccess: (data) => {
      login(data.user);
      setSettings({ ...settings, pinEnabled: false });
      setIsPinDisable(false);
      setDisablePinPassword('');
      toast({
        title: "PIN Disabled",
        description: "Your PIN has been disabled successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Disable Failed",
        description: error.message || "Unable to disable PIN",
        variant: "destructive",
      });
    },
  });

  const disable2FAMutation = useMutation({
    mutationFn: async (password: string) => {
      const response = await apiRequest("POST", `/api/users/${user?.id}/disable-2fa`, { 
        password
      });
      return response.json();
    },
    onSuccess: (data) => {
      login(data.user);
      setSettings({ ...settings, twoFactorEnabled: false });
      setIs2FASetup(false);
      setDisablePasswordConfirm('');
      toast({
        title: "2FA Disabled",
        description: "Two-factor authentication has been disabled",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Disable Failed",
        description: error.message || "Unable to disable 2FA",
        variant: "destructive",
      });
    },
  });

  const setupFingerprintMutation = useMutation({
    mutationFn: async () => {
      // Check if WebAuthn is supported
      if (!window.PublicKeyCredential) {
        throw new Error("Your device doesn't support biometric authentication");
      }

      // Request biometric from device
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const publicKeyCreationOptions = {
        challenge,
        rp: { name: "GreenPay", id: window.location.hostname },
        user: {
          id: crypto.getRandomValues(new Uint8Array(16)),
          name: user?.email || "user",
          displayName: user?.fullName || "User",
        },
        pubKeyCredParams: [
          { alg: -7, type: "public-key" as const },
          { alg: -257, type: "public-key" as const },
        ],
        timeout: 60000,
        userVerification: "preferred",
      } as PublicKeyCredentialCreationOptions;

      const credential = await navigator.credentials.create({
        publicKey: publicKeyCreationOptions,
      }) as PublicKeyCredential | null;

      if (!credential) {
        throw new Error("Biometric enrollment was cancelled or failed");
      }

      // Send to server for storage - store credential ID as is
      const response = await apiRequest("POST", `/api/auth/biometric/setup`, {
        userId: user?.id,
        credentialId: credential.id,
      });
      return response.json();
    },
    onSuccess: (data) => {
      // Update user context with biometric setting enabled
      if (data.user) {
        login(data.user);
      }
      // Update local settings state
      setSettings({ ...settings, biometricEnabled: true });
      toast({
        title: "Biometric Setup Complete",
        description: "You can now use your fingerprint or face to authenticate",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Setup Failed",
        description: error.message || "Unable to setup biometric authentication",
        variant: "destructive",
      });
    },
  });

  const disableBiometricMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/users/${user?.id}/disable-biometric`, {});
      return response.json();
    },
    onSuccess: (data) => {
      login(data.user);
      setSettings({ ...settings, biometricEnabled: false });
      toast({
        title: "Biometric Disabled",
        description: "Biometric authentication has been disabled",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Disable Failed",
        description: error.message || "Unable to disable biometric",
        variant: "destructive",
      });
    },
  });

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        handleSettingUpdate('pushNotificationsEnabled', true);
        toast({
          title: "Notifications Enabled",
          description: "You'll receive push notifications for transactions",
        });
        
        // Register for push notifications
        await apiRequest("POST", `/api/notifications/register`, { 
          userId: user?.id,
          endpoint: 'browser-notification'
        });
      }
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    logout();
    setLocation("/");
  };

  const { data: appDownloads } = useQuery<{
    playStoreUrl: string;
    appStoreUrl: string;
    apkUrl: string;
    apkVersion: string;
    huaweiUrl: string;
  }>({
    queryKey: ["/api/app-downloads"],
  });

  const { data: devicesData, refetch: refetchDevices } = useQuery({
    queryKey: ["/api/users/me/devices"],
    enabled: !!user?.id,
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/users/me/devices");
      return res.json();
    },
  });

  const revokeAllSessionsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/users/me/revoke-all-sessions", {});
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Sessions Revoked", description: "All other devices have been logged out." });
      refetchDevices();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to revoke sessions.", variant: "destructive" });
    },
  });

  const devices: any[] = (devicesData as any)?.devices || [];

  const getDeviceIcon = (deviceType: string) => {
    if (deviceType === 'mobile') return <Smartphone className="w-4 h-4" />;
    if (deviceType === 'tablet') return <Tablet className="w-4 h-4" />;
    return <Monitor className="w-4 h-4" />;
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-6">
      {/* Header */}
      <WavyHeader
        
        
        size="sm"
      />

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Profile Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card p-4 rounded-xl border border-border elevation-1"
        >
          <div className="flex items-center mb-4">
            {user?.profilePhotoUrl ? (
              <img 
                src={user.profilePhotoUrl} 
                alt="Profile" 
                className="w-16 h-16 rounded-full object-cover mr-4 border-2 border-primary/20"
              />
            ) : (
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mr-4">
                <span className="text-white font-bold text-xl">
                  {user?.fullName?.split(' ').map(n => n[0]).join('') || 'JD'}
                </span>
              </div>
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{user?.fullName || 'John Doe'}</h3>
              <p className="text-muted-foreground text-sm">{user?.email}</p>
              <p className={`text-xs px-2 py-1 rounded-full inline-block mt-1 ${
                user?.kycStatus === 'verified' 
                  ? 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-950' 
                  : user?.kycStatus === 'not_submitted' || !user?.kycStatus
                  ? 'text-gray-500 bg-gray-100 dark:text-gray-400 dark:bg-gray-800'
                  : user?.kycStatus === 'rejected'
                  ? 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-950'
                  : 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-950'
              }`}>
                {user?.kycStatus === 'verified' ? 'KYC Verified ✓' : user?.kycStatus === 'rejected' ? 'KYC Rejected' : user?.kycStatus === 'not_submitted' || !user?.kycStatus ? 'KYC Not Started' : 'KYC Pending'}
              </p>
            </div>
          </div>
          
          <Dialog open={isEditingProfile} onOpenChange={setIsEditingProfile}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full mt-4 flex items-center justify-center gap-2 hover:bg-primary/10 hover:text-primary hover:border-primary transition-all"
                data-testid="button-edit-profile"
              >
                <span className="material-icons text-sm">edit</span>
                Update Profile
              </Button>
            </DialogTrigger>
              <DialogContent className="sm:max-w-md w-[calc(100%-2rem)] max-h-[70vh] top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] bg-gradient-to-b from-background to-muted/20 p-5 overflow-y-auto">
                <div className="pb-20">
                <DialogHeader className="mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
                      <span className="material-icons text-white text-base">person</span>
                    </div>
                    <div>
                      <DialogTitle className="text-xl font-bold">Update Profile</DialogTitle>
                      <p className="text-sm text-muted-foreground">Keep your info up to date</p>
                    </div>
                  </div>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Profile Picture Section */}
                  <div className="flex flex-col items-center space-y-3 pb-4 border-b border-border/50">
                    <div className="relative group">
                      {photoPreview ? (
                        <img 
                          src={photoPreview} 
                          alt="Profile" 
                          className="w-24 h-24 rounded-full object-cover border-4 border-primary/20 shadow-lg transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-24 h-24 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center shadow-lg transition-transform group-hover:scale-105">
                          <span className="text-white font-bold text-3xl">
                            {user?.fullName?.split(' ').map(n => n[0]).join('') || 'JD'}
                          </span>
                        </div>
                      )}
                      <button 
                        type="button"
                        onClick={() => photoInputRef.current?.click()}
                        disabled={uploadPhotoMutation.isPending}
                        className="absolute bottom-0 right-0 w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-xl hover:bg-primary/90 transition-all hover:scale-110 disabled:opacity-50 border-4 border-background"
                      >
                        {uploadPhotoMutation.isPending ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <span className="material-icons text-white text-base">photo_camera</span>
                        )}
                      </button>
                    </div>
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoSelect}
                      className="hidden"
                    />
                    <div className="text-center space-y-1">
                      <p className="text-sm font-medium text-foreground">
                        {uploadPhotoMutation.isPending ? "Uploading..." : "Profile Photo"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Click camera icon to update
                      </p>
                    </div>
                  </div>

                  {/* Personal Information */}
                  {(() => {
                    const isKYCVerified = user?.kycStatus === 'verified';
                    return (
                    <div className="space-y-4 bg-muted/30 p-4 rounded-xl">
                      <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                        <span className="material-icons text-sm text-primary">badge</span>
                        Personal Information
                        {isKYCVerified && (
                          <span className="ml-auto flex items-center gap-1 text-xs font-normal text-green-600 dark:text-green-400">
                            <ShieldCheck className="w-3.5 h-3.5" /> KYC Verified — locked
                          </span>
                        )}
                      </h4>
                      {isKYCVerified && (
                        <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3 text-xs text-amber-800 dark:text-amber-300">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>Your identity has been verified. Name, email, phone and country are locked to your KYC documents. Only your profile photo and password can be changed.</span>
                        </div>
                      )}
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="fullName" className="text-sm font-medium">Full Name *</Label>
                          <Input
                            id="fullName"
                            placeholder="e.g., John Doe"
                            value={isKYCVerified ? (user?.kycFullName || profileData.fullName) : profileData.fullName}
                            onChange={(e) => !isKYCVerified && setProfileData({ ...profileData, fullName: e.target.value })}
                            readOnly={isKYCVerified}
                            data-testid="input-full-name"
                            className={`mt-1.5 ${isKYCVerified ? 'opacity-60 cursor-not-allowed bg-muted' : ''}`}
                          />
                          {isKYCVerified && <p className="text-xs text-muted-foreground mt-1">Name from your KYC document</p>}
                        </div>
                        <div>
                          <Label htmlFor="email" className="text-sm font-medium">Email Address *</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="your.email@example.com"
                            value={profileData.email}
                            onChange={(e) => !isKYCVerified && setProfileData({ ...profileData, email: e.target.value })}
                            readOnly={isKYCVerified}
                            data-testid="input-email"
                            className={`mt-1.5 ${isKYCVerified ? 'opacity-60 cursor-not-allowed bg-muted' : ''}`}
                          />
                          <p className="text-xs text-muted-foreground mt-1.5">Used for account notifications</p>
                        </div>
                        <div>
                          <Label htmlFor="phone" className="text-sm font-medium">Phone Number *</Label>
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="+1234567890"
                            value={profileData.phone}
                            onChange={(e) => !isKYCVerified && setProfileData({ ...profileData, phone: e.target.value })}
                            readOnly={isKYCVerified}
                            data-testid="input-phone"
                            className={`mt-1.5 ${isKYCVerified ? 'opacity-60 cursor-not-allowed bg-muted' : ''}`}
                          />
                          <p className="text-xs text-muted-foreground mt-1.5">Used for payments and 2FA</p>
                        </div>
                        <div>
                          <Label htmlFor="country" className="text-sm font-medium">Country *</Label>
                          {isKYCVerified ? (
                            <Input
                              id="country"
                              value={profileData.country}
                              readOnly
                              className="mt-1.5 opacity-60 cursor-not-allowed bg-muted"
                            />
                          ) : (
                            <Select
                              value={profileData.country}
                              onValueChange={(value) => setProfileData({ ...profileData, country: value })}
                            >
                              <SelectTrigger data-testid="select-country" className="mt-1.5">
                                <SelectValue placeholder="Select your country" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Kenya">🇰🇪 Kenya</SelectItem>
                                <SelectItem value="Nigeria">🇳🇬 Nigeria</SelectItem>
                                <SelectItem value="Ghana">🇬🇭 Ghana</SelectItem>
                                <SelectItem value="South Africa">🇿🇦 South Africa</SelectItem>
                                <SelectItem value="Uganda">🇺🇬 Uganda</SelectItem>
                                <SelectItem value="Tanzania">🇹🇿 Tanzania</SelectItem>
                                <SelectItem value="Rwanda">🇷🇼 Rwanda</SelectItem>
                                <SelectItem value="Ethiopia">🇪🇹 Ethiopia</SelectItem>
                                <SelectItem value="Senegal">🇸🇳 Senegal</SelectItem>
                                <SelectItem value="Cameroon">🇨🇲 Cameroon</SelectItem>
                                <SelectItem value="Ivory Coast">🇨🇮 Ivory Coast</SelectItem>
                                <SelectItem value="Congo">🇨🇩 Congo (DRC)</SelectItem>
                                <SelectItem value="Zambia">🇿🇲 Zambia</SelectItem>
                                <SelectItem value="Sierra Leone">🇸🇱 Sierra Leone</SelectItem>
                                <SelectItem value="United States">🇺🇸 United States</SelectItem>
                                <SelectItem value="United Kingdom">🇬🇧 United Kingdom</SelectItem>
                                <SelectItem value="Canada">🇨🇦 Canada</SelectItem>
                                <SelectItem value="Germany">🇩🇪 Germany</SelectItem>
                                <SelectItem value="France">🇫🇷 France</SelectItem>
                                <SelectItem value="Netherlands">🇳🇱 Netherlands</SelectItem>
                                <SelectItem value="Other">🌍 Other</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      </div>
                    </div>
                    );
                  })()}

                  {/* Password Change Section */}
                  <div className="border-t border-border pt-4">
                    <button
                      onClick={() => setIsChangingPassword(!isChangingPassword)}
                      className="flex items-center justify-between w-full text-sm font-medium text-foreground hover:text-primary transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <span className="material-icons text-sm">lock</span>
                        Change Password
                      </span>
                      <span className={`material-icons text-sm transition-transform ${isChangingPassword ? 'rotate-180' : ''}`}>
                        expand_more
                      </span>
                    </button>
                    
                    {isChangingPassword && (
                      <div className="mt-4 space-y-3">
                        <div>
                          <Label htmlFor="currentPassword" className="text-sm">Current Password</Label>
                          <Input
                            id="currentPassword"
                            type="password"
                            placeholder="Enter current password"
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                            className="mt-1.5"
                          />
                        </div>
                        <div>
                          <Label htmlFor="newPassword" className="text-sm">New Password</Label>
                          <Input
                            id="newPassword"
                            type="password"
                            placeholder="Min. 8 characters"
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                            className="mt-1.5"
                          />
                        </div>
                        <div>
                          <Label htmlFor="confirmPassword" className="text-sm">Confirm New Password</Label>
                          <Input
                            id="confirmPassword"
                            type="password"
                            placeholder="Re-enter new password"
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                            className="mt-1.5"
                          />
                        </div>
                        <Button
                          onClick={handlePasswordChange}
                          className="w-full"
                          disabled={changePasswordMutation.isPending}
                        >
                          {changePasswordMutation.isPending ? (
                            <>
                              <span className="material-icons animate-spin text-sm mr-2">sync</span>
                              Updating...
                            </>
                          ) : (
                            <>
                              <span className="material-icons text-sm mr-2">check</span>
                              Update Password
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-6 pb-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsEditingProfile(false)}
                      className="flex-1 hover:bg-muted transition-all"
                    >
                      <span className="material-icons text-sm mr-2">close</span>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleProfileUpdate}
                      className="flex-1 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white shadow-lg hover:shadow-xl transition-all"
                      disabled={updateProfileMutation.isPending}
                      data-testid="button-save-profile"
                    >
                      {updateProfileMutation.isPending ? (
                        <>
                          <span className="material-icons animate-spin text-sm mr-2">sync</span>
                          Saving...
                        </>
                      ) : (
                        <>
                          <span className="material-icons text-sm mr-2">check_circle</span>
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                </div>
              </DialogContent>
            </Dialog>
        </motion.div>

        {/* Verified Identity Card — shows extracted Didit data */}
        <KycIdentityCard user={user} />

        {/* Account Settings */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          <h3 className="font-semibold text-sm text-muted-foreground">ACCOUNT</h3>
          
          {/* Default Currency */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="bg-card p-4 rounded-xl border border-border flex items-center justify-between elevation-1"
          >
            <div className="flex items-center">
              <span className="material-icons text-primary mr-3">account_balance</span>
              <div>
                <p className="font-medium">Default Currency</p>
                <p className="text-sm text-muted-foreground">Choose your preferred currency</p>
              </div>
            </div>
            <Select 
              value={settings.defaultCurrency}
              onValueChange={(value) => handleSettingUpdate('defaultCurrency', value)}
            >
              <SelectTrigger className="w-32" data-testid="select-default-currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableCurrencies.length > 0
                  ? availableCurrencies.map(c => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.flag} {c.code}
                      </SelectItem>
                    ))
                  : (
                    <>
                      <SelectItem value="USD">🇺🇸 USD</SelectItem>
                      <SelectItem value="KES">🇰🇪 KES</SelectItem>
                    </>
                  )
                }
              </SelectContent>
            </Select>
          </motion.div>

          {/* KYC Management */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setLocation("/kyc")}
            className="w-full bg-card p-4 rounded-xl border border-border flex items-center justify-between hover:bg-muted transition-colors elevation-1"
            data-testid="button-kyc"
          >
            <div className="flex items-center">
              <span className="material-icons text-secondary mr-3">verified_user</span>
              <div className="text-left">
                <p className="font-medium">Identity Verification</p>
                <p className="text-sm text-muted-foreground">Manage your KYC documents</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5" />
          </motion.button>

          {/* Virtual Card */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setLocation("/virtual-card")}
            className="w-full bg-card p-4 rounded-xl border border-border flex items-center justify-between hover:bg-muted transition-colors elevation-1"
            data-testid="button-virtual-card-settings"
          >
            <div className="flex items-center">
              <span className="material-icons text-primary mr-3">credit_card</span>
              <div className="text-left">
                <p className="font-medium">Virtual Card</p>
                <p className="text-sm text-muted-foreground">
                  {user?.hasVirtualCard ? 'Manage your card' : 'Purchase virtual card'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5" />
          </motion.button>
        </motion.div>

        {/* Security Settings */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
          <h3 className="font-semibold text-sm text-muted-foreground">SECURITY</h3>
          
          {/* 2FA */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="bg-card p-4 rounded-xl border border-border flex items-center justify-between elevation-1"
          >
            <div className="flex items-center">
              <span className="material-icons mr-3" style={{ color: '#16a34a' }}>security</span>
              <div>
                <p className="font-medium">Two-Factor Authentication</p>
                <p className="text-sm text-muted-foreground">Add extra security to your account</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={settings.twoFactorEnabled}
                onCheckedChange={(checked) => {
                  if (checked && !settings.twoFactorEnabled) {
                    setTwoFAStep('qr');
                    setup2FAMutation.mutate();
                  } else if (!checked && settings.twoFactorEnabled) {
                    // Show disable dialog - for now just disable directly
                    disable2FAMutation.mutate('');
                  }
                }}
                data-testid="switch-2fa"
              />
              {setup2FAMutation.isPending && <span className="text-xs">Setting up...</span>}
            </div>
          </motion.div>

          {/* PIN Code */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="bg-card p-4 rounded-xl border border-border flex items-center justify-between elevation-1"
          >
            <div className="flex items-center flex-1">
              <span className="material-icons mr-3" style={{ color: '#2563eb' }}>lock</span>
              <div className="flex-1">
                <p className="font-medium">PIN Code</p>
                <p className="text-sm text-muted-foreground">
                  {settings.pinEnabled ? 'PIN is set' : 'Set a 4-digit PIN'}
                </p>
              </div>
            </div>
            {!settings.pinEnabled && (
              <Dialog open={isPinSetup} onOpenChange={setIsPinSetup}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    Set PIN
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Set Your PIN</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    {pinSetupStep === 'create' && (
                      <>
                        <div>
                          <Label>Enter 4-digit PIN</Label>
                          <Input
                            type="password"
                            inputMode="numeric"
                            placeholder="••••"
                            maxLength={4}
                            value={pinValue}
                            onChange={(e) => setPinValue(e.target.value.replace(/[^0-9]/g, ''))}
                            className="text-center text-2xl tracking-widest mt-2"
                          />
                        </div>
                        <Button
                          className="w-full"
                          disabled={pinValue.length !== 4}
                          onClick={() => setPinSetupStep('confirm')}
                        >
                          Next
                        </Button>
                      </>
                    )}
                    {pinSetupStep === 'confirm' && (
                      <>
                        <div>
                          <Label>Confirm PIN</Label>
                          <Input
                            type="password"
                            inputMode="numeric"
                            placeholder="••••"
                            maxLength={4}
                            value={pinConfirm}
                            onChange={(e) => setPinConfirm(e.target.value.replace(/[^0-9]/g, ''))}
                            className="text-center text-2xl tracking-widest mt-2"
                          />
                        </div>
                        {pinValue !== pinConfirm && pinConfirm && (
                          <p className="text-sm text-destructive">PINs do not match</p>
                        )}
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                              setPinSetupStep('create');
                              setPinValue('');
                              setPinConfirm('');
                            }}
                          >
                            Back
                          </Button>
                          <Button
                            className="flex-1"
                            disabled={pinValue !== pinConfirm || pinConfirm.length !== 4 || setupPinMutation.isPending}
                            onClick={() => setupPinMutation.mutate(pinValue)}
                          >
                            {setupPinMutation.isPending ? 'Setting...' : 'Set PIN'}
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            )}
            {settings.pinEnabled && (
              <Dialog open={isPinDisable} onOpenChange={setIsPinDisable}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="destructive">
                    Reset PIN
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-sm">
                  <DialogHeader>
                    <DialogTitle className="text-destructive">Reset Your PIN</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                      <p className="text-sm text-destructive font-medium">
                        ⚠️ This will disable your PIN protection. You'll need to set a new one to use PIN authentication.
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="disable-pin-password">Enter your password to confirm</Label>
                      <Input
                        id="disable-pin-password"
                        type="password"
                        placeholder="••••••••"
                        value={disablePinPassword}
                        onChange={(e) => setDisablePinPassword(e.target.value)}
                        className="mt-2"
                        autoFocus
                      />
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setIsPinDisable(false);
                          setDisablePinPassword('');
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        className="flex-1"
                        disabled={!disablePinPassword || disablePinMutation.isPending}
                        onClick={() => disablePinMutation.mutate(disablePinPassword)}
                      >
                        {disablePinMutation.isPending ? 'Disabling...' : 'Reset PIN'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </motion.div>

          {/* Biometric */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="bg-card p-4 rounded-xl border border-border flex items-center justify-between elevation-1"
          >
            <div className="flex items-center">
              <span className="material-icons mr-3" style={{ color: '#7c3aed' }}>fingerprint</span>
              <div>
                <p className="font-medium">Biometric Authentication</p>
                <p className="text-sm text-muted-foreground">Fingerprint, face, or device unlock</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={settings.biometricEnabled}
                onCheckedChange={(checked) => {
                  if (checked && !settings.biometricEnabled) {
                    setupFingerprintMutation.mutate();
                  } else if (!checked && settings.biometricEnabled) {
                    disableBiometricMutation.mutate();
                  }
                }}
                disabled={setupFingerprintMutation.isPending || disableBiometricMutation.isPending}
                data-testid="switch-biometric"
              />
              {(setupFingerprintMutation.isPending || disableBiometricMutation.isPending) && <span className="text-xs">Processing...</span>}
            </div>
          </motion.div>

          {/* Dark Mode Toggle */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="bg-card p-4 rounded-xl border border-border flex items-center justify-between elevation-1"
          >
            <div className="flex items-center">
              <span className="material-icons mr-3" style={{ color: '#475569' }}>dark_mode</span>
              <div>
                <p className="font-medium">Dark Mode</p>
                <p className="text-sm text-muted-foreground">Use dark theme</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={settings.darkMode || false}
                onCheckedChange={(checked) => {
                  handleSettingUpdate('darkMode', checked);
                  if (checked) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                }}
                data-testid="switch-dark-mode"
              />
            </div>
          </motion.div>
        </motion.div>

        {/* 2FA Setup Dialog */}
        <Dialog open={is2FASetup} onOpenChange={(open) => {
          if (!open) {
            setIs2FASetup(false);
            setTwoFAStep('qr');
            setVerificationCode('');
          }
        }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {twoFAStep === 'qr' && 'Setup Two-Factor Authentication'}
                {twoFAStep === 'verify' && 'Verify Your Authenticator'}
                {twoFAStep === 'backup' && 'Save Your Backup Codes'}
              </DialogTitle>
            </DialogHeader>

            {/* QR Code Step */}
            {twoFAStep === 'qr' && qrCodeUrl && (
              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-lg text-center">
                  <img src={qrCodeUrl} alt="2FA QR Code" className="w-48 h-48 mx-auto" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">Scan with Authenticator App</h3>
                  <p className="text-sm text-muted-foreground">
                    Use Google Authenticator, Authy, Microsoft Authenticator, or any TOTP-compatible app to scan this QR code.
                  </p>
                </div>
                {twoFASecret && (
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Or enter this code manually:</p>
                    <p className="font-mono text-sm font-semibold break-all">{twoFASecret}</p>
                  </div>
                )}
                <Button 
                  onClick={() => setTwoFAStep('verify')}
                  className="w-full"
                >
                  Next: Verify Code
                </Button>
                <Button 
                  onClick={() => {
                    setIs2FASetup(false);
                    setTwoFAStep('qr');
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
            )}

            {/* Verification Step */}
            {twoFAStep === 'verify' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Enter the 6-digit code from your authenticator app to verify the setup:
                  </p>
                  <div className="flex gap-1 justify-center">
                    {Array(6).fill(0).map((_, i) => (
                      <input
                        key={i}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={verificationCode[i] || ''}
                        onChange={(e) => {
                          let value = e.target.value.replace(/[^0-9]/g, '');
                          const newCode = verificationCode.split('');
                          newCode[i] = value;
                          const fullCode = newCode.join('').slice(0, 6);
                          setVerificationCode(fullCode);
                          
                          if (fullCode.length === 6 && i < 5) {
                            (e.target.parentElement?.children[i + 1] as HTMLInputElement)?.focus();
                          }
                        }}
                        onPaste={(e) => {
                          e.preventDefault();
                          const paste = (e.clipboardData || (window as any).clipboardData).getData('text');
                          const digits = paste.replace(/[^0-9]/g, '').slice(0, 6);
                          setVerificationCode(digits);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Backspace' && !e.currentTarget.value && i > 0) {
                            (e.currentTarget.parentElement?.children[i - 1] as HTMLInputElement)?.focus();
                          }
                        }}
                        className="w-12 h-12 text-center text-xl font-bold border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    ))}
                  </div>
                </div>
                <Button 
                  onClick={() => verify2FAMutation.mutate(verificationCode)}
                  disabled={verificationCode.length !== 6 || verify2FAMutation.isPending}
                  className="w-full"
                >
                  {verify2FAMutation.isPending ? 'Verifying...' : 'Verify & Enable'}
                </Button>
                <Button 
                  onClick={() => setTwoFAStep('qr')}
                  variant="outline"
                  className="w-full"
                  disabled={verify2FAMutation.isPending}
                >
                  Back
                </Button>
              </div>
            )}

            {/* Backup Codes Step */}
            {twoFAStep === 'backup' && (
              <div className="space-y-4">
                {backupCodes.length > 0 ? (
                  <>
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40 p-3 rounded-lg">
                      <p className="text-sm text-amber-900 dark:text-amber-200">
                        <strong>✓ Save these backup codes in a safe place.</strong> You can use them to access your account if you lose your authenticator device.
                      </p>
                    </div>
                    <div className="bg-muted p-4 rounded-lg space-y-2 max-h-64 overflow-y-auto border border-border">
                      {backupCodes.map((code, idx) => (
                        <div key={idx} className="font-mono text-sm font-medium flex items-center justify-between bg-background/50 p-2 rounded">
                          <span className="tracking-wider">{code}</span>
                          <span className="text-xs text-muted-foreground ml-2">#{idx + 1}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => {
                          const text = backupCodes.join('\n');
                          navigator.clipboard.writeText(text);
                          toast({
                            title: "Copied",
                            description: "All backup codes copied to clipboard"
                          });
                        }}
                        variant="outline"
                        className="flex-1"
                      >
                        <span className="material-icons text-sm mr-1">content_copy</span>
                        Copy
                      </Button>
                      <Button 
                        onClick={() => {
                          const text = backupCodes.join('\n');
                          const element = document.createElement('a');
                          element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
                          element.setAttribute('download', 'backup-codes.txt');
                          element.style.display = 'none';
                          document.body.appendChild(element);
                          element.click();
                          document.body.removeChild(element);
                          toast({
                            title: "Downloaded",
                            description: "Backup codes downloaded as file"
                          });
                        }}
                        variant="outline"
                        className="flex-1"
                      >
                        <span className="material-icons text-sm mr-1">download</span>
                        Save
                      </Button>
                    </div>
                    <Button 
                      onClick={() => {
                        setIs2FASetup(false);
                        setTwoFAStep('qr');
                        setVerificationCode('');
                        setBackupCodes([]);
                        handleSettingUpdate('twoFactorEnabled', true);
                      }}
                      className="w-full"
                    >
                      I've Saved My Codes - Done
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <span className="material-icons text-4xl text-muted-foreground mb-2">hourglass_empty</span>
                    <p className="text-muted-foreground">Loading backup codes...</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Disable 2FA Dialog */}
        {settings.twoFactorEnabled && (
          <Dialog open={false} onOpenChange={() => {}}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Enter your password to disable 2FA. This will remove the extra security from your account.
                </p>
                <Input
                  type="password"
                  placeholder="Enter your password"
                  value={disablePasswordConfirm}
                  onChange={(e) => setDisablePasswordConfirm(e.target.value)}
                />
                <Button 
                  onClick={() => disable2FAMutation.mutate(disablePasswordConfirm)}
                  disabled={!disablePasswordConfirm || disable2FAMutation.isPending}
                  className="w-full bg-destructive hover:bg-destructive/90"
                >
                  {disable2FAMutation.isPending ? 'Disabling...' : 'Disable 2FA'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Devices Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="space-y-3"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Devices & Sessions</h3>
            {devices.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={() => revokeAllSessionsMutation.mutate()}
                disabled={revokeAllSessionsMutation.isPending}
              >
                {revokeAllSessionsMutation.isPending ? "Revoking..." : "Sign Out All Others"}
              </Button>
            )}
          </div>

          {devices.length === 0 ? (
            <div className="bg-card p-4 rounded-xl border border-border text-sm text-muted-foreground text-center elevation-1">
              No recent device activity
            </div>
          ) : (
            <div className="space-y-2">
              {devices.slice(0, 5).map((device: any, i: number) => (
                <motion.div
                  key={device.id || i}
                  whileHover={{ scale: 1.01 }}
                  className="bg-card p-3.5 rounded-xl border border-border elevation-1"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      {getDeviceIcon(device.deviceType || 'desktop')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-sm truncate">
                          {device.browser || 'Unknown Browser'}
                          {device.deviceType && <span className="text-muted-foreground"> · {device.deviceType}</span>}
                        </p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${device.status === 'success' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                          {device.status === 'success' ? 'Logged in' : 'Failed'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        {device.location && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Globe className="w-3 h-3" /> {device.location}
                          </span>
                        )}
                        {device.ipAddress && (
                          <span className="text-xs text-muted-foreground">{device.ipAddress}</span>
                        )}
                      </div>
                      {device.createdAt && (
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(device.createdAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-3"
        >
          <h3 className="font-semibold text-sm text-muted-foreground">NOTIFICATIONS</h3>
          
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="bg-card p-4 rounded-xl border border-border flex items-center justify-between elevation-1"
          >
            <div className="flex items-center">
              <span className="material-icons text-primary mr-3">notifications</span>
              <div>
                <p className="font-medium">Push Notifications</p>
                <p className="text-sm text-muted-foreground">Transaction alerts and updates</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={settings.pushNotificationsEnabled}
                onCheckedChange={(checked) => {
                  if (checked && !settings.pushNotificationsEnabled) {
                    requestNotificationPermission();
                  } else {
                    handleSettingUpdate('pushNotificationsEnabled', checked);
                  }
                }}
                data-testid="switch-notifications"
              />
            </div>
          </motion.div>
        </motion.div>

        {/* Download App */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.47 }}
          className="space-y-3"
        >
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Download App</h3>

          {/* Play Store */}
          {appDownloads?.playStoreUrl && (
            <motion.a
              href={appDownloads.playStoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full bg-black p-4 rounded-xl flex items-center gap-3 text-white elevation-2 cursor-pointer"
              data-testid="button-playstore"
            >
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center shrink-0">
                <span className="material-icons text-white">shop</span>
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-400">GET IT ON</p>
                <p className="font-bold text-base leading-tight">Google Play</p>
              </div>
              <span className="material-icons text-gray-400 text-sm">open_in_new</span>
            </motion.a>
          )}

          {/* App Store */}
          {appDownloads?.appStoreUrl && (
            <motion.a
              href={appDownloads.appStoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full bg-black p-4 rounded-xl flex items-center gap-3 text-white elevation-2 cursor-pointer"
              data-testid="button-appstore"
            >
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center shrink-0">
                <span className="material-icons text-white">apple</span>
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-400">DOWNLOAD ON THE</p>
                <p className="font-bold text-base leading-tight">App Store</p>
              </div>
              <span className="material-icons text-gray-400 text-sm">open_in_new</span>
            </motion.a>
          )}

          {/* Huawei AppGallery */}
          {appDownloads?.huaweiUrl && (
            <motion.a
              href={appDownloads.huaweiUrl}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full bg-red-600 p-4 rounded-xl flex items-center gap-3 text-white elevation-2 cursor-pointer"
              data-testid="button-huawei"
            >
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center shrink-0">
                <span className="material-icons text-white">storefront</span>
              </div>
              <div className="flex-1">
                <p className="text-xs text-red-100">EXPLORE IT ON</p>
                <p className="font-bold text-base leading-tight">AppGallery</p>
              </div>
              <span className="material-icons text-red-100 text-sm">open_in_new</span>
            </motion.a>
          )}

          {/* Manual APK download */}
          {(appDownloads?.apkUrl || appDownloads === undefined) && (
            <motion.a
              href={appDownloads?.apkUrl || "/greenpay.apk"}
              download="GreenPay.apk"
              target={appDownloads?.apkUrl?.startsWith("http") ? "_blank" : undefined}
              rel="noopener noreferrer"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-700 p-4 rounded-xl flex items-center gap-3 text-white elevation-2 cursor-pointer"
              data-testid="button-download-apk"
            >
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                <Download className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">Download APK Directly</p>
                <p className="text-sm text-green-100">Android · {appDownloads?.apkVersion ? `Version ${appDownloads.apkVersion}` : "Latest version"}</p>
              </div>
              <span className="material-icons text-white/80">android</span>
            </motion.a>
          )}

          {/* If no links are configured at all */}
          {appDownloads &&
           !appDownloads.playStoreUrl &&
           !appDownloads.appStoreUrl &&
           !appDownloads.apkUrl &&
           !appDownloads.huaweiUrl && (
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <p className="text-sm text-muted-foreground">App download links are not yet available. Please check back soon.</p>
            </div>
          )}

          {/* Manual install instructions */}
          <motion.div className="bg-card border border-border rounded-xl overflow-hidden elevation-1">
            <button
              onClick={() => setShowInstallGuide(prev => !prev)}
              className="w-full p-4 flex items-center justify-between text-sm font-medium"
            >
              <div className="flex items-center gap-2">
                <span className="material-icons text-primary text-base">help_outline</span>
                How to install the APK manually
              </div>
              <span className="material-icons text-muted-foreground text-sm">{showInstallGuide ? "expand_less" : "expand_more"}</span>
            </button>
            {showInstallGuide && (
              <div className="px-4 pb-4 space-y-2 border-t border-border">
                {[
                  { step: 1, text: 'Download the APK file using the "Download APK" button above.' },
                  { step: 2, text: 'Open your phone\'s Settings → Security (or Privacy).' },
                  { step: 3, text: 'Enable "Install unknown apps" or "Allow from this source".' },
                  { step: 4, text: 'Open the downloaded GreenPay.apk file from your Downloads folder.' },
                  { step: 5, text: 'Tap "Install" and wait for the installation to complete.' },
                  { step: 6, text: 'Open GreenPay and log in with your existing account.' },
                ].map(({ step, text }) => (
                  <div key={step} className="flex items-start gap-3 pt-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-primary">{step}</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-snug">{text}</p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>

        {/* Support & Legal */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-3"
        >
          <h3 className="font-semibold text-sm text-muted-foreground">SUPPORT & LEGAL</h3>
          
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setLocation("/support")}
            className="w-full bg-card p-4 rounded-xl border border-border flex items-center justify-between hover:bg-muted transition-colors elevation-1"
            data-testid="button-support"
          >
            <div className="flex items-center">
              <HelpCircle className="w-5 h-5 text-primary mr-3" />
              <div className="text-left">
                <p className="font-medium">Help & Support</p>
                <p className="text-sm text-muted-foreground">Get help and contact support</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={handleLogout}
            className="w-full bg-destructive/10 p-4 rounded-xl border border-destructive/20 flex items-center justify-between hover:bg-destructive/20 transition-colors elevation-1"
            data-testid="button-logout"
          >
            <div className="flex items-center">
              <LogOut className="w-5 h-5 text-destructive mr-3" />
              <span className="font-medium text-destructive">Sign Out</span>
            </div>
          </motion.button>
        </motion.div>

        <div className="text-center pt-6 pb-4">
          <p className="text-sm text-muted-foreground">Geepay v2.1.0</p>
        </div>
      </div>
    </div>
  );
}

// ── Verified Identity Card (read-only Didit extracted data) ──────────────────
function KycIdentityCard({ user }: { user?: any }) {
  if (user?.kycStatus !== "verified") return null;

  const u = user as any;
  const fields = [
    { icon: <User className="w-4 h-4" />,     label: "Full Name (Verified)",  value: u.kycFullName },
    { icon: <Calendar className="w-4 h-4" />, label: "Date of Birth",          value: u.kycDateOfBirth },
    { icon: <Hash className="w-4 h-4" />,      label: "ID / Document Number",  value: u.kycIdNumber },
    { icon: <Globe className="w-4 h-4" />,     label: "Nationality",           value: u.kycNationality },
    { icon: <Globe className="w-4 h-4" />,     label: "Gender",                value: u.kycGender },
    { icon: <CreditCard className="w-4 h-4" />,label: "Document Type",         value: u.kycDocumentType },
    { icon: <CreditCard className="w-4 h-4" />,label: "Document Expiry",       value: u.kycIdExpiryDate },
    { icon: <Globe className="w-4 h-4" />,     label: "Issuing Country",       value: u.kycIssuingCountry },
    { icon: <MapPin className="w-4 h-4" />,    label: "Address (from ID)",     value: u.kycAddress },
  ].filter(f => f.value);

  if (fields.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="bg-card border border-border rounded-xl overflow-hidden elevation-1"
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border-b border-border">
        <div className="w-9 h-9 bg-green-100 dark:bg-green-800/30 rounded-full flex items-center justify-center shrink-0">
          <ShieldCheck className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <p className="font-semibold text-sm">Verified Identity</p>
          <p className="text-xs text-muted-foreground">Data from Didit eKYC — read only</p>
        </div>
      </div>

      {/* Fields */}
      <div className="divide-y divide-border">
        {fields.map((f, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <div className="text-muted-foreground shrink-0">{f.icon}</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">{f.label}</p>
              <p className="text-sm font-medium truncate">{f.value}</p>
            </div>
            <AlertCircle className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" title="Read only — from identity verification" />
          </div>
        ))}
      </div>

      <div className="px-4 py-3 bg-muted/30 text-xs text-muted-foreground flex items-center gap-1.5">
        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
        These details were extracted from your verified ID and cannot be edited.
      </div>
    </motion.div>
  );
}