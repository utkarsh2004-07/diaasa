import { prisma } from "@/lib/prisma";
import AdminReviewsClient from "@/components/admin/AdminReviewsClient";

export default async function AdminReviewsPage() {
  const reviews = await prisma.review.findMany({
    include: {
      user: { select: { name: true, phone: true } },
      product: { select: { name: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return <AdminReviewsClient reviews={reviews} />;
}
