"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Tag } from "lucide-react";
import toast from "react-hot-toast";
import { useCartStore } from "@/store/cartStore";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function CartPage() {
  const { items, count, subtotal, totalGST, total, isLoading, fetchCart, updateQuantity, removeItem } = useCartStore();

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const handleRemove = async (id: string) => {
    try { await removeItem(id); toast.success("Removed from cart"); }
    catch { toast.error("Failed to remove"); }
  };

  const handleQtyChange = async (id: string, qty: number) => {
    if (qty < 1) return handleRemove(id);
    try { await updateQuantity(id, qty); }
    catch { toast.error("Failed to update"); }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-cream-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-4xl md:text-5xl font-light text-charcoal-900 mb-8"
          >
            Shopping Bag
          </motion.h1>

          {isLoading ? (
            <div className="grid lg:grid-cols-[1fr_380px] gap-8">
              <div className="space-y-4">
                {[1,2,3].map((i) => (
                  <div key={i} className="bg-white rounded-2xl p-5 flex gap-4">
                    <div className="skeleton w-24 h-32 rounded-xl" />
                    <div className="flex-1 space-y-3">
                      <div className="skeleton h-4 w-48 rounded" />
                      <div className="skeleton h-3 w-32 rounded" />
                      <div className="skeleton h-4 w-24 rounded" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="skeleton h-64 rounded-2xl" />
            </div>
          ) : count === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-24"
            >
              <ShoppingBag size={64} className="text-charcoal-200 mx-auto mb-6" />
              <h2 className="font-display text-3xl font-light text-charcoal-700 mb-3">Your bag is empty</h2>
              <p className="font-body text-sm text-charcoal-400 mb-8">Add some products to get started</p>
              <Link href="/products" className="btn-primary inline-flex">Continue Shopping</Link>
            </motion.div>
          ) : (
            <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-start">
              {/* Items */}
              <div className="space-y-3">
                <AnimatePresence>
                  {items.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -50, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="bg-white rounded-2xl p-4 md:p-5 flex gap-4 shadow-soft"
                    >
                      <Link href={`/product/${item.product.slug}`} className="shrink-0">
                        <div className="relative w-24 h-32 rounded-xl overflow-hidden bg-cream-100">
                          {item.product.image ? (
                            <Image src={item.product.image} alt={item.product.name} fill className="object-cover" sizes="96px" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-charcoal-300 text-2xl">✦</span>
                            </div>
                          )}
                        </div>
                      </Link>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between gap-2">
                          <div>
                            <Link href={`/product/${item.product.slug}`} className="font-body text-sm font-medium text-charcoal-800 hover:text-brand-600 transition-colors line-clamp-2">
                              {item.product.name}
                            </Link>
                            <p className="font-body text-xs text-charcoal-400 mt-0.5">{item.variant.name}</p>
                          </div>
                          <button
                            onClick={() => handleRemove(item.id)}
                            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 text-charcoal-300 hover:text-red-400 transition-all"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>

                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center border border-charcoal-200 rounded-full">
                            <button onClick={() => handleQtyChange(item.id, item.quantity - 1)} className="qty-btn border-0">
                              <Minus size={13} />
                            </button>
                            <span className="w-8 text-center font-body text-sm">{item.quantity}</span>
                            <button onClick={() => handleQtyChange(item.id, item.quantity + 1)} className="qty-btn border-0">
                              <Plus size={13} />
                            </button>
                          </div>
                          <div className="text-right">
                            <p className="font-body text-base font-semibold text-charcoal-900">
                              ₹{item.lineTotal.toLocaleString("en-IN")}
                            </p>
                            {item.variant.comparePrice && (
                              <p className="font-body text-xs text-charcoal-400 line-through">
                                ₹{(item.variant.comparePrice * item.quantity).toLocaleString("en-IN")}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                <Link href="/products" className="inline-flex items-center gap-2 font-body text-sm text-charcoal-500 hover:text-brand-600 transition-colors mt-2">
                  ← Continue Shopping
                </Link>
              </div>

              {/* Summary */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl p-6 shadow-soft sticky top-24"
              >
                <h2 className="font-display text-2xl font-light text-charcoal-900 mb-5">Order Summary</h2>

                <div className="space-y-3 text-sm font-body">
                  <div className="flex justify-between text-charcoal-600">
                    <span>Subtotal ({count} items)</span>
                    <span>₹{subtotal.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-charcoal-600">
                    <span>GST</span>
                    <span>₹{totalGST.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-charcoal-600">
                    <span>Shipping</span>
                    <span className={subtotal >= 500 ? "text-green-600 font-medium" : ""}>
                      {subtotal >= 500 ? "FREE" : "₹49"}
                    </span>
                  </div>
                  {subtotal < 500 && (
                    <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                      Add ₹{(500 - subtotal).toFixed(0)} more for free shipping
                    </p>
                  )}
                </div>

                <div className="border-t border-charcoal-100 mt-4 pt-4 flex justify-between">
                  <span className="font-body text-base font-semibold text-charcoal-900">Total</span>
                  <span className="font-body text-xl font-semibold text-charcoal-900">
                    ₹{(total + (subtotal < 500 ? 49 : 0)).toLocaleString("en-IN")}
                  </span>
                </div>

                {/* Coupon hint */}
                <div className="mt-4 flex items-center gap-2 text-xs text-charcoal-400 bg-cream-50 rounded-xl px-3 py-2.5">
                  <Tag size={14} className="text-brand-500" />
                  Apply coupon at checkout
                </div>

                <Link href="/checkout" className="btn-primary w-full text-center flex items-center justify-center gap-2 mt-5 py-4 text-base">
                  Proceed to Checkout
                  <ArrowRight size={18} />
                </Link>

                <p className="mt-3 text-center font-body text-xs text-charcoal-400">
                  🔒 Secure checkout powered by Razorpay
                </p>
              </motion.div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
