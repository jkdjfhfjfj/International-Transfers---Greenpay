import AdminShell from "@/components/admin/admin-shell";
import SupportTicketManagement from "@/components/admin/support-ticket-management";
export default function AdminTicketsPage() {
  return <AdminShell title="Support Tickets"><SupportTicketManagement /></AdminShell>;
}
