import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { TAGS } from "@/lib/cache";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Calendar, Tag, ArrowLeft, User } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import type { Metadata } from "next";

interface Props { params: Promise<{ slug: string }>; }

const getPost = (slug: string) =>
  unstable_cache(
    async () => prisma.blogPost.findFirst({
      where: { slug, status: "PUBLISHED" },
      include: { author: { select: { name: true, avatar: true } } },
    }),
    [`blog-post-page-${slug}`],
    { revalidate: 3600, tags: [TAGS.blog, TAGS.blogPost(slug)] }
  )();

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Post not found" };
  return {
    title: post.metaTitle || `${post.title} — Diaasa Blog`,
    description: post.metaDesc || post.excerpt || undefined,
    openGraph: post.coverImage ? { images: [post.coverImage] } : undefined,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      {/* Back */}
      <Link href="/blog" className="inline-flex items-center gap-1.5 font-body text-sm text-charcoal-400 hover:text-brand-600 transition-colors mb-8">
        <ArrowLeft size={14} /> Back to Blog
      </Link>

      {/* Cover */}
      {post.coverImage && (
        <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden bg-cream-100 mb-8">
          <Image
            src={post.coverImage} alt={post.title} fill priority
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 768px"
          />
        </div>
      )}

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <span className="flex items-center gap-1 font-body text-xs text-charcoal-400">
          <Calendar size={12} />
          {new Date(post.publishedAt || post.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
        </span>
        {post.author.name && (
          <span className="flex items-center gap-1 font-body text-xs text-charcoal-400">
            <User size={12} /> {post.author.name}
          </span>
        )}
        {post.tags && post.tags.split(",").map((t) => (
          <span key={t} className="flex items-center gap-1 font-body text-xs text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">
            <Tag size={10} /> {t.trim()}
          </span>
        ))}
      </div>

      {/* Title */}
      <h1 className="font-display text-3xl sm:text-4xl font-light text-charcoal-900 leading-tight mb-4">
        {post.title}
      </h1>

      {post.excerpt && (
        <p className="font-body text-base text-charcoal-500 leading-relaxed mb-8 border-l-4 border-brand-300 pl-4">
          {post.excerpt}
        </p>
      )}

      {/* Content */}
      <div
        className="prose prose-sm sm:prose max-w-none font-body text-charcoal-700
          prose-headings:font-display prose-headings:font-light prose-headings:text-charcoal-900
          prose-a:text-brand-600 prose-a:no-underline hover:prose-a:underline
          prose-img:rounded-2xl prose-blockquote:border-brand-400 prose-blockquote:text-charcoal-600
          prose-code:text-brand-700 prose-code:bg-brand-50 prose-code:px-1 prose-code:rounded"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      {/* Footer nav */}
      <div className="mt-12 pt-8 border-t border-charcoal-100">
        <Link href="/blog" className="btn-outline inline-flex items-center gap-2 text-sm">
          <ArrowLeft size={14} /> All Posts
        </Link>
      </div>
      </main>
      <Footer />
    </>
  );
}
