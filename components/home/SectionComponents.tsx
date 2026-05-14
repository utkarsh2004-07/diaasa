"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Star, Quote, Store } from "lucide-react";
import ProductCard from "@/components/product/ProductCard";

interface ProductProps {
  id: string; name: string; slug: string;
  image: string | null; hoverImage?: string | null;
  price: number; comparePrice?: number | null;
  reviewCount?: number; inStock?: boolean;
  isNew?: boolean; isBestSeller?: boolean;
  brand?: string | null; variantId?: string;
}

// ─── BestSellers ──────────────────────────────────────────
export function BestSellers({ products }: { products: ProductProps[] }) {
  return (
    <section className="py-14 md:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-10">
          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <p className="font-body text-xs tracking-widest uppercase text-brand-600 mb-2">Top Picks</p>
            <h2 className="section-title">Best Sellers</h2>
          </motion.div>
          <Link href="/products?bestseller=true" className="btn-outline text-sm hidden sm:inline-flex">View All</Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
      </div>
    </section>
  );
}

// ─── NewArrivals ──────────────────────────────────────────
export function NewArrivals({ products }: { products: ProductProps[] }) {
  if (!products.length) return null;
  return (
    <section className="py-14 md:py-20 bg-charcoal-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-10">
          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <p className="font-body text-xs tracking-widest uppercase text-brand-400 mb-2">Just Dropped</p>
            <h2 className="font-display text-3xl md:text-5xl font-light text-white">New Arrivals</h2>
          </motion.div>
          <Link href="/products?new=true" className="btn-outline border-charcoal-600 text-cream-200 hover:border-brand-400 hover:text-brand-400 text-sm hidden sm:inline-flex">See All</Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-6">
          {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} dark />)}
        </div>
      </div>
    </section>
  );
}

// ─── PromoSection ──────────────────────────────────────────
export function PromoSection() {
  return (
    <section className="py-14 md:py-20 bg-cream-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-5">
          {[
            {
              title: "Sunscreen Range",
              subtitle: "Shield your skin every day",
              cta: "Shop Now",
              href: "/products?q=sunscreen",
              bg: "bg-gradient-to-br from-amber-50 to-yellow-100",
              accent: "text-amber-700",
              dark: false,
            },
            {
              title: "Soap Collection",
              subtitle: "Ubtan, Sandalwood & Kesar",
              cta: "Explore",
              href: "/products?q=soap",
              bg: "bg-gradient-to-br from-charcoal-800 to-charcoal-900",
              accent: "text-brand-400",
              dark: true,
            },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className={`${item.bg} rounded-3xl p-10 md:p-14 relative overflow-hidden group`}
            >
              <div className="absolute -right-10 -bottom-10 w-60 h-60 rounded-full border-2 border-current opacity-5 group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute right-10 -top-10 w-40 h-40 rounded-full border border-current opacity-5" />
              <p className={`font-body text-xs tracking-widest uppercase ${item.accent} mb-3`}>Collection</p>
              <h3 className={`font-display text-4xl md:text-5xl font-light leading-tight ${item.dark ? "text-white" : "text-charcoal-900"}`}>
                {item.title}
              </h3>
              <p className={`mt-3 font-body text-sm ${item.dark ? "text-charcoal-300" : "text-charcoal-500"}`}>
                {item.subtitle}
              </p>
              <Link
                href={item.href}
                className={`mt-6 inline-flex items-center gap-2 font-body text-sm font-semibold tracking-wide group-hover:gap-4 transition-all duration-300 ${item.accent}`}
              >
                {item.cta}
                <span className="text-lg">&#8594;</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Testimonials ──────────────────────────────────────────
interface Review {
  id: string; rating: number; title?: string | null; message: string;
  user: { name?: string | null; avatar?: string | null };
  product: { name: string };
}

export function Testimonials({ reviews }: { reviews: Review[] }) {
  const fallback: Review[] = [
    { id: "1", rating: 5, title: "Best soap ever!", message: "The Ubtan Soap has transformed my skin. It gives a natural glow and smells amazing. I use it daily now!", user: { name: "Priya S." }, product: { name: "Ubtan Soap" } },
    { id: "2", rating: 5, title: "Love the fragrance", message: "Sandalwood Soap is absolutely divine. The fragrance lasts long and my skin feels so soft after every wash.", user: { name: "Ananya M." }, product: { name: "Sandalwood Soap" } },
    { id: "3", rating: 5, title: "Great sunscreen!", message: "Finally a sunscreen that doesn't leave a white cast. Lightweight, non-greasy and protects all day long.", user: { name: "Neha R." }, product: { name: "Sunscreen SPF 50" } },
  ];

  const items = reviews.length >= 3 ? reviews.slice(0, 3) : fallback;

  return (
    <section className="py-14 md:py-20 bg-cream-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <p className="font-body text-xs tracking-widest uppercase text-brand-600 mb-3">Real Stories</p>
          <h2 className="section-title">What Our Customers Say</h2>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-6">
          {items.map((review, i) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className="bg-white rounded-2xl p-6 shadow-soft hover:shadow-medium transition-shadow duration-300"
            >
              <Quote size={28} className="text-brand-200 mb-4" />
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: review.rating }).map((_, s) => (
                  <Star key={s} size={14} className="fill-brand-400 text-brand-400" />
                ))}
              </div>
              {review.title && <p className="font-body text-sm font-semibold text-charcoal-800 mb-2">{review.title}</p>}
              <p className="font-body text-sm text-charcoal-500 leading-relaxed line-clamp-4">{review.message}</p>
              <div className="flex items-center gap-3 mt-5 pt-4 border-t border-charcoal-100">
                <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center">
                  <span className="font-body text-sm font-bold text-brand-700">{review.user.name?.charAt(0) || "U"}</span>
                </div>
                <div>
                  <p className="font-body text-sm font-medium text-charcoal-800">{review.user.name || "Customer"}</p>
                  <p className="font-body text-xs text-charcoal-400">on {review.product.name}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── InstagramGrid ──────────────────────────────────────────
interface SocialPost {
  id: string; type: string; url: string;
  link?: string | null; caption?: string | null;
}

export function InstagramGrid({ posts }: { posts: SocialPost[] }) {
  const getVideoEmbed = (url: string) => {
    const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    if (yt) return { type: "iframe", src: `https://www.youtube.com/embed/${yt[1]}?autoplay=0&mute=1` };
    // Pexels or any direct mp4 URL
    return { type: "video", src: url };
  };

  if (!posts.length) return null;

  return (
    <section className="py-14 md:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
          <p className="font-body text-xs tracking-widest uppercase text-brand-600 mb-2">Follow Us</p>
          <h2 className="section-title">@DiaasaStore</h2>
        </motion.div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {posts.map((post, i) => {
            const video = post.type === "VIDEO" ? getVideoEmbed(post.url) : null;
            return (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                className="aspect-square bg-cream-100 rounded-xl overflow-hidden group cursor-pointer relative"
              >
                {video ? (
                  video.type === "iframe" ? (
                    <iframe
                      src={video.src}
                      className="w-full h-full pointer-events-none"
                      allow="autoplay; encrypted-media"
                    />
                  ) : (
                    <video
                      src={video.src}
                      className="w-full h-full object-cover"
                      autoPlay
                      muted
                      loop
                      playsInline
                    />
                  )
                ) : (
                  <img
                    src={post.url}
                    alt={post.caption || ""}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                )}
                {post.link && (
                  <a
                    href={post.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300"
                  />
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
