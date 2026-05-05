export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import AdminPagesClient from "@/components/admin/AdminPagesClient";

const DEFAULT_PAGES = [
  { slug: "about", title: "About Us" },
  { slug: "terms", title: "Terms & Conditions" },
  { slug: "privacy", title: "Privacy Policy" },
  { slug: "refund", title: "Refund Policy" },
  { slug: "shipping", title: "Shipping Policy" },
  { slug: "careers", title: "Careers" },
  { slug: "press", title: "Press" },
  { slug: "cookies", title: "Cookie Policy" },
  { slug: "disclaimer", title: "Disclaimer" },
];

export default async function AdminPagesPage() {
  const pages = await prisma.staticPage.findMany({ orderBy: { slug: "asc" } });
  const pageMap = pages.reduce((acc, p) => ({ ...acc, [p.slug]: p }), {} as Record<string, typeof pages[0]>);
  return <AdminPagesClient pages={DEFAULT_PAGES.map((d) => ({ ...d, content: pageMap[d.slug]?.content || "", id: pageMap[d.slug]?.id || "" }))} />;
}
