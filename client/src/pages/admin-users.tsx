import AdminShell from "@/components/admin/admin-shell";
import UserManagement from "@/components/admin/user-management";
export default function AdminUsersPage() {
  return <AdminShell title="User Management"><UserManagement /></AdminShell>;
}
