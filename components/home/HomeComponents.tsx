"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Truck, ShieldCheck, RefreshCw, Headphones } from "lucide-react";
import ProductCard from "@/components/product/ProductCard";

// ─── BenefitsBar ────────────────────────────────────────
const BENEFITS = [
  { icon: Truck, title: "Free Shipping", desc: "On orders above ₹500" },
  { icon: ShieldCheck, title: "100% Authentic", desc: "Genuine products always" },
  { icon: RefreshCw, title: "Easy Returns", desc: "7-day hassle free returns" },
  { icon: Headphones, title: "10 AM – 6 PM Support", desc: "Mon–Sat, we're here to help" },
];

export function BenefitsBar() {
  return (
    <section className="bg-white border-y border-charcoal-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4">
          {BENEFITS.map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`flex items-center gap-3 px-4 py-5 sm:px-6 ${
                i % 2 === 0 ? "border-r border-charcoal-100" : ""
              } ${
                i < 2 ? "border-b border-charcoal-100 md:border-b-0" : ""
              } ${
                i < 3 ? "md:border-r md:border-charcoal-100" : ""
              }`}
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-brand-50 flex items-center justify-center shrink-0">
                <Icon size={16} className="text-brand-600 sm:w-[18px] sm:h-[18px]" />
              </div>
              <div className="min-w-0">
                <p className="font-body text-xs sm:text-sm font-semibold text-charcoal-800 leading-tight">{title}</p>
                <p className="font-body text-[11px] sm:text-xs text-charcoal-400 mt-0.5 leading-tight">{desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CategoryStrip ────────────────────────────────────────
interface Category { id: string; name: string; slug: string; image?: string | null; productCount?: number; }

export function CategoryStrip({ categories }: { categories: Category[] }) {
  if (!categories.length) return null;

  return (
    <section className="py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="section-title text-center mb-10"
        >
          Shop by Category
        </motion.h2>
        <div className="flex flex-wrap justify-center gap-3 md:gap-4">
          {categories.map((cat, i) => {
            const hasProducts = (cat.productCount ?? 0) > 0;
            const inner = (
              <div className={`group flex flex-col items-center gap-4 p-6 rounded-2xl transition-all duration-300 ${
                hasProducts
                  ? "bg-cream-100 hover:bg-cream-200 hover:-translate-y-1 hover:shadow-soft cursor-pointer"
                  : "bg-charcoal-50 opacity-50 cursor-not-allowed"
              }`}>
                <div className="w-28 h-28 md:w-36 md:h-36 rounded-full bg-white shadow-soft flex items-center justify-center overflow-hidden">
                  {cat.image ? (
                    <Image src={cat.image} alt={cat.name} width={144} height={144} className="object-cover w-full h-full rounded-full" />
                  ) : (
                    <span className="font-display text-4xl text-charcoal-400">{cat.name.charAt(0)}</span>
                  )}
                </div>
                <div className="text-center">
                  <span className={`font-body text-base font-semibold text-center transition-colors ${
                    hasProducts ? "text-charcoal-700 group-hover:text-brand-600" : "text-charcoal-400"
                  }`}>
                    {cat.name}
                  </span>
                  {!hasProducts && (
                    <p className="font-body text-[12px] font-black text-black">Coming Soon</p>
                  )}
                </div>
              </div>
            );

            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="w-[calc(50%-8px)] sm:w-44"
              >
                {hasProducts ? (
                  <Link href={`/products?category=${cat.slug}`}>{inner}</Link>
                ) : (
                  <div>{inner}</div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── FeaturedProducts ────────────────────────────────────────
interface ProductProps {
  id: string; name: string; slug: string;
  image: string | null; hoverImage?: string | null;
  price: number; comparePrice?: number | null;
  reviewCount?: number; inStock?: boolean;
  isNew?: boolean; isBestSeller?: boolean;
  brand?: string | null; variantId?: string;
}

export function FeaturedProducts({ products }: { products: ProductProps[] }) {
  return (
    <section className="py-14 md:py-20 bg-cream-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <p className="font-body text-xs tracking-widest uppercase text-brand-600 mb-2">Handpicked for you</p>
            <h2 className="section-title">Featured Products</h2>
          </motion.div>
          <Link href="/products?featured=true" className="btn-outline text-sm hidden sm:inline-flex">
            View All
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
        <div className="mt-8 flex justify-center sm:hidden">
          <Link href="/products?featured=true" className="btn-outline">View All Products</Link>
        </div>
      </div>
    </section>
  );
}
