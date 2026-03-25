import AdminShell from "@/components/admin/admin-shell";
import TransactionManagement from "@/components/admin/transaction-management";
export default function AdminTransactionsPage() {
  return <AdminShell title="Transactions"><TransactionManagement /></AdminShell>;
}
