import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ProfileClient from "@/components/profile/ProfileClient";

export default async function ProfilePage() {
  const user = await getAuthUser();
  if (!user) redirect("/login?redirect=/profile");

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    include: { items: { take: 1 } },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const addresses = await prisma.address.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  return (
    <>
      <Header />
      <main className="min-h-screen bg-cream-50">
        <ProfileClient user={user} orders={orders} addresses={addresses} />
      </main>
      <Footer />
    </>
  );
}
