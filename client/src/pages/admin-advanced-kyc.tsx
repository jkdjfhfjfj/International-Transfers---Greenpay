import AdminShell from "@/components/admin/admin-shell";
import { AdvancedKycSection } from "@/components/admin/kyc-management";

export default function AdminAdvancedKycPage() {
  return (
    <AdminShell title="Advanced KYC Review">
      <AdvancedKycSection />
    </AdminShell>
  );
}
