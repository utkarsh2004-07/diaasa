"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Save, X, Edit2 } from "lucide-react";
import toast from "react-hot-toast";

interface PageItem {
  slug: string; title: string; content: string; id: string;
}

export default function AdminPagesClient({ pages: initial }: { pages: PageItem[] }) {
  const [pages, setPages] = useState(initial);
  const [editing, setEditing] = useState<PageItem | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: editing.slug, title: editing.title, content: editing.content }),
      });
      const data = await res.json();
      if (data.success) {
        setPages((ps) => ps.map((p) => p.slug === editing.slug ? { ...editing, id: data.data.page.id } : p));
        setEditing(null);
        toast.success("Page saved!");
      } else toast.error("Failed to save");
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-5">
      <h1 className="font-body text-2xl font-semibold text-charcoal-900">Static Pages</h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {pages.map((page) => (
          <div key={page.slug}
            className="bg-white rounded-2xl p-5 shadow-soft border border-charcoal-50 hover:border-brand-200 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-cream-100 flex items-center justify-center">
                  <FileText size={16} className="text-charcoal-500" />
                </div>
                <div>
                  <p className="font-body text-sm font-semibold text-charcoal-800">{page.title}</p>
                  <p className="font-body text-xs text-charcoal-400">/{page.slug}</p>
                </div>
              </div>
              <button
                onClick={() => setEditing({ ...page })}
                className="w-8 h-8 rounded-full bg-charcoal-50 hover:bg-brand-50 hover:text-brand-600 flex items-center justify-center transition-colors"
              >
                <Edit2 size={13} />
              </button>
            </div>
            <div className="mt-3">
              {page.content ? (
                <p className="font-body text-xs text-charcoal-400 line-clamp-2">
                  {page.content.replace(/<[^>]+>/g, " ").substring(0, 100)}…
                </p>
              ) : (
                <p className="font-body text-xs text-charcoal-300 italic">No content yet</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Editor modal */}
      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-charcoal-900/60 flex items-center justify-center p-4"
            onClick={() => setEditing(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-strong w-full max-w-3xl h-[80vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-5 border-b border-charcoal-100">
                <h2 className="font-body text-lg font-semibold text-charcoal-900">Edit: {editing.title}</h2>
                <div className="flex items-center gap-2">
                  <button onClick={handleSave} disabled={saving}
                    className="btn-primary flex items-center gap-2 text-sm py-2">
                    <Save size={14} /> {saving ? "Saving…" : "Save"}
                  </button>
                  <button onClick={() => setEditing(null)}
                    className="w-8 h-8 rounded-full hover:bg-charcoal-50 flex items-center justify-center">
                    <X size={18} className="text-charcoal-400" />
                  </button>
                </div>
              </div>
              <div className="flex-1 p-5 overflow-hidden">
                <textarea
                  value={editing.content}
                  onChange={(e) => setEditing((ed) => ed ? { ...ed, content: e.target.value } : null)}
                  placeholder="Enter HTML content or plain text…"
                  className="w-full h-full input-base resize-none font-mono text-xs leading-relaxed"
                />
              </div>
              <div className="px-5 pb-4">
                <p className="font-body text-xs text-charcoal-400">
                  Supports HTML. Published at: <span className="font-mono">/pages/{editing.slug}</span>
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
