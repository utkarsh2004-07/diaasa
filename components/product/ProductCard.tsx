"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Heart, ShoppingBag, Star, Eye } from "lucide-react";
import toast from "react-hot-toast";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";

interface Props {
  product: {
    id: string;
    name: string;
    slug: string;
    shortDesc?: string | null;
    image: string | null;
    hoverImage?: string | null;
    price: number;
    comparePrice?: number | null;
    reviewCount?: number;
    inStock?: boolean;
    isNew?: boolean;
    isBestSeller?: boolean;
    brand?: string | null;
    variantId?: string;
  };
  index?: number;
  dark?: boolean;
}

export default function ProductCard({ product, index = 0, dark = false }: Props) {
  const [hovered, setHovered] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { addItem } = useCartStore();
  const { toggle, isWishlisted } = useWishlistStore();
  const router = useRouter();
  const wishlisted = mounted && isWishlisted(product.id);

  useEffect(() => { setMounted(true); }, []);

  const discount = product.comparePrice
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!product.variantId) {
      window.location.href = `/product/${product.slug}`;
      return;
    }
    setAddingToCart(true);
    try {
      await addItem({ productId: product.id, variantId: product.variantId, quantity: 1 });
      toast.success("Added to cart!");
    } catch {
      toast.error("Failed to add to cart");
    } finally {
      setAddingToCart(false);
    }
  };

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    await toggle(product.id);
    toast.success(wishlisted ? "Removed from wishlist" : "Added to wishlist!");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: "easeOut" }}
      className="group"
    >
      <Link href={`/product/${product.slug}`} className="block">
        {/* Image Container */}
        <div
          className="relative overflow-hidden rounded-2xl bg-cream-100 aspect-[3/4]"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {/* Primary image */}
          <Image
            src={product.image && product.image.trim() !== "" ? product.image : "/images/placeholder-product.jpg"}
            alt={product.name}
            fill
            className={`object-contain transition-all duration-700 ease-out ${
              hovered && product.hoverImage ? "opacity-0 scale-105" : "opacity-100 scale-100 group-hover:scale-105"
            }`}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />

          {/* Hover image */}
          {product.hoverImage && (
            <Image
              src={product.hoverImage}
              alt={product.name}
              fill
              className={`object-cover transition-all duration-700 ease-out ${
                hovered ? "opacity-100 scale-105" : "opacity-0 scale-100"
              }`}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {product.isNew && (
              <span className="badge-brand text-[10px] font-semibold uppercase tracking-wider">New</span>
            )}
            {product.isBestSeller && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-charcoal-900 text-cream-200 uppercase tracking-wider">
                Bestseller
              </span>
            )}
            {discount > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500 text-white">
                -{discount}%
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className={`absolute top-3 right-3 flex flex-col gap-2 transition-all duration-300 ${hovered ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"}`}>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleWishlist}
              className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-soft hover:bg-white transition-colors"
            >
              <Heart
                size={16}
                className={wishlisted ? "fill-red-500 text-red-500" : "text-charcoal-600"}
              />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={(e) => { e.preventDefault(); router.push(`/product/${product.slug}`); }}
              className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-soft hover:bg-white transition-colors"
            >
              <Eye size={16} className="text-charcoal-600" />
            </motion.button>
          </div>

          {/* Add to cart bar */}
          <div className={`absolute bottom-0 left-0 right-0 transition-all duration-300 ${hovered ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"}`}>
            <button
              onClick={handleAddToCart}
              disabled={addingToCart || !product.inStock}
              className="w-full py-3 bg-charcoal-900/90 backdrop-blur-sm text-cream-100 font-body text-xs font-semibold tracking-wider uppercase hover:bg-charcoal-900 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <ShoppingBag size={14} />
              {addingToCart ? "Adding…" : !product.inStock ? "Out of Stock" : "Add to Bag"}
            </button>
          </div>

          {!product.inStock && (
            <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
              <span className="font-body text-xs font-semibold text-charcoal-500 tracking-wider uppercase">Out of Stock</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="mt-3 px-1">
          {product.brand && (
            <p className={`font-body text-[11px] uppercase tracking-wider mb-0.5 ${dark ? "text-cream-300" : "text-charcoal-400"}`}>
              {product.brand}
            </p>
          )}
          <h3 className={`font-body text-sm font-medium leading-snug group-hover:text-brand-400 transition-colors line-clamp-2 ${dark ? "text-white" : "text-charcoal-800 group-hover:text-brand-600"}`}>
            {product.name}
          </h3>
          {product.reviewCount !== undefined && product.reviewCount > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={11} className="star-filled fill-current" />
                ))}
              </div>
              <span className={`font-body text-[11px] ${dark ? "text-cream-400" : "text-charcoal-400"}`}>({product.reviewCount})</span>
            </div>
          )}
          <div className="flex items-center gap-2 mt-1.5">
            <span className={`font-body text-base font-semibold ${dark ? "text-white" : "text-charcoal-900"}`}>
              ₹{product.price.toLocaleString("en-IN")}
            </span>
            {product.comparePrice && (
              <span className={`font-body text-sm line-through ${dark ? "text-cream-400" : "text-charcoal-400"}`}>
                ₹{product.comparePrice.toLocaleString("en-IN")}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
