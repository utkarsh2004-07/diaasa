"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Package, AlertTriangle, CheckCircle, XCircle, Search, Save } from "lucide-react";
import toast from "react-hot-toast";

interface Variant {
  id: string;
  name: string;
  sku?: string | null;
  price: number;
  stock: number;
  lowStock: number;
  product: {
    id: string;
    name: string;
    slug: string;
    images: Array<{ url: string }>;
  };
}

interface Stats {
  total: number;
  outOfStock: number;
  lowStock: number;
  healthy: number;
}

export default function AdminInventoryClient({
  variants: initial,
  stats,
}: {
  variants: Variant[];
  stats: Stats;
}) {
  const [variants, setVariants] = useState(initial);
  const [edits, setEdits] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "low" | "out">("all");

  const filtered = variants.filter((v) => {
    const matchSearch =
      !search ||
      v.product.name.toLowerCase().includes(search.toLowerCase()) ||
      v.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "all" ||
      (filter === "out" && v.stock === 0) ||
      (filter === "low" && v.stock > 0 && v.stock <= 10);
    return matchSearch && matchFilter;
  });

  const handleStockChange = (id: string, value: string) => {
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 0) return;
    setEdits((e) => ({ ...e, [id]: num }));
  };

  const handleSave = async (variantId: string) => {
    const newStock = edits[variantId];
    if (newStock === undefined) return;
    setSaving(variantId);
    try {
      const res = await fetch(`/api/admin/inventory/${variantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: newStock }),
      });
      const data = await res.json();
      if (data.success) {
        setVariants((vs) =>
          vs.map((v) => (v.id === variantId ? { ...v, stock: newStock } : v))
        );
        setEdits((e) => {
          const next = { ...e };
          delete next[variantId];
          return next;
        });
        toast.success("Stock updated");
      } else toast.error("Failed to update");
    } finally {
      setSaving(null);
    }
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: "Out of Stock", class: "text-red-500 bg-red-50" };
    if (stock <= 10) return { label: "Low Stock", class: "text-amber-600 bg-amber-50" };
    return { label: "In Stock", class: "text-green-600 bg-green-50" };
  };

  return (
    <div className="space-y-6">
      <h1 className="font-body text-2xl font-semibold text-charcoal-900">Inventory</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total SKUs", value: stats.total, icon: Package, color: "bg-blue-50 text-blue-600" },
          { label: "Out of Stock", value: stats.outOfStock, icon: XCircle, color: "bg-red-50 text-red-500" },
          { label: "Low Stock", value: stats.lowStock, icon: AlertTriangle, color: "bg-amber-50 text-amber-600" },
          { label: "Healthy", value: stats.healthy, icon: CheckCircle, color: "bg-green-50 text-green-600" },
        ].map(({ label, value, icon: Icon, color }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="bg-white rounded-2xl p-5 shadow-soft border border-charcoal-50"
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color} mb-3`}>
              <Icon size={16} />
            </div>
            <p className="font-body text-2xl font-bold text-charcoal-900">{value}</p>
            <p className="font-body text-xs text-charcoal-400 mt-0.5">{label}</p>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-soft border border-charcoal-50 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search product or variant…"
            className="input-base pl-9 py-2 text-sm w-full"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "low", "out"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-xl font-body text-xs font-medium transition-all ${
                filter === f
                  ? "bg-brand-500 text-white"
                  : "border border-charcoal-200 text-charcoal-600 hover:border-brand-400"
              }`}
            >
              {f === "all" ? "All" : f === "low" ? "Low Stock" : "Out of Stock"}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-soft border border-charcoal-50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="bg-charcoal-50 text-charcoal-500 text-xs uppercase tracking-wider">
                <th className="text-left px-5 py-3 w-12" />
                <th className="text-left px-5 py-3">Product / Variant</th>
                <th className="text-left px-5 py-3">SKU</th>
                <th className="text-right px-5 py-3">Price</th>
                <th className="text-center px-5 py-3">Status</th>
                <th className="text-center px-5 py-3">Stock</th>
                <th className="text-center px-5 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal-50">
              {filtered.map((v) => {
                const status = getStockStatus(v.stock);
                const edited = edits[v.id] !== undefined;
                const currentStock = edited ? edits[v.id] : v.stock;

                return (
                  <tr key={v.id} className="hover:bg-cream-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="w-9 h-10 rounded-lg bg-cream-100 overflow-hidden">
                        {v.product.images[0]?.url && (
                          <img
                            src={v.product.images[0].url}
                            alt={v.product.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-medium text-charcoal-800 line-clamp-1">{v.product.name}</p>
                      <p className="text-xs text-charcoal-400">{v.name}</p>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-charcoal-500">
                      {v.sku || "—"}
                    </td>
                    <td className="px-5 py-3 text-right font-medium">
                      ₹{v.price.toLocaleString("en-IN")}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={`badge text-[11px] font-semibold ${status.class}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <input
                        type="number"
                        min={0}
                        value={currentStock}
                        onChange={(e) => handleStockChange(v.id, e.target.value)}
                        className={`w-20 mx-auto block text-center input-base py-1.5 text-sm ${
                          edited ? "border-brand-400 ring-1 ring-brand-300" : ""
                        }`}
                      />
                    </td>
                    <td className="px-5 py-3 text-center">
                      {edited && (
                        <button
                          onClick={() => handleSave(v.id)}
                          disabled={saving === v.id}
                          className="flex items-center gap-1 mx-auto px-3 py-1.5 rounded-lg bg-brand-500 text-white text-xs font-medium hover:bg-brand-600 transition-colors disabled:opacity-50"
                        >
                          <Save size={12} />
                          {saving === v.id ? "…" : "Save"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="py-12 text-center font-body text-sm text-charcoal-400">
            No variants found
          </div>
        )}
      </div>
    </div>
  );
}
