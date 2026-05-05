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
  { icon: Headphones, title: "24/7 Support", desc: "We're here to help" },
];

export function BenefitsBar() {
  return (
    <section className="bg-white border-y border-charcoal-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-charcoal-100">
          {BENEFITS.map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-3 px-6 py-5"
            >
              <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center shrink-0">
                <Icon size={18} className="text-brand-600" />
              </div>
              <div>
                <p className="font-body text-sm font-semibold text-charcoal-800">{title}</p>
                <p className="font-body text-xs text-charcoal-400">{desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CategoryStrip ────────────────────────────────────────
interface Category { id: string; name: string; slug: string; image?: string | null; }

export function CategoryStrip({ categories }: { categories: Category[] }) {
  const fallback = [
    { id: "1", name: "Skincare", slug: "skincare", color: "bg-rose-50" },
    { id: "2", name: "Haircare", slug: "haircare", color: "bg-amber-50" },
    { id: "3", name: "Body Care", slug: "body-care", color: "bg-green-50" },
    { id: "4", name: "Wellness", slug: "wellness", color: "bg-blue-50" },
    { id: "5", name: "Fragrance", slug: "fragrance", color: "bg-purple-50" },
    { id: "6", name: "Tools", slug: "tools", color: "bg-charcoal-50" },
  ];

  const items = categories.length > 0 ? categories : fallback;

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
          {items.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="w-[calc(50%-8px)] sm:w-44"
            >
              <Link
                href={`/products?category=${cat.slug}`}
                className="group flex flex-col items-center gap-4 p-6 rounded-2xl bg-cream-100 hover:bg-cream-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-soft"
              >
                <div className="w-28 h-28 md:w-36 md:h-36 rounded-full bg-white shadow-soft flex items-center justify-center overflow-hidden">
                  {(cat as { image?: string | null }).image ? (
                    <Image src={(cat as { image: string }).image} alt={cat.name} width={144} height={144} className="object-cover w-full h-full rounded-full" />
                  ) : (
                    <span className="font-display text-4xl text-charcoal-400">
                      {cat.name.charAt(0)}
                    </span>
                  )}
                </div>
                <span className="font-body text-base font-semibold text-charcoal-700 text-center group-hover:text-brand-600 transition-colors">
                  {cat.name}
                </span>
              </Link>
            </motion.div>
          ))}
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
