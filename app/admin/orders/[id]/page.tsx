import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminOrderDetailClient from "@/components/admin/AdminOrderDetailClient";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      user: { select: { id: true, name: true, phone: true, email: true } },
      address: true,
    },
  });

  if (!order) notFound();
  const serialized = {
    ...order,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt?.toISOString(),
    items: order.items.map((i) => ({ ...i })),
  };
  return <AdminOrderDetailClient order={serialized as any} />;
}
