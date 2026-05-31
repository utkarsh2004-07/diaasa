"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, ShoppingBag, Star, ChevronRight, Minus, Plus,
  Shield, Truck, RefreshCw, Tag, Copy, Check, ChevronDown, FlaskConical, ExternalLink, ChevronLeft, Share2, X,
} from "lucide-react";
import { FaWhatsapp, FaFacebook, FaInstagram, FaTelegram } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import toast from "react-hot-toast";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import ProductCard from "./ProductCard";

interface Variant { id: string; name: string; price: number; comparePrice?: number | null; stock: number; attributes?: unknown; }
interface ProductImage { id: string; url: string; altText?: string | null; }
interface Review { id: string; rating: number; title?: string | null; message: string; images?: string | null; createdAt: Date; user: { name?: string | null; avatar?: string | null; }; }
interface Coupon { code: string; type: string; value: number; minCartValue: number; description?: string | null; }
interface WhyWeLoveItem { title: string; content: string; }

interface Props {
  product: {
    id: string; name: string; slug: string; description?: string | null;
    shortDesc?: string | null; brand?: string | null; gstPercent: number;
    images: ProductImage[]; variants: Variant[]; reviews: Review[];
    avgRating: number; reviewCount: number;
    category: { name: string; slug: string };
    whyWeLoveItems?: string | null;
    howToUse?: string | null;
    benefits?: string | null;
    keyIngredients?: string | null;
    benefitsImage?: string | null;
    ingredientsImages?: string | null;
    ingredientsImage?: string | null;
  };
  coupons: Coupon[];
  related: Array<{ id: string; name: string; slug: string; image: string | null; price: number; comparePrice?: number | null; variantId?: string; inStock?: boolean; }>;
}

function parseJSON<T>(str: string | null | undefined, fallback: T): T {
  if (!str) return fallback;
  try { return JSON.parse(str) as T; } catch { return fallback; }
}

