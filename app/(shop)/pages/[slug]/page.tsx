import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await prisma.staticPage.findUnique({ where: { slug } });
  if (!page) return { title: "Page Not Found" };
  return { title: page.metaTitle || page.title, description: page.metaDesc || "" };
}

export default async function StaticPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await prisma.staticPage.findUnique({ where: { slug, isActive: true } });
  if (!page) notFound();

  return (
    <>
      <Header />
      <main className="min-h-screen bg-cream-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <h1 className="font-display text-4xl md:text-5xl font-light text-charcoal-900 mb-8">{page.title}</h1>
          <div
            className="prose prose-sm max-w-none font-body text-charcoal-600 leading-relaxed [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-light [&_h2]:text-charcoal-800 [&_h2]:mt-8 [&_h2]:mb-4 [&_a]:text-brand-600 [&_a]:no-underline [&_a:hover]:underline"
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
          <p className="font-body text-xs text-charcoal-300 mt-12 pt-6 border-t border-charcoal-100">
            Last updated: {new Date(page.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}