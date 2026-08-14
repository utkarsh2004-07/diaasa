"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Tag, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

interface Coupon {
  id: string; code: string; type: string; value: number;
  minCartValue: number; maxDiscount?: number | null;
  usageLimit?: number | null; usedCount: number;
  isActive: boolean; isPublic: boolean; expiresAt?: Date | null; description?: string | null;
  requiredProducts?: unknown; allowExtraProducts?: boolean;
}

interface Product { id: string; name: string; }

const EMPTY = {
  code: "", type: "PERCENTAGE", value: 10,
  minCartValue: 0, maxDiscount: "", usageLimit: "",
  description: "", expiresAt: "", isActive: true, isPublic: true,
  allowExtraProducts: true,
};

export default function AdminCouponsClient({ coupons: initial, products }: { coupons: Coupon[]; products: Product[] }) {
  const [coupons, setCoupons] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Record<string, unknown>>(EMPTY);
  const [saving, setSaving] = useState(false);
  // requiredProducts: [{productId, quantity}]
  const [reqProducts, setReqProducts] = useState<{ productId: string; quantity: number }[]>([]);

  const addReqProduct = () => setReqProducts((p) => [...p, { productId: "", quantity: 1 }]);
  const removeReqProduct = (i: number) => setReqProducts((p) => p.filter((_, idx) => idx !== i));
  const updateReqProduct = (i: number, val: string) =>
    setReqProducts((p) => p.map((item, idx) => idx === i ? { ...item, productId: val } : item));

  const resetForm = () => { setForm(EMPTY); setReqProducts([]); };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const validReqProducts = reqProducts.filter((r) => r.productId);
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          value: Number(form.value),
          minCartValue: Number(form.minCartValue) || 0,
          maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
          usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
          expiresAt: form.expiresAt || null,
          code: (form.code as string).toUpperCase().trim(),
          requiredProducts: validReqProducts.length ? validReqProducts : null,
          allowExtraProducts: form.allowExtraProducts,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCoupons((c) => [data.data.coupon, ...c]);
        setShowForm(false);
        resetForm();
        toast.success("Coupon created!");
      } else toast.error(data.error?.message || "Failed");
    } finally { setSaving(false); }
  };

  const toggleField = async (id: string, field: "isActive" | "isPublic", current: boolean) => {
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: !current }),
      });
      const data = await res.json();
      if (data.success) {
        setCoupons((cs) => cs.map((c) => c.id === id ? { ...c, [field]: !current } : c));
      }
    } catch { toast.error("Failed to update"); }
  };

  const deleteCoupon = async (id: string) => {
    if (!confirm("Delete this coupon?")) return;
    try {
      await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
      setCoupons((cs) => cs.filter((c) => c.id !== id));
      toast.success("Coupon deleted");
    } catch { toast.error("Failed"); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-body text-2xl font-semibold text-charcoal-900">Coupons</h1>
        <button onClick={() => setShowForm(true)}
          className="btn-primary flex items-center gap-2 text-sm py-2.5">
          <Plus size={16} /> Create Coupon
        </button>
      </div>

      {/* Create form modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-charcoal-900/50 flex items-center justify-center p-4"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-strong w-full max-w-md flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* sticky header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-charcoal-100 shrink-0">
                <h2 className="font-body text-lg font-semibold text-charcoal-900 flex items-center gap-2">
                  <Tag size={18} className="text-brand-500" /> New Coupon
                </h2>
                <button onClick={() => { setShowForm(false); resetForm(); }}><X size={20} className="text-charcoal-400" /></button>
              </div>

              {/* scrollable body */}
              <div className="overflow-y-auto flex-1 px-6 py-4">
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="font-body text-xs font-medium text-charcoal-600 mb-1 block">Code *</label>
                    <input value={form.code as string}
                      onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                      placeholder="SAVE20" required className="input-base uppercase font-mono tracking-widest" />
                  </div>
                  <div>
                    <label className="font-body text-xs font-medium text-charcoal-600 mb-1 block">Type</label>
                    <select value={form.type as string}
                      onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                      className="input-base">
                      <option value="PERCENTAGE">Percentage (%)</option>
                      <option value="FLAT">Flat (₹)</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-body text-xs font-medium text-charcoal-600 mb-1 block">
                      Value {form.type === "PERCENTAGE" ? "(%)" : "(₹)"}
                    </label>
                    <input type="number" value={form.value as number}
                      onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                      required min={1} className="input-base" />
                  </div>
                  <div>
                    <label className="font-body text-xs font-medium text-charcoal-600 mb-1 block">Min Cart Value (₹)</label>
                    <input type="number" value={form.minCartValue as number}
                      onChange={(e) => setForm((f) => ({ ...f, minCartValue: e.target.value }))}
                      min={0} className="input-base" />
                  </div>
                  <div>
                    <label className="font-body text-xs font-medium text-charcoal-600 mb-1 block">Max Discount (₹)</label>
                    <input type="number" value={form.maxDiscount as string}
                      onChange={(e) => setForm((f) => ({ ...f, maxDiscount: e.target.value }))}
                      placeholder="Optional" className="input-base" />
                  </div>
                  <div>
                    <label className="font-body text-xs font-medium text-charcoal-600 mb-1 block">Usage Limit</label>
                    <input type="number" value={form.usageLimit as string}
                      onChange={(e) => setForm((f) => ({ ...f, usageLimit: e.target.value }))}
                      placeholder="Unlimited" className="input-base" />
                  </div>
                  <div>
                    <label className="font-body text-xs font-medium text-charcoal-600 mb-1 block">Expires At</label>
                    <input type="datetime-local" value={form.expiresAt as string}
                      onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
                      className="input-base" />
                  </div>
                  <div className="col-span-2">
                    <label className="font-body text-xs font-medium text-charcoal-600 mb-1 block">Description</label>
                    <input value={form.description as string}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      placeholder="Optional description" className="input-base" />
                    <div className="mt-1.5 flex items-start gap-1.5 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                      <span className="text-amber-500 text-sm mt-0.5">💡</span>
                      <p className="font-body text-[11px] text-amber-700 leading-snug">
                        Start description with <span className="font-bold font-mono">[HOME]</span> to show this coupon on the homepage offers strip.<br />
                        Example: <span className="font-mono font-semibold">[HOME] Buy any 2 soaps and get 10% off</span>
                      </p>
                    </div>
                  </div>

                  {/* ── Required Products ── */}
                  <div className="col-span-2">
                    <div className="flex items-center justify-between mb-2">
                      <label className="font-body text-xs font-medium text-charcoal-600">Required Products (optional)</label>
                      <button type="button" onClick={addReqProduct}
                        className="font-body text-xs text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1">
                        <Plus size={12} /> Add Product
                      </button>
                    </div>
                    {reqProducts.length === 0 && (
                      <p className="font-body text-[11px] text-charcoal-400">No required products — coupon works on any cart.</p>
                    )}
                    <div className="space-y-2">
                      {reqProducts.map((rp, i) => (
                        <div key={i} className="flex gap-2 items-center">
                          <select
                            value={rp.productId}
                            onChange={(e) => updateReqProduct(i, e.target.value)}
                            className="input-base flex-1 text-sm"
                            required
                          >
                            <option value="">Select product…</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                          <button type="button" onClick={() => removeReqProduct(i)}
                            className="w-7 h-7 rounded-full bg-red-50 text-red-400 hover:bg-red-100 flex items-center justify-center shrink-0">
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                    {reqProducts.length > 0 && (
                      <div className="mt-3 flex items-center justify-between p-3 rounded-xl bg-charcoal-50">
                        <div>
                          <p className="font-body text-xs font-semibold text-charcoal-700">Allow Extra Products</p>
                          <p className="font-body text-[11px] text-charcoal-400">OFF = cart must contain ONLY these products</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, allowExtraProducts: !f.allowExtraProducts }))}
                          className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                            form.allowExtraProducts ? "bg-brand-500" : "bg-charcoal-200"
                          }`}
                        >
                          <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                            form.allowExtraProducts ? "translate-x-5" : "translate-x-0.5"
                          }`} />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="col-span-2 flex items-center justify-between p-3 rounded-xl bg-charcoal-50">
                    <div>
                      <p className="font-body text-xs font-semibold text-charcoal-700">Show on Product Page</p>
                      <p className="font-body text-[11px] text-charcoal-400 mt-0.5">Toggle off to hide from customers</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, isPublic: !f.isPublic }))}
                      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                        form.isPublic ? "bg-brand-500" : "bg-charcoal-200"
                      }`}
                    >
                      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                        form.isPublic ? "translate-x-5" : "translate-x-0.5"
                      }`} />
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={saving}
                  className="btn-primary w-full py-3">
                  {saving ? "Creating…" : "Create Coupon"}
                </button>
              </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Coupons list */}
      <div className="grid gap-3">
        {coupons.length === 0 && (
          <div className="bg-white rounded-2xl p-10 text-center font-body text-charcoal-400 text-sm">
            No coupons yet. Create one to get started.
          </div>
        )}
        {coupons.map((coupon) => (
          <div key={coupon.id}
            className="bg-white rounded-2xl p-5 shadow-soft border border-charcoal-50 flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
                <Tag size={18} className="text-brand-600" />
              </div>
              <div>
                <p className="font-mono text-sm font-bold tracking-widest text-charcoal-900">{coupon.code}</p>
                <p className="font-body text-xs text-charcoal-400">{coupon.description || "No description"}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 flex-1 font-body text-sm">
              <div>
                <p className="text-xs text-charcoal-400">Discount</p>
                <p className="font-semibold text-charcoal-800">
                  {coupon.type === "PERCENTAGE" ? `${coupon.value}%` : `₹${coupon.value}`}
                </p>
              </div>
              <div>
                <p className="text-xs text-charcoal-400">Min Order</p>
                <p className="font-semibold text-charcoal-800">₹{coupon.minCartValue}</p>
              </div>
              <div>
                <p className="text-xs text-charcoal-400">Used</p>
                <p className="font-semibold text-charcoal-800">
                  {coupon.usedCount}{coupon.usageLimit ? ` / ${coupon.usageLimit}` : ""}
                </p>
              </div>
              {coupon.expiresAt && (
                <div>
                  <p className="text-xs text-charcoal-400">Expires</p>
                  <p className="font-semibold text-charcoal-800">
                    {new Date(coupon.expiresAt).toLocaleDateString("en-IN")}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="flex flex-col items-center gap-1">
                <button
                  title="Active / Inactive"
                  onClick={() => toggleField(coupon.id, "isActive", coupon.isActive)}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${coupon.isActive ? "bg-brand-500" : "bg-charcoal-200"}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${coupon.isActive ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
                <span className="font-body text-[10px] text-charcoal-400">Active</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <button
                  title="Show / Hide on product page"
                  onClick={() => toggleField(coupon.id, "isPublic", coupon.isPublic)}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${coupon.isPublic ? "bg-green-500" : "bg-charcoal-200"}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${coupon.isPublic ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
                <span className="font-body text-[10px] text-charcoal-400">Visible</span>
              </div>
              <button onClick={() => deleteCoupon(coupon.id)}
                className="w-8 h-8 rounded-full bg-red-50 text-red-400 hover:bg-red-100 flex items-center justify-center transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
