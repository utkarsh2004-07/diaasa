"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import toast from "react-hot-toast";
import { useWishlistStore } from "@/store/wishlistStore";
import { useCartStore } from "@/store/cartStore";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/product/ProductCard";

interface WishlistItem {
  productId: string;
  product: {
    id: string;
    name: string;
    slug: string;
    images: { url: string; isPrimary: boolean }[];
    variants: { id: string; price: number; comparePrice?: number | null; stock: number; name: string }[];
  };
}

export default function WishlistPage() {
  const { toggle } = useWishlistStore();
  const { addItem } = useCartStore();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/wishlist")
      .then((r) => r.json())
      .then((d) => { if (d.success) setItems(d.data.items); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-cream-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="font-display text-4xl font-light text-charcoal-900 mb-8 flex items-center gap-3">
            <Heart size={28} className="text-brand-500" /> My Wishlist
            <span className="font-body text-lg text-charcoal-400">({items.length})</span>
          </h1>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-3">
                  <div className="skeleton aspect-[3/4] rounded-2xl" />
                  <div className="skeleton h-4 w-3/4 rounded" />
                  <div className="skeleton h-4 w-1/2 rounded" />
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="text-center py-24">
              <Heart size={64} className="text-charcoal-200 mx-auto mb-5" />
              <h2 className="font-display text-3xl font-light text-charcoal-600 mb-3">Your wishlist is empty</h2>
              <p className="font-body text-sm text-charcoal-400 mb-8">Save your favourite products here</p>
              <Link href="/products" className="btn-primary">Explore Products</Link>
            </motion.div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {items.map((item, i) => {
                const variant = item.product.variants[0];
                const image = item.product.images.find((img) => img.isPrimary)?.url || item.product.images[0]?.url || null;
                return (
                  <ProductCard
                    key={item.productId}
                    index={i}
                    product={{
                      id: item.product.id,
                      name: item.product.name,
                      slug: item.product.slug,
                      image,
                      price: variant?.price || 0,
                      comparePrice: variant?.comparePrice || null,
                      inStock: (variant?.stock || 0) > 0,
                      variantId: variant?.id,
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
