import AdminShell from "@/components/admin/admin-shell";
import DatabaseManagement from "@/components/admin/database-management";
export default function AdminDatabasePage() {
  return <AdminShell title="Database Management"><DatabaseManagement /></AdminShell>;
}
