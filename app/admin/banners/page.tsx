import { prisma } from "@/lib/prisma";
import AdminBannersClient from "@/components/admin/AdminBannersClient";

export default async function AdminBannersPage() {
  const banners = await prisma.banner.findMany({
    orderBy: [{ type: "asc" }, { priority: "asc" }],
  });
  return <AdminBannersClient banners={banners} />;
}
