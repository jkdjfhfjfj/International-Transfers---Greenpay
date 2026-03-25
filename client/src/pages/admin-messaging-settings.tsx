import AdminShell from "@/components/admin/admin-shell";
import MessagingSettings from "@/components/admin/messaging-settings";
export default function AdminMessagingSettingsPage() {
  return (
    <AdminShell title="Messaging Config">
      <MessagingSettings />
    </AdminShell>
  );
}
