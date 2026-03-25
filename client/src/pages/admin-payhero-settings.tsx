import AdminShell from "@/components/admin/admin-shell";
import PayHeroSettings from "@/components/admin/payhero-settings";
export default function AdminPayHeroSettingsPage() {
  return (
    <AdminShell title="PayHero Settings">
      <PayHeroSettings />
    </AdminShell>
  );
}
