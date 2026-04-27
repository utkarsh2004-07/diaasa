import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import AdminLayoutClient from "@/components/admin/AdminLayoutClient";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin().catch(() => null);
  if (!session) redirect("/login?redirect=/admin");

  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