/* ─── Why You'll Love It — ➕/➖ accordion inside right column ─── */
function WhyWeLoveAccordion({ items }: { items: WhyWeLoveItem[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  if (!items.length) return null;
  return (
    <div className="mt-6 pt-6 border-t border-charcoal-100">
      <p className="font-body text-xs font-semibold uppercase tracking-widest text-charcoal-500 mb-3">
        Why You&apos;ll Love It
      </p>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="rounded-xl border border-charcoal-100 overflow-hidden">
            <button
              onClick={() => setOpenIdx(openIdx === i ? null : i)}
              className="w-full flex items-center justify-between px-4 py-3 text-left bg-cream-50 hover:bg-cream-100 transition-colors"
            >
              <span className="font-body text-sm font-medium text-charcoal-800 pr-3 leading-snug">{item.title}</span>
              <span className="shrink-0 w-6 h-6 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-base font-light leading-none">
                {openIdx === i ? "−" : "+"}
              </span>
            </button>
            <AnimatePresence initial={false}>
              {openIdx === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 py-3 font-body text-sm text-charcoal-600 leading-relaxed whitespace-pre-line bg-white border-t border-charcoal-50">
                    {item.content}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Full-width accordion ─── */
function FullAccordion({ title, children, badge }: {
  title: string; children: React.ReactNode; badge?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-charcoal-100">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between py-5 text-left group"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-body text-sm sm:text-base font-semibold text-charcoal-900 group-hover:text-brand-600 transition-colors">
            {title}
          </span>
          {badge && (
            <span className="font-body text-xs text-charcoal-400 bg-charcoal-50 px-2 py-0.5 rounded-full shrink-0">
              {badge}
            </span>
          )}
        </div>
        <ChevronDown
          size={18}
          className={`text-charcoal-400 transition-transform duration-300 shrink-0 ml-4 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="pb-8">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Coupon strip ─── */
function CouponStrip({ coupons }: { coupons: Coupon[] }) {
  const [copied, setCopied] = useState<string | null>(null);
  if (!coupons.length) return null;
  const copy = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(code);
      toast.success(`Copied ${code}!`);
      setTimeout(() => setCopied(null), 2000);
    });
  };
  return (
    <div className="mt-5 rounded-xl border border-dashed border-brand-300 bg-brand-50 p-3">
      <div className="flex items-center gap-1.5 mb-2.5">
        <Tag size={13} className="text-brand-600" />
        <span className="font-body text-xs font-semibold text-brand-700 uppercase tracking-wide">Available Offers</span>
      </div>
      <div className="space-y-2.5">
        {coupons.map((c) => (
          <div key={c.code} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs font-bold text-brand-700 bg-white border border-brand-200 px-2 py-0.5 rounded-md">
                {c.code}
              </span>
              <button
                onClick={() => copy(c.code)}
                className="shrink-0 flex items-center gap-1 font-body text-[11px] font-semibold text-brand-600 hover:text-brand-800 transition-colors"
              >
                {copied === c.code ? <Check size={12} /> : <Copy size={12} />}
                {copied === c.code ? "Copied" : "Copy"}
              </button>
            </div>
            <span className="font-body text-xs text-charcoal-600">
              {c.description || (c.type === "PERCENTAGE" ? `${c.value}% off` : `₹${c.value} off`)}
              {c.minCartValue > 0 && ` on ₹${c.minCartValue}+`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════ */
export default function ProductDetail({ product, coupons, related }: Props) {
  const [selectedImg, setSelectedImg] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<Variant>(product.variants[0]);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const { addItem } = useCartStore();
  const { toggle, isWishlisted } = useWishlistStore();
  const wishlisted = isWishlisted(product.id);

  const discount = selectedVariant.comparePrice
    ? Math.round(((selectedVariant.comparePrice - selectedVariant.price) / selectedVariant.comparePrice) * 100)
    : 0;

  const whyItems = parseJSON<WhyWeLoveItem[]>(product.whyWeLoveItems, []);

  const ingredientImgs: string[] = product.ingredientsImages
    ? parseJSON<string[]>(product.ingredientsImages, [])
    : product.ingredientsImage
    ? [product.ingredientsImage]
    : [];

  const handleAddToCart = async () => {
    if (!selectedVariant) return;
    if (selectedVariant.stock < qty) { toast.error("Not enough stock"); return; }
    setAdding(true);
    try {
      await addItem({ productId: product.id, variantId: selectedVariant.id, quantity: qty });
      toast.success("Added to cart! 🛍️");
    } catch {
      toast.error("Failed to add to cart");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-12">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs font-body text-charcoal-400 mb-6 flex-wrap">
        <Link href="/" className="hover:text-brand-600 shrink-0">Home</Link>
        <ChevronRight size={11} className="shrink-0" />
        <Link href={`/products?category=${product.category.slug}`} className="hover:text-brand-600 shrink-0">
          {product.category.name}
        </Link>
        <ChevronRight size={11} className="shrink-0" />
        <span className="text-charcoal-600 truncate">{product.name}</span>
      </nav>

      {/* ── Product section ── */}
      <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">

        {/* ── IMAGE COLUMN ── */}
        <div className="w-full">
          {/* Main image */}
          <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-cream-50 border border-charcoal-50">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedImg}
                initial={{ opacity: 0, scale: 1.03 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0"
              >
                {product.images[selectedImg] ? (
                  <Image
                    src={product.images[selectedImg].url}
                    alt={product.images[selectedImg].altText || product.name}
                    fill
                    className="object-contain"
                    priority
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 50vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="font-display text-6xl text-charcoal-200">✦</span>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
            {discount > 0 && (
              <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full z-10">
                -{discount}%
              </div>
            )}
            {/* Prev / Next arrows on main image */}
            {product.images.length > 1 && (
              <>
                <button
                  onClick={() => setSelectedImg((i) => (i - 1 + product.images.length) % product.images.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm shadow flex items-center justify-center hover:bg-white transition-colors"
                >
                  <ChevronLeft size={18} className="text-charcoal-700" />
                </button>
                <button
                  onClick={() => setSelectedImg((i) => (i + 1) % product.images.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm shadow flex items-center justify-center hover:bg-white transition-colors"
                >
                  <ChevronRight size={18} className="text-charcoal-700" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnails with prev/next arrows */}
          {product.images.length > 1 && (
            <div className="relative mt-3">
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                {product.images.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImg(i)}
                    className={`relative w-full aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                      i === selectedImg
                        ? "border-brand-500 shadow-sm"
                        : "border-transparent hover:border-charcoal-200"
                    }`}
                  >
                    <Image
                      src={img.url}
                      alt={img.altText || product.name}
                      fill
                      className="object-contain"
                      sizes="80px"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── INFO COLUMN ── */}
        <div className="flex flex-col">
          {product.brand && (
            <p className="font-body text-xs tracking-widest uppercase text-charcoal-400 mb-2">{product.brand}</p>
          )}
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-light text-charcoal-900 leading-tight">
            {product.name}
          </h1>

          {product.reviewCount > 0 && (
            <div className="flex items-center gap-2 mt-3">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={14} className={s <= Math.round(product.avgRating) ? "fill-brand-400 text-brand-400" : "text-charcoal-200"} />
                ))}
              </div>
              <span className="font-body text-sm text-charcoal-500">
                {product.avgRating.toFixed(1)} ({product.reviewCount} reviews)
              </span>
            </div>
          )}

          <div className="flex items-baseline gap-3 mt-4 flex-wrap">
            <span className="font-body text-2xl sm:text-3xl font-semibold text-charcoal-900">
              ₹{selectedVariant.price.toLocaleString("en-IN")}
            </span>
            {selectedVariant.comparePrice && (
              <span className="font-body text-lg text-charcoal-400 line-through">
                ₹{selectedVariant.comparePrice.toLocaleString("en-IN")}
              </span>
            )}
            {discount > 0 && (
              <span className="font-body text-sm font-semibold text-green-600">Save {discount}%</span>
            )}
          </div>
          {product.gstPercent > 0 && (
            <p className="font-body text-xs text-charcoal-400 mt-1">Incl. {product.gstPercent}% GST</p>
          )}

          {product.shortDesc && (
            <p className="mt-4 font-body text-sm text-charcoal-600 leading-relaxed">{product.shortDesc}</p>
          )}

          <CouponStrip coupons={coupons} />

          {/* Variants */}
          {product.variants.length > 1 && (
            <div className="mt-5">
              <p className="font-body text-xs font-semibold uppercase tracking-wider text-charcoal-500 mb-3">Select Option</p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v)}
                    disabled={v.stock === 0}
                    className={`px-4 py-2 rounded-full font-body text-sm border transition-all duration-200 ${
                      selectedVariant.id === v.id
                        ? "border-brand-500 bg-brand-50 text-brand-700 font-medium"
                        : "border-charcoal-200 text-charcoal-700 hover:border-charcoal-400"
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    {v.name}{v.stock === 0 && " (OOS)"}
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedVariant.stock > 0 && selectedVariant.stock <= 10 && (
            <p className="mt-3 font-body text-xs text-amber-600 font-medium">
              Only {selectedVariant.stock} left in stock!
            </p>
          )}

          {/* Qty + CTA */}
          <div className="mt-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-charcoal-200 rounded-full overflow-hidden shrink-0">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="qty-btn border-0 rounded-none">
                  <Minus size={14} />
                </button>
                <span className="w-10 text-center font-body text-sm font-medium text-charcoal-900">{qty}</span>
                <button onClick={() => setQty(Math.min(selectedVariant.stock, qty + 1))} className="qty-btn border-0 rounded-none">
                  <Plus size={14} />
                </button>
              </div>
              <button
                onClick={() => toggle(product.id)}
                className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all duration-200 shrink-0 ${
                  wishlisted ? "border-red-300 bg-red-50 text-red-500" : "border-charcoal-200 hover:border-red-300 hover:text-red-400"
                }`}
              >
                <Heart size={18} className={wishlisted ? "fill-current" : ""} />
              </button>
              <button
                onClick={() => setShareOpen(true)}
                className="w-12 h-12 rounded-full border border-charcoal-200 flex items-center justify-center hover:border-brand-400 hover:text-brand-500 transition-all duration-200 shrink-0"
                title="Share"
              >
                <Share2 size={18} />
              </button>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={adding || selectedVariant.stock === 0}
              className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-base"
            >
              <ShoppingBag size={18} />
              {adding ? "Adding…" : selectedVariant.stock === 0 ? "Out of Stock" : "Add to Bag"}
            </button>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-2 mt-6 pt-6 border-t border-charcoal-100">
            {[
              { icon: Truck, text: "Free Delivery above ₹500" },
              { icon: Shield, text: "100% Genuine" },
              { icon: RefreshCw, text: "7-day Returns" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex flex-col items-center gap-1.5 text-center">
                <div className="w-9 h-9 rounded-full bg-brand-50 flex items-center justify-center">
                  <Icon size={16} className="text-brand-500" />
                </div>
                <span className="font-body text-[10px] sm:text-xs text-charcoal-500 leading-tight">{text}</span>
              </div>
            ))}
          </div>

          {/* Lab Tested Certificate badge */}
          <a
            href="/images/Diaasa enterprises.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 flex items-center gap-3 p-3 rounded-xl border border-green-200 bg-green-50 hover:bg-green-100 transition-colors group"
          >
            <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center shrink-0">
              <FlaskConical size={18} className="text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-body text-sm font-semibold text-green-800 leading-tight">Lab Tested &amp; Certified</p>
              <p className="font-body text-xs text-green-600 mt-0.5">View official lab test certificate</p>
            </div>
            <ExternalLink size={14} className="text-green-500 shrink-0 group-hover:text-green-700 transition-colors" />
          </a>

          {/* Why You'll Love It — right after trust badges */}
          <WhyWeLoveAccordion items={whyItems} />
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          Full-width accordions — How To Use, Description,
          Benefits, Key Ingredients, Customer Reviews
      ══════════════════════════════════════════════════════════ */}
      <div className="mt-12 sm:mt-16 border-t border-charcoal-100 pt-2">

        {product.howToUse && (
          <FullAccordion title="How To Use">
            <p className="font-body text-sm text-charcoal-600 leading-relaxed whitespace-pre-line max-w-2xl">
              {product.howToUse}
            </p>
          </FullAccordion>
        )}

        {product.description && (
          <FullAccordion title="Description">
            <div
              className="prose prose-sm max-w-none font-body text-charcoal-600"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          </FullAccordion>
        )}

        {(product.benefits || product.benefitsImage) && (
          <FullAccordion title="Benefits">
            {/* image on top, text below on mobile; side-by-side on md+ */}
            <div className={`flex flex-col gap-5 ${product.benefitsImage && product.benefits ? "md:flex-row md:items-start" : ""}`}>
              {product.benefitsImage && (
                <div className="w-full md:w-1/2 shrink-0">
                  {/* fixed height container — no stretching */}
                  <div className="relative w-full h-56 sm:h-72 md:h-80 rounded-2xl overflow-hidden bg-cream-100">
                    <Image
                      src={product.benefitsImage}
                      alt="Benefits"
                      fill
                      className="object-cover object-center"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                </div>
              )}
              {product.benefits && (
                <div className="font-body text-sm text-charcoal-600 leading-relaxed whitespace-pre-line">
                  {product.benefits}
                </div>
              )}
            </div>
          </FullAccordion>
        )}

        {(product.keyIngredients || ingredientImgs.length > 0) && (
          <FullAccordion title="Key Ingredients">
            <div className="space-y-5">
              {ingredientImgs.length > 0 && (
                <div className={`grid gap-3 ${
                  ingredientImgs.length === 1
                    ? "grid-cols-1 max-w-lg"
                    : ingredientImgs.length === 2
                    ? "grid-cols-2"
                    : "grid-cols-2 sm:grid-cols-3"
                }`}>
                  {ingredientImgs.map((url, i) => (
                    /* fixed height — no aspect-ratio stretching */
                    <div key={i} className="relative w-full h-44 sm:h-56 rounded-2xl overflow-hidden bg-cream-100">
                      <Image
                        src={url}
                        alt={`Key Ingredient ${i + 1}`}
                        fill
                        className="object-cover object-center"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      />
                    </div>
                  ))}
                </div>
              )}
              {product.keyIngredients && (
                <p className="font-body text-sm text-charcoal-600 leading-relaxed whitespace-pre-line">
                  {product.keyIngredients}
                </p>
              )}
            </div>
          </FullAccordion>
        )}

        {/* Lab Certificate */}
        <FullAccordion title="Lab Tested Certificate">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <FlaskConical size={20} className="text-green-600 shrink-0" />
                <p className="font-body text-sm font-semibold text-charcoal-800">Certified by Accredited Laboratory</p>
              </div>
              <p className="font-body text-sm text-charcoal-600 leading-relaxed">
                All our products are independently tested by certified laboratories to ensure purity, safety, and quality. Our lab reports confirm that every product meets the highest standards before reaching you.
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {["Dermatologically Tested", "No Harmful Chemicals", "Quality Assured", "Safe Ingredients"].map((tag) => (
                  <span key={tag} className="font-body text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-1 rounded-full">
                    ✓ {tag}
                  </span>
                ))}
              </div>
              <a
                href="/images/Diaasa enterprises.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-3 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-body text-sm font-medium rounded-full transition-colors"
              >
                <FlaskConical size={15} />
                View Lab Certificate (PDF)
                <ExternalLink size={13} />
              </a>
            </div>
            {/* PDF preview box */}
            <div className="w-full sm:w-48 shrink-0">
              <a
                href="/images/Diaasa enterprises.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="block relative w-full h-60 rounded-2xl overflow-hidden border-2 border-green-200 bg-green-50 hover:border-green-400 transition-colors group"
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                  <FlaskConical size={36} className="text-green-400 group-hover:text-green-600 transition-colors" />
                  <p className="font-body text-xs font-semibold text-green-700 text-center px-3">Lab Test Report</p>
                  <p className="font-body text-[10px] text-green-500 text-center px-3">Diaasa Enterprises</p>
                  <span className="mt-2 font-body text-[10px] text-white bg-green-500 px-3 py-1 rounded-full">Click to View PDF</span>
                </div>
              </a>
            </div>
          </div>
        </FullAccordion>

        {/* Customer Reviews */}
        <FullAccordion
          title="Customer Reviews"
          badge={product.reviewCount > 0 ? `${product.reviewCount}` : undefined}
        >
          {product.reviewCount > 0 && (
            <div className="flex items-center gap-4 mb-6 p-4 bg-cream-50 rounded-2xl">
              <span className="font-display text-4xl sm:text-5xl font-light text-charcoal-900 shrink-0">
                {product.avgRating.toFixed(1)}
              </span>
              <div>
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={16} className={s <= Math.round(product.avgRating) ? "fill-brand-400 text-brand-400" : "text-charcoal-200"} />
                  ))}
                </div>
                <p className="font-body text-xs text-charcoal-500">Based on {product.reviewCount} reviews</p>
              </div>
            </div>
          )}
          {product.reviews.length === 0 ? (
            <p className="font-body text-sm text-charcoal-400 py-4">No reviews yet. Be the first to review!</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {product.reviews.map((r) => (
                <div key={r.id} className="bg-white rounded-2xl p-4 sm:p-5 border border-charcoal-100 flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
                        <span className="font-body text-sm font-bold text-brand-700">
                          {r.user.name?.charAt(0) || "U"}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-body text-sm font-medium text-charcoal-800 leading-tight truncate">
                          {r.user.name || "Customer"}
                        </p>
                        <div className="flex gap-0.5 mt-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} size={11} className={s <= r.rating ? "fill-brand-400 text-brand-400" : "text-charcoal-200"} />
                          ))}
                        </div>
                      </div>
                    </div>
                    <span className="font-body text-[11px] text-charcoal-400 shrink-0">
                      {new Date(r.createdAt).toLocaleDateString("en-IN")}
                    </span>
                  </div>
                  {r.title && (
                    <p className="font-body text-sm font-semibold text-charcoal-800">{r.title}</p>
                  )}
                  <p className="font-body text-sm text-charcoal-600 leading-relaxed">{r.message}</p>
                  {r.images && (() => {
                    try {
                      const imgs: string[] = JSON.parse(r.images as unknown as string);
                      if (imgs.length > 0) return (
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {imgs.map((url, i) => (
                            <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                              <img src={url} alt={`img-${i}`} className="w-16 h-16 object-cover rounded-lg border border-charcoal-100 hover:opacity-90 transition-opacity" />
                            </a>
                          ))}
                        </div>
                      );
                    } catch { return null; }
                  })()}
                </div>
              ))}
            </div>
          )}
        </FullAccordion>
      </div>

      {/* Related products */}
      {related.length > 0 && (
        <div className="mt-12 sm:mt-16">
          <h2 className="section-title mb-6 sm:mb-8">You May Also Like</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {related.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* Share Sheet */}
      <AnimatePresence>
        {shareOpen && (() => {
          const url = `https://www.diaasa.com/product/${product.slug}`;
          const text = `Check out ${product.name} on Diaasa Store! ${url}`;
          const shares = [
            { label: "WhatsApp", bg: "bg-[#25D366]", href: `https://wa.me/?text=${encodeURIComponent(text)}` },
            { label: "Facebook", bg: "bg-[#1877F2]", href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
            { label: "Twitter/X", bg: "bg-black", href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}` },
            { label: "Telegram", bg: "bg-[#229ED9]", href: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(product.name)}` },
            { label: "Instagram", bg: "bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#FCAF45]", href: `https://www.instagram.com/` },
          ];
          const icons: Record<string, React.ReactNode> = {
            WhatsApp: <FaWhatsapp size={24} />,
            Facebook: <FaFacebook size={24} />,
            "Twitter/X": <FaXTwitter size={24} />,
            Telegram: <FaTelegram size={24} />,
            Instagram: <FaInstagram size={24} />,
          };
          return (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center"
              onClick={() => setShareOpen(false)}
            >
              <motion.div
                initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="bg-white w-full sm:w-96 rounded-t-3xl sm:rounded-2xl p-6 shadow-strong"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-display text-xl font-light text-charcoal-900">Share Product</h3>
                  <button onClick={() => setShareOpen(false)} className="w-8 h-8 rounded-full bg-charcoal-100 flex items-center justify-center hover:bg-charcoal-200 transition-colors">
                    <X size={16} />
                  </button>
                </div>
                <div className="flex items-center gap-3 p-3 bg-cream-50 rounded-xl mb-5">
                  {product.images[0] && <img src={product.images[0].url} alt={product.name} className="w-12 h-12 rounded-lg object-cover" />}
                  <div className="min-w-0">
                    <p className="font-body text-sm font-medium text-charcoal-800 truncate">{product.name}</p>
                    <p className="font-body text-xs text-brand-600">₹{selectedVariant.price.toLocaleString("en-IN")}</p>
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-2 mb-5">
                  {shares.map((s) => (
                    <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                      onClick={() => setShareOpen(false)}
                      className={`${s.bg} text-white rounded-2xl p-3 flex flex-col items-center gap-1.5 transition-all hover:opacity-90`}
                    >
                      {icons[s.label]}
                      <span className="font-body text-[10px] font-medium text-center leading-tight">{s.label}</span>
                    </a>
                  ))}
                </div>
                <button
                  onClick={() => { navigator.clipboard.writeText(url); setLinkCopied(true); toast.success("Link copied!"); setTimeout(() => setLinkCopied(false), 2000); }}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 border border-charcoal-200 rounded-xl hover:border-brand-400 transition-colors"
                >
                  <span className="font-body text-xs text-charcoal-500 truncate">{url}</span>
                  <span className="shrink-0 flex items-center gap-1 font-body text-xs font-semibold text-brand-600">
                    {linkCopied ? <Check size={14} /> : <Copy size={14} />}
                    {linkCopied ? "Copied!" : "Copy Link"}
                  </span>
                </button>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
