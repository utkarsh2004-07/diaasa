import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { TAGS } from "@/lib/cache";
import Link from "next/link";
import Image from "next/image";
import { Calendar, Tag, ArrowRight } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog — Diaasa Store",
  description: "Skincare tips, ingredient guides, and beauty advice from Diaasa.",
};

const getPosts = unstable_cache(
  async () => prisma.blogPost.findMany({
    where: { status: "PUBLISHED" },
    select: {
      id: true, title: true, slug: true, excerpt: true,
      coverImage: true, tags: true, publishedAt: true, createdAt: true,
      author: { select: { name: true } },
    },
    orderBy: { publishedAt: "desc" },
    take: 50,
  }),
  ["blog-list-page"],
  { revalidate: 3600, tags: [TAGS.blog] }
);

export default async function BlogPage() {
  const posts = await getPosts();

  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <p className="font-body text-xs tracking-widest uppercase text-brand-600 mb-3">Our Journal</p>
        <h1 className="font-display text-4xl md:text-5xl font-light text-charcoal-900">Blog</h1>
        <p className="font-body text-sm text-charcoal-400 mt-3 max-w-md mx-auto">
          Skincare tips, Ayurvedic wisdom, ingredient guides and more.
        </p>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-24">
          <p className="font-display text-3xl font-light text-charcoal-300">No posts yet</p>
          <p className="font-body text-sm text-charcoal-400 mt-2">Check back soon!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {posts.map((post) => (
            <Link key={post.id} href={`/blog/${post.slug}`} className="group block">
              {/* Cover */}
              <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden bg-cream-100 mb-4">
                {post.coverImage ? (
                  <Image
                    src={post.coverImage} alt={post.title} fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-cream-200 to-brand-100 flex items-center justify-center">
                    <span className="font-display text-5xl text-brand-300">✦</span>
                  </div>
                )}
              </div>

              {/* Meta */}
              <div className="flex items-center gap-3 mb-2">
                <span className="flex items-center gap-1 font-body text-[11px] text-charcoal-400">
                  <Calendar size={11} />
                  {new Date(post.publishedAt || post.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </span>
                {post.tags && (
                  <span className="flex items-center gap-1 font-body text-[11px] text-brand-600">
                    <Tag size={11} />
                    {post.tags.split(",")[0].trim()}
                  </span>
                )}
              </div>

              <h2 className="font-body text-base font-semibold text-charcoal-900 group-hover:text-brand-600 transition-colors leading-snug line-clamp-2">
                {post.title}
              </h2>
              {post.excerpt && (
                <p className="font-body text-sm text-charcoal-500 mt-1.5 line-clamp-2 leading-relaxed">
                  {post.excerpt}
                </p>
              )}
              <span className="inline-flex items-center gap-1 mt-3 font-body text-xs font-semibold text-brand-600 group-hover:gap-2 transition-all">
                Read More <ArrowRight size={12} />
              </span>
            </Link>
          ))}
        </div>
      )}
      </main>
      <Footer />
    </>
  );
}
