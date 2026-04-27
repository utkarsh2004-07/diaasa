"use client";

import { useState } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

interface Product {
  id: string; name: string; sku?: string | null;
  categoryName: string; imageUrl: string | null;
  price: number | null; stock: number; isActive: boolean;
}

interface Props {
  products: Product[];
  total: number; page: number; limit: number; q?: string;
}

export default function AdminProductsClient({ products: initial, total, page, limit, q }: Props) {
  const [products, setProducts] = useState(initial);
  const [deleting, setDeleting] = useState<string | null>(null);
  const router = useRouter();

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Permanently delete "${name}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setProducts((ps) => ps.filter((p) => p.id !== id));
        toast.success("Product deleted");
      } else {
        toast.error(data.error?.message || "Failed to delete");
      }
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-soft border border-charcoal-50 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm font-body">
          <thead>
            <tr className="bg-charcoal-50 text-charcoal-500 text-xs uppercase tracking-wider">
              <th className="text-left px-5 py-3 w-12" />
              <th className="text-left px-5 py-3">Product</th>
              <th className="text-left px-5 py-3">Category</th>
              <th className="text-right px-5 py-3">Price</th>
              <th className="text-right px-5 py-3">Stock</th>
              <th className="text-left px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-charcoal-50">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-cream-50 transition-colors">
                <td className="px-5 py-3">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-cream-100">
                    {p.imageUrl && <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />}
                  </div>
                </td>
                <td className="px-5 py-3">
                  <p className="font-medium text-charcoal-800 line-clamp-1">{p.name}</p>
                  {p.sku && <p className="text-xs text-charcoal-400">SKU: {p.sku}</p>}
                </td>
                <td className="px-5 py-3 text-charcoal-600">{p.categoryName}</td>
                <td className="px-5 py-3 text-right font-medium">
                  {p.price ? `₹${p.price.toLocaleString("en-IN")}` : "—"}
                </td>
                <td className="px-5 py-3 text-right">
                  <span className={`font-medium ${p.stock <= 5 ? "text-red-500" : "text-charcoal-700"}`}>
                    {p.stock}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <span className={`badge text-[11px] ${p.isActive ? "badge-green" : "badge-gray"}`}>
                    {p.isActive ? "Active" : "Draft"}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-end gap-3">
                    <Link href={`/admin/products/${p.id}`} className="text-xs text-brand-600 hover:underline">
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(p.id, p.name)}
                      disabled={deleting === p.id}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 transition-colors disabled:opacity-40"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {total > limit && (
        <div className="flex justify-center gap-2 p-4 border-t border-charcoal-50">
          {Array.from({ length: Math.ceil(total / limit) }, (_, i) => (
            <Link
              key={i}
              href={`?page=${i + 1}${q ? `&q=${q}` : ""}`}
              className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-body transition-all ${
                page === i + 1
                  ? "bg-brand-500 text-white"
                  : "border border-charcoal-200 text-charcoal-600 hover:border-brand-400"
              }`}
            >
              {i + 1}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
