"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Image as ImageIcon, Trash2, GripVertical } from "lucide-react";
import toast from "react-hot-toast";

interface Banner {
  id: string; title: string; image: string; mobileImage?: string | null;
  link?: string | null; type: string; isActive: boolean;
  priority: number; startsAt?: Date | null; endsAt?: Date | null;
}

const EMPTY = {
  title: "", image: "", mobileImage: "", link: "",
  type: "HERO", isActive: true, priority: 0,
  startsAt: "", endsAt: "",
};

const TYPE_COLORS: Record<string, string> = {
  HERO: "bg-blue-100 text-blue-700",
  CATEGORY: "bg-purple-100 text-purple-700",
  PROMO: "bg-green-100 text-green-700",
  POPUP: "bg-orange-100 text-orange-700",
};

export default function AdminBannersClient({ banners: initial }: { banners: Banner[] }) {
  const [banners, setBanners] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Record<string, unknown>>(EMPTY);
  const [saving, setSaving] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          priority: Number(form.priority) || 0,
          startsAt: form.startsAt || null,
          endsAt: form.endsAt || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setBanners((b) => [...b, data.data.banner]);
        setShowForm(false);
        setForm(EMPTY);
        toast.success("Banner created!");
      } else toast.error(data.error?.message || "Failed");
    } finally { setSaving(false); }
  };

  const toggleBanner = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/banners/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      const data = await res.json();
      if (data.success) {
        setBanners((bs) => bs.map((b) => b.id === id ? { ...b, isActive: !isActive } : b));
      }
    } catch { toast.error("Failed"); }
  };

  const deleteBanner = async (id: string) => {
    if (!confirm("Delete this banner?")) return;
    try {
      await fetch(`/api/admin/banners/${id}`, { method: "DELETE" });
      setBanners((bs) => bs.filter((b) => b.id !== id));
      toast.success("Banner deleted");
    } catch { toast.error("Failed"); }
  };

  const grouped = ["HERO", "CATEGORY", "PROMO", "POPUP"].reduce((acc, type) => {
    acc[type] = banners.filter((b) => b.type === type);
    return acc;
  }, {} as Record<string, Banner[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-body text-2xl font-semibold text-charcoal-900">Banners</h1>
        <button onClick={() => setShowForm(true)}
          className="btn-primary flex items-center gap-2 text-sm py-2.5">
          <Plus size={16} /> Add Banner
        </button>
      </div>

      {/* Form modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-charcoal-900/50 flex items-center justify-center p-4"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-strong w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-body text-lg font-semibold">New Banner</h2>
                <button onClick={() => setShowForm(false)}><X size={20} className="text-charcoal-400" /></button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="font-body text-xs font-medium text-charcoal-600 mb-1 block">Title</label>
                  <input value={form.title as string}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="(optional)" className="input-base" />
                </div>
                <div>
                  <label className="font-body text-xs font-medium text-charcoal-600 mb-1 block">Image URL *</label>
                  <input value={form.image as string}
                    onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
                    placeholder="https://…" required className="input-base" />
                </div>
                <div>
                  <label className="font-body text-xs font-medium text-charcoal-600 mb-1 block">Mobile Image URL</label>
                  <input value={form.mobileImage as string}
                    onChange={(e) => setForm((f) => ({ ...f, mobileImage: e.target.value }))}
                    placeholder="https://… (optional)" className="input-base" />
                </div>
                <div>
                  <label className="font-body text-xs font-medium text-charcoal-600 mb-1 block">Link</label>
                  <input value={form.link as string}
                    onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))}
                    placeholder="/products?category=skincare" className="input-base" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-body text-xs font-medium text-charcoal-600 mb-1 block">Type</label>
                    <select value={form.type as string}
                      onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                      className="input-base">
                      {["HERO", "CATEGORY", "PROMO", "POPUP"].map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-body text-xs font-medium text-charcoal-600 mb-1 block">Priority</label>
                    <input type="number" value={form.priority as number}
                      onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                      min={0} className="input-base" />
                  </div>
                  <div>
                    <label className="font-body text-xs font-medium text-charcoal-600 mb-1 block">Start Date</label>
                    <input type="datetime-local" value={form.startsAt as string}
                      onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))}
                      className="input-base" />
                  </div>
                  <div>
                    <label className="font-body text-xs font-medium text-charcoal-600 mb-1 block">End Date</label>
                    <input type="datetime-local" value={form.endsAt as string}
                      onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))}
                      className="input-base" />
                  </div>
                </div>
                <button type="submit" disabled={saving} className="btn-primary w-full py-3">
                  {saving ? "Creating…" : "Create Banner"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grouped banners */}
      {Object.entries(grouped).map(([type, items]) => (
        items.length > 0 && (
          <div key={type}>
            <h2 className="font-body text-sm font-semibold text-charcoal-500 uppercase tracking-wider mb-3">
              {type} Banners ({items.length})
            </h2>
            <div className="space-y-3">
              {items.map((banner) => (
                <div key={banner.id}
                  className="bg-white rounded-2xl p-4 shadow-soft border border-charcoal-50 flex items-center gap-4">
                  <GripVertical size={16} className="text-charcoal-300 shrink-0 cursor-grab" />

                  {/* Preview */}
                  <div className="w-20 h-12 rounded-lg overflow-hidden bg-cream-100 shrink-0">
                    <img src={banner.image} alt={banner.title}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-body text-sm font-medium text-charcoal-800 truncate">{banner.title}</p>
                      <span className={`badge text-[10px] font-semibold ${TYPE_COLORS[banner.type] || ""}`}>
                        {banner.type}
                      </span>
                    </div>
                    {banner.link && (
                      <p className="font-body text-xs text-charcoal-400 truncate mt-0.5">{banner.link}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={() => toggleBanner(banner.id, banner.isActive)}
                      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${banner.isActive ? "bg-brand-500" : "bg-charcoal-200"}`}
                    >
                      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${banner.isActive ? "translate-x-5" : "translate-x-0.5"}`} />
                    </button>
                    <button onClick={() => deleteBanner(banner.id)}
                      className="w-8 h-8 rounded-full bg-red-50 text-red-400 hover:bg-red-100 flex items-center justify-center">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      ))}

      {banners.length === 0 && (
        <div className="bg-white rounded-2xl p-12 text-center">
          <ImageIcon size={40} className="text-charcoal-200 mx-auto mb-3" />
          <p className="font-body text-sm text-charcoal-400">No banners yet</p>
        </div>
      )}
    </div>
  );
}
