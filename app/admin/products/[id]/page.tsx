import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminProductFormClient from "@/components/admin/AdminProductFormClient";

export default async function AdminProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const isNew = id === "new";

  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  if (isNew) {
    return <AdminProductFormClient product={null} categories={categories} />;
  }

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      variants: { orderBy: { price: "asc" } },
    },
  });

  if (!product) notFound();
  return <AdminProductFormClient product={product} categories={categories} />;
}
