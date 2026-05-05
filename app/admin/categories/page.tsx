export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import AdminCategoriesClient from "@/components/admin/AdminCategoriesClient";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    include: {
      _count: { select: { products: true } },
      children: { select: { id: true, name: true } },
    },
    where: { parentId: null },
    orderBy: { sortOrder: "asc" },
  });

  return <AdminCategoriesClient categories={categories} />;
}
