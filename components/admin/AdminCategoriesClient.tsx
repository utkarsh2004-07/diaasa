"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, FolderOpen, Edit2, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  isActive: boolean;
  sortOrder: number;
  _count: { products: number };
  children: Array<{ id: string; name: string }>;
}

const EMPTY_FORM = {
  name: "", slug: "", description: "", image: "",
  isActive: true, sortOrder: 0,
};

export default function AdminCategoriesClient({
  categories: initial,
}: {
  categories: Category[];
}) {
  const [categories, setCategories] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const autoSlug = (name: string) =>
    name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  const handleNameChange = (name: string) => {
    setForm((f) => ({
      ...f,
      name,
      slug: editId ? f.slug : autoSlug(name),
    }));
  };

  const openCreate = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (cat: Category) => {
    setEditId(cat.id);
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || "",
      image: cat.image || "",
      isActive: cat.isActive,
      sortOrder: cat.sortOrder,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editId ? `/api/admin/categories/${editId}` : "/api/admin/categories";
      const method = editId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          sortOrder: Number(form.sortOrder) || 0,
          description: form.description || null,
          image: form.image || null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (editId) {
          setCategories((cs) =>
            cs.map((c) =>
              c.id === editId ? { ...c, ...data.data.category } : c
            )
          );
          toast.success("Category updated!");
        } else {
          setCategories((cs) => [
            { ...data.data.category, _count: { products: 0 }, children: [] },
            ...cs,
          ]);
          toast.success("Category created!");
        }
        setShowForm(false);
        setForm(EMPTY_FORM);
        setEditId(null);
      } else {
        toast.error(data.error?.message || "Failed");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const cat = categories.find((c) => c.id === id);
    if (cat && cat._count.products > 0) {
      toast.error("Cannot delete: category has products");
      return;
    }
    if (!confirm("Delete this category?")) return;
    try {
      await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
      setCategories((cs) => cs.filter((c) => c.id !== id));
      toast.success("Category deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-body text-2xl font-semibold text-charcoal-900">Categories</h1>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 text-sm py-2.5">
          <Plus size={16} /> Add Category
        </button>
      </div>

      {/* Form modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-charcoal-900/50 flex items-center justify-center p-4"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-strong w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-body text-lg font-semibold text-charcoal-900">
                  {editId ? "Edit Category" : "New Category"}
                </h2>
                <button onClick={() => setShowForm(false)}>
                  <X size={20} className="text-charcoal-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="font-body text-xs font-medium text-charcoal-600 mb-1 block">Name *</label>
                  <input
                    value={form.name as string}
                    onChange={(e) => handleNameChange(e.target.value)}
                    required
                    className="input-base"
                    placeholder="Skincare"
                  />
                </div>
                <div>
                  <label className="font-body text-xs font-medium text-charcoal-600 mb-1 block">Slug *</label>
                  <input
                    value={form.slug as string}
                    onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                    required
                    className="input-base font-mono text-sm"
                    placeholder="skincare"
                  />
                </div>
                <div>
                  <label className="font-body text-xs font-medium text-charcoal-600 mb-1 block">Description</label>
                  <textarea
                    value={form.description as string}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    rows={2}
                    className="input-base resize-none"
                    placeholder="Optional description"
                  />
                </div>
                <div>
                  <label className="font-body text-xs font-medium text-charcoal-600 mb-1 block">Image URL</label>
                  <input
                    value={form.image as string}
                    onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
                    className="input-base"
                    placeholder="Paste Cloudinary URL…"
                  />
                  <p className="text-[10px] text-charcoal-400 mt-1">Recommended: Use Cloudinary URLs for better speed.</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-body text-xs font-medium text-charcoal-600 mb-1 block">Sort Order</label>
                    <input
                      type="number"
                      value={form.sortOrder as number}
                      onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
                      min={0}
                      className="input-base"
                    />
                  </div>
                  <div className="flex items-end pb-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}
                        className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                          form.isActive ? "bg-brand-500" : "bg-charcoal-200"
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                            form.isActive ? "translate-x-5" : "translate-x-0.5"
                          }`}
                        />
                      </button>
                      <span className="font-body text-sm text-charcoal-600">Active</span>
                    </label>
                  </div>
                </div>

                <button type="submit" disabled={saving} className="btn-primary w-full py-3">
                  {saving ? "Saving…" : editId ? "Update Category" : "Create Category"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat, i) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white rounded-2xl p-5 shadow-soft border border-charcoal-50 hover:border-brand-200 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-cream-100 flex items-center justify-center">
                  {cat.image ? (
                    <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                  ) : (
                    <FolderOpen size={18} className="text-charcoal-400" />
                  )}
                </div>
                <div>
                  <p className="font-body text-sm font-semibold text-charcoal-800">{cat.name}</p>
                  <p className="font-mono text-xs text-charcoal-400">/{cat.slug}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => openEdit(cat)}
                  className="w-7 h-7 rounded-full hover:bg-charcoal-50 flex items-center justify-center text-charcoal-400 hover:text-brand-600 transition-colors"
                >
                  <Edit2 size={13} />
                </button>
                <button
                  onClick={() => handleDelete(cat.id)}
                  className="w-7 h-7 rounded-full hover:bg-red-50 flex items-center justify-center text-charcoal-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <span className={`badge text-[11px] ${cat.isActive ? "badge-green" : "badge-gray"}`}>
                {cat.isActive ? "Active" : "Hidden"}
              </span>
              <span className="font-body text-xs text-charcoal-400">
                {cat._count.products} product{cat._count.products !== 1 ? "s" : ""}
              </span>
              {cat.children.length > 0 && (
                <span className="font-body text-xs text-charcoal-400">
                  {cat.children.length} subcategories
                </span>
              )}
            </div>

            {cat.description && (
              <p className="font-body text-xs text-charcoal-400 mt-2 line-clamp-2">
                {cat.description}
              </p>
            )}
          </motion.div>
        ))}

        {categories.length === 0 && (
          <div className="col-span-3 bg-white rounded-2xl p-12 text-center">
            <FolderOpen size={40} className="text-charcoal-200 mx-auto mb-3" />
            <p className="font-body text-sm text-charcoal-400">No categories yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
