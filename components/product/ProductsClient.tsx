"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { SlidersHorizontal, X, ChevronDown } from "lucide-react";
import ProductCard from "./ProductCard";

interface Product {
  id: string; name: string; slug: string; shortDesc?: string | null;
  image: string | null; hoverImage?: string | null;
  price: number; comparePrice?: number | null;
  reviewCount?: number; inStock?: boolean;
  isNew?: boolean; isBestSeller?: boolean;
  brand?: string | null; variantId?: string;
  category?: { name: string; slug: string };
}

const SORT_OPTIONS = [
  { label: "Newest First", value: "createdAt_desc" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
  { label: "Best Sellers", value: "isBestSeller_desc" },
];

const PRICE_RANGES = [
  { label: "Under ₹500", min: 0, max: 500 },
  { label: "₹500 – ₹1000", min: 500, max: 1000 },
  { label: "₹1000 – ₹2000", min: 1000, max: 2000 },
  { label: "Above ₹2000", min: 2000, max: 99999 },
];

export default function ProductsClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  const currentPage = Number(searchParams.get("page") || 1);
  const currentSort = searchParams.get("sort") || "createdAt_desc";
  const currentCategory = searchParams.get("category") || "";
  const currentQ = searchParams.get("q") || "";
  const currentMin = searchParams.get("minPrice") || "";
  const currentMax = searchParams.get("maxPrice") || "";

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(searchParams.toString());
      params.set("limit", "16");
      const res = await fetch(`/api/products?${params}`);
      const data = await res.json();
      if (data.success) {
        setProducts(data.data.products);
        setTotal(data.data.pagination.total);
        setPages(data.data.pagination.pages);
      }
    } catch {}
    finally { setLoading(false); }
  }, [searchParams]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const updateParam = (key: string, value: string) => {
    const p = new URLSearchParams(searchParams.toString());
    if (value) p.set(key, value); else p.delete(key);
    p.delete("page");
    router.push(`?${p.toString()}`);
  };

  const clearFilters = () => {
    const p = new URLSearchParams();
    if (currentQ) p.set("q", currentQ);
    router.push(`?${p.toString()}`);
  };

  const hasFilters = currentCategory || currentMin || currentMax;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          {currentQ && (
            <p className="font-body text-xs text-charcoal-400 mb-1">Search results for</p>
          )}
          <h1 className="font-display text-3xl md:text-4xl font-light text-charcoal-900">
            {currentQ ? `"${currentQ}"` : currentCategory ? currentCategory.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()) : "All Products"}
          </h1>
          <p className="font-body text-sm text-charcoal-400 mt-1">{total} products</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Sort */}
          <div className="relative hidden sm:block">
            <select
              value={currentSort}
              onChange={(e) => updateParam("sort", e.target.value)}
              className="appearance-none input-base py-2.5 pr-8 text-sm cursor-pointer"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-400 pointer-events-none" />
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setFilterOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-charcoal-200 font-body text-sm text-charcoal-700 hover:border-brand-400 hover:text-brand-600 transition-all"
          >
            <SlidersHorizontal size={15} />
            Filters
            {hasFilters && (
              <span className="w-5 h-5 rounded-full bg-brand-500 text-white text-[10px] font-bold flex items-center justify-center">
                !
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Active filters */}
      {hasFilters && (
        <div className="flex flex-wrap gap-2 mb-6">
          {currentCategory && (
            <span className="badge-brand flex items-center gap-1.5 py-1 px-3">
              {currentCategory}
              <button onClick={() => updateParam("category", "")}><X size={12} /></button>
            </span>
          )}
          {(currentMin || currentMax) && (
            <span className="badge-brand flex items-center gap-1.5 py-1 px-3">
              ₹{currentMin || 0} – ₹{currentMax || "∞"}
              <button onClick={() => { updateParam("minPrice", ""); updateParam("maxPrice", ""); }}><X size={12} /></button>
            </span>
          )}
          <button onClick={clearFilters} className="font-body text-xs text-charcoal-500 hover:text-red-500 underline">Clear all</button>
        </div>
      )}

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="skeleton aspect-[3/4] rounded-2xl" />
              <div className="skeleton h-4 w-3/4 rounded" />
              <div className="skeleton h-4 w-1/2 rounded" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-24">
          <p className="font-display text-3xl font-light text-charcoal-300 mb-3">No products found</p>
          <p className="font-body text-sm text-charcoal-400 mb-6">Try adjusting your filters or search term</p>
          <button onClick={clearFilters} className="btn-outline">Clear Filters</button>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
        >
          {products.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </motion.div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-12">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => updateParam("page", String(p))}
              className={`w-9 h-9 rounded-full font-body text-sm transition-all ${
                p === currentPage
                  ? "bg-brand-500 text-white shadow-brand"
                  : "border border-charcoal-200 text-charcoal-600 hover:border-brand-400"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Filter Drawer */}
      <AnimatePresence>
        {filterOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-charcoal-900/50"
              onClick={() => setFilterOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 350, damping: 35 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-80 bg-white shadow-strong overflow-y-auto"
            >
              <div className="flex items-center justify-between p-5 border-b border-charcoal-100">
                <h3 className="font-body text-base font-semibold">Filters</h3>
                <button onClick={() => setFilterOpen(false)}><X size={20} /></button>
              </div>

              <div className="p-5 space-y-8">
                {/* Price ranges */}
                <div>
                  <p className="font-body text-xs font-semibold uppercase tracking-widest text-charcoal-400 mb-3">Price Range</p>
                  <div className="space-y-2">
                    {PRICE_RANGES.map((r) => (
                      <button
                        key={r.label}
                        onClick={() => {
                          updateParam("minPrice", String(r.min));
                          updateParam("maxPrice", r.max === 99999 ? "" : String(r.max));
                          setFilterOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 rounded-xl font-body text-sm transition-all ${
                          currentMin === String(r.min) ? "bg-brand-50 text-brand-700 font-medium" : "hover:bg-cream-100 text-charcoal-700"
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sort (mobile) */}
                <div>
                  <p className="font-body text-xs font-semibold uppercase tracking-widest text-charcoal-400 mb-3">Sort By</p>
                  <div className="space-y-2">
                    {SORT_OPTIONS.map((o) => (
                      <button
                        key={o.value}
                        onClick={() => { updateParam("sort", o.value); setFilterOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 rounded-xl font-body text-sm transition-all ${
                          currentSort === o.value ? "bg-brand-50 text-brand-700 font-medium" : "hover:bg-cream-100 text-charcoal-700"
                        }`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button onClick={() => { clearFilters(); setFilterOpen(false); }}
                  className="w-full btn-outline text-sm">
                  Clear All Filters
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
