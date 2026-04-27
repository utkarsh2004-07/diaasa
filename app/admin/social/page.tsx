import { prisma } from "@/lib/prisma";
import AdminSocialClient from "@/components/admin/AdminSocialClient";

export default async function AdminSocialPage() {
  const posts = await prisma.socialPost.findMany({ orderBy: { sortOrder: "asc" } });
  return <AdminSocialClient posts={posts} />;
}
