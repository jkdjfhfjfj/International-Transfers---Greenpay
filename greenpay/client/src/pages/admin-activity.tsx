import AdminShell from "@/components/admin/admin-shell";
import UserActivityLogs from "@/components/admin/user-activity-logs";
export default function AdminActivityPage() {
  return <AdminShell title="Activity Logs"><UserActivityLogs /></AdminShell>;
}
