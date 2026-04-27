"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { useWishlistStore } from "@/store/wishlistStore";
import { useCartStore } from "@/store/cartStore";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

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

  const handleRemove = async (productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
    await toggle(productId);
    toast.success("Removed from wishlist");
  };

  const handleAddToCart = async (item: WishlistItem) => {
    const variant = item.product.variants[0];
    if (!variant || variant.stock === 0) { toast.error("Out of stock"); return; }
    try {
      await addItem({ productId: item.product.id, variantId: variant.id, quantity: 1 });
      toast.success("Added to cart!");
    } catch {
      toast.error("Failed to add to cart");
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-cream-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
            <AnimatePresence>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {items.map((item) => {
                  const variant = item.product.variants[0];
                  const image = item.product.images.find((i) => i.isPrimary)?.url || item.product.images[0]?.url;
                  const inStock = (variant?.stock || 0) > 0;
                  return (
                    <motion.div
                      key={item.productId}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="bg-white rounded-2xl shadow-soft overflow-hidden group"
                    >
                      <Link href={`/product/${item.product.slug}`} className="block relative aspect-[3/4] bg-cream-100 overflow-hidden">
                        {image ? (
                          <img src={image} alt={item.product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-charcoal-300 text-4xl">✦</div>
                        )}
                        {!inStock && (
                          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                            <span className="font-body text-xs font-semibold text-charcoal-500 bg-white px-3 py-1 rounded-full">Out of Stock</span>
                          </div>
                        )}
                      </Link>
                      <div className="p-3 space-y-2">
                        <Link href={`/product/${item.product.slug}`}>
                          <p className="font-body text-sm font-medium text-charcoal-800 line-clamp-2 hover:text-brand-600 transition-colors">{item.product.name}</p>
                        </Link>
                        <div className="flex items-baseline gap-2">
                          <p className="font-body text-sm font-semibold text-charcoal-900">₹{variant?.price.toLocaleString("en-IN")}</p>
                          {variant?.comparePrice && variant.comparePrice > variant.price && (
                            <p className="font-body text-xs text-charcoal-400 line-through">₹{variant.comparePrice.toLocaleString("en-IN")}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAddToCart(item)}
                            disabled={!inStock}
                            className="flex-1 btn-primary text-xs py-2 flex items-center justify-center gap-1.5 disabled:opacity-50"
                          >
                            <ShoppingBag size={13} />
                            {inStock ? "Add to Cart" : "Out of Stock"}
                          </button>
                          <button
                            onClick={() => handleRemove(item.productId)}
                            className="p-2 rounded-xl border border-charcoal-200 text-charcoal-400 hover:border-red-300 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </AnimatePresence>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
