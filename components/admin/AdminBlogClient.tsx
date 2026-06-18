"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  Plus, Trash2, Edit2, X, Save, Eye, EyeOff,
  Bold, Italic, List, Link2, Image as ImageIcon,
  Video, Heading1, Heading2, Quote, Code,
} from "lucide-react";
import toast from "react-hot-toast";
import ImageUpload from "@/components/ImageUpload";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content: string;
  coverImage?: string | null;
  status: "DRAFT" | "PUBLISHED";
  tags?: string | null;
  publishedAt?: string | null;
  createdAt: string;
  author: { name?: string | null };
}

interface Props { initialPosts: BlogPost[]; }

const EMPTY: {
  title: string; slug: string; excerpt: string; content: string;
  coverImage: string; tags: string; status: "DRAFT" | "PUBLISHED";
  metaTitle: string; metaDesc: string;
} = {
  title: "", slug: "", excerpt: "", content: "",
  coverImage: "", tags: "", status: "DRAFT",
  metaTitle: "", metaDesc: "",
};

function autoSlug(title: string) {
  return title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

/* ── Toolbar button ── */
function TB({ icon: Icon, label, onClick }: { icon: React.ElementType; label: string; onClick: () => void }) {
  return (
    <button type="button" title={label} onClick={onClick}
      className="p-1.5 rounded hover:bg-charcoal-100 text-charcoal-600 hover:text-charcoal-900 transition-colors">
      <Icon size={15} />
    </button>
  );
}

export default function AdminBlogClient({ initialPosts }: Props) {
  const [posts, setPosts] = useState<BlogPost[]>(initialPosts);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [showVideoInput, setShowVideoInput] = useState(false);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  const openNew = () => { setEditing(null); setForm(EMPTY); setOpen(true); };
  const openEdit = (p: BlogPost) => {
    setEditing(p);
    setForm({
      title: p.title, slug: p.slug, excerpt: p.excerpt || "",
      content: p.content, coverImage: p.coverImage || "",
      tags: p.tags || "", status: p.status,
      metaTitle: "", metaDesc: "",
    });
    setOpen(true);
  };

  /* ── Insert at cursor ── */
  const insertAtCursor = (before: string, after = "") => {
    const el = editorRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = form.content.slice(start, end);
    const newContent =
      form.content.slice(0, start) + before + selected + after + form.content.slice(end);
    setForm((f) => ({ ...f, content: newContent }));
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + before.length, start + before.length + selected.length);
    }, 0);
  };

  const toolbar = [
    { icon: Heading1, label: "H1", fn: () => insertAtCursor("<h1>", "</h1>") },
    { icon: Heading2, label: "H2", fn: () => insertAtCursor("<h2>", "</h2>") },
    { icon: Bold,     label: "Bold",   fn: () => insertAtCursor("<strong>", "</strong>") },
    { icon: Italic,   label: "Italic", fn: () => insertAtCursor("<em>", "</em>") },
    { icon: List,     label: "List",   fn: () => insertAtCursor("<ul>\n  <li>", "</li>\n</ul>") },
    { icon: Quote,    label: "Quote",  fn: () => insertAtCursor("<blockquote>", "</blockquote>") },
    { icon: Code,     label: "Code",   fn: () => insertAtCursor("<code>", "</code>") },
    { icon: Link2,    label: "Link",   fn: () => insertAtCursor('<a href="URL">', "</a>") },
  ];

  const insertImage = (url: string) => {
    insertAtCursor(`<img src="${url}" alt="" class="w-full rounded-2xl my-4" />`);
  };

  const insertVideo = () => {
    if (!videoUrl.trim()) return;
    const yt = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    if (yt) {
      insertAtCursor(`<div class="relative w-full aspect-video my-4 rounded-2xl overflow-hidden"><iframe src="https://www.youtube.com/embed/${yt[1]}" class="w-full h-full" allowfullscreen></iframe></div>`);
    } else {
      insertAtCursor(`<video src="${videoUrl}" controls class="w-full rounded-2xl my-4"></video>`);
    }
    setVideoUrl("");
    setShowVideoInput(false);
  };

  const handleSave = async () => {
    if (!form.title || !form.slug || !form.content) {
      toast.error("Title, slug and content are required"); return;
    }
    setSaving(true);
    try {
      const url = editing ? `/api/admin/blog/${editing.id}` : "/api/admin/blog";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) { toast.error(data.error?.message || "Failed"); return; }
      toast.success(editing ? "Post updated!" : "Post created!");
      // Refresh list
      const listRes = await fetch("/api/admin/blog");
      const listData = await listRes.json();
      if (listData.success) setPosts(listData.data.posts);
      setOpen(false);
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this post?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/blog/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setPosts((ps) => ps.filter((p) => p.id !== id));
        toast.success("Deleted");
      } else toast.error("Failed to delete");
    } finally { setDeleting(null); }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-body text-2xl font-semibold text-charcoal-900">Blog Posts</h1>
          <p className="font-body text-sm text-charcoal-400 mt-0.5">{posts.length} posts total</p>
        </div>
        <button onClick={openNew} className="btn-primary flex items-center gap-2 py-2.5">
          <Plus size={15} /> New Post
        </button>
      </div>

      {/* Posts table */}
      <div className="bg-white rounded-2xl border border-charcoal-100 shadow-soft overflow-hidden">
        {posts.length === 0 ? (
          <div className="text-center py-20 text-charcoal-400">
            <p className="font-body text-sm">No blog posts yet. Create your first one!</p>
          </div>
        ) : (
          <div className="divide-y divide-charcoal-50">
            {posts.map((p) => (
              <div key={p.id} className="flex items-center gap-4 px-5 py-4 hover:bg-charcoal-50 transition-colors">
                {p.coverImage ? (
                  <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-cream-100 relative">
                    <Image src={p.coverImage} alt={p.title} fill className="object-cover" sizes="56px" />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-cream-100 shrink-0 flex items-center justify-center">
                    <ImageIcon size={20} className="text-charcoal-300" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-body text-sm font-semibold text-charcoal-900 truncate">{p.title}</p>
                  <p className="font-body text-xs text-charcoal-400 mt-0.5 truncate">{p.excerpt || "No excerpt"}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      p.status === "PUBLISHED" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                    }`}>
                      {p.status}
                    </span>
                    <span className="font-body text-[11px] text-charcoal-400">
                      {new Date(p.createdAt).toLocaleDateString("en-IN")}
                    </span>
                    {p.tags && (
                      <span className="font-body text-[11px] text-charcoal-400 truncate">• {p.tags}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {p.status === "PUBLISHED" && (
                    <a href={`/blog/${p.slug}`} target="_blank" rel="noopener noreferrer"
                      className="p-2 rounded-lg hover:bg-brand-50 text-charcoal-400 hover:text-brand-600 transition-colors">
                      <Eye size={15} />
                    </a>
                  )}
                  <button onClick={() => openEdit(p)}
                    className="p-2 rounded-lg hover:bg-charcoal-100 text-charcoal-400 hover:text-charcoal-700 transition-colors">
                    <Edit2 size={15} />
                  </button>
                  <button onClick={() => handleDelete(p.id)} disabled={deleting === p.id}
                    className="p-2 rounded-lg hover:bg-red-50 text-charcoal-400 hover:text-red-500 transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Editor Modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 overflow-y-auto"
            onClick={(e) => e.target === e.currentTarget && setOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-4xl mx-auto my-8 shadow-strong overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-charcoal-100">
                <h2 className="font-body text-lg font-semibold text-charcoal-900">
                  {editing ? "Edit Post" : "New Blog Post"}
                </h2>
                <div className="flex items-center gap-2">
                  <button onClick={handleSave} disabled={saving}
                    className="btn-primary flex items-center gap-2 py-2 text-sm">
                    <Save size={14} /> {saving ? "Saving…" : "Save"}
                  </button>
                  <button onClick={() => setOpen(false)}
                    className="p-2 rounded-xl hover:bg-charcoal-100 transition-colors">
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
                {/* Title + Slug */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-body text-xs font-medium text-charcoal-600 mb-1 block">Title *</label>
                    <input
                      value={form.title}
                      onChange={(e) => setForm((f) => ({
                        ...f, title: e.target.value,
                        slug: editing ? f.slug : autoSlug(e.target.value),
                      }))}
                      className="input-base" placeholder="My Blog Post"
                    />
                  </div>
                  <div>
                    <label className="font-body text-xs font-medium text-charcoal-600 mb-1 block">Slug *</label>
                    <input
                      value={form.slug}
                      onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                      className="input-base font-mono text-sm" placeholder="my-blog-post"
                    />
                  </div>
                </div>

                {/* Excerpt */}
                <div>
                  <label className="font-body text-xs font-medium text-charcoal-600 mb-1 block">Excerpt (shown on blog listing)</label>
                  <textarea
                    value={form.excerpt}
                    onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
                    rows={2} className="input-base resize-none text-sm"
                    placeholder="Short summary of the post…"
                  />
                </div>

                {/* Cover Image */}
                <div>
                  <label className="font-body text-xs font-medium text-charcoal-600 mb-2 block">Cover Image</label>
                  <div className="flex gap-3 items-start">
                    <div className="flex-1 space-y-2">
                      <input
                        value={form.coverImage}
                        onChange={(e) => setForm((f) => ({ ...f, coverImage: e.target.value }))}
                        className="input-base text-sm" placeholder="Paste image URL…"
                      />
                      <ImageUpload
                        folder="diaasa/blog"
                        label="Upload Cover"
                        onUpload={(url) => setForm((f) => ({ ...f, coverImage: url }))}
                      />
                    </div>
                    {form.coverImage && (
                      <div className="relative w-24 h-16 rounded-xl overflow-hidden bg-cream-100 shrink-0">
                        <Image src={form.coverImage} alt="cover" fill className="object-cover" sizes="96px" />
                        <button type="button" onClick={() => setForm((f) => ({ ...f, coverImage: "" }))}
                          className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center">
                          <X size={10} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Content editor */}
                <div>
                  <label className="font-body text-xs font-medium text-charcoal-600 mb-2 block">Content * (HTML)</label>

                  {/* Toolbar */}
                  <div className="flex flex-wrap items-center gap-0.5 p-2 bg-charcoal-50 border border-charcoal-200 rounded-t-xl border-b-0">
                    {toolbar.map((t) => (
                      <TB key={t.label} icon={t.icon} label={t.label} onClick={t.fn} />
                    ))}
                    <div className="w-px h-5 bg-charcoal-200 mx-1" />
                    {/* Inline image upload */}
                    <div className="relative">
                      <ImageUpload
                        folder="diaasa/blog"
                        label=""
                        onUpload={insertImage}
                      />
                    </div>
                    <div className="w-px h-5 bg-charcoal-200 mx-1" />
                    {/* Video */}
                    <button type="button" title="Insert Video" onClick={() => setShowVideoInput((v) => !v)}
                      className="p-1.5 rounded hover:bg-charcoal-100 text-charcoal-600 hover:text-charcoal-900 transition-colors">
                      <Video size={15} />
                    </button>
                  </div>

                  {/* Video URL input */}
                  {showVideoInput && (
                    <div className="flex gap-2 p-2 bg-charcoal-50 border border-charcoal-200 border-t-0 border-b-0">
                      <input
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        className="input-base flex-1 text-sm py-1.5"
                        placeholder="YouTube URL or direct mp4 URL…"
                      />
                      <button type="button" onClick={insertVideo}
                        className="btn-outline text-sm py-1.5 px-3">Insert</button>
                      <button type="button" onClick={() => setShowVideoInput(false)}
                        className="p-1.5 text-charcoal-400 hover:text-charcoal-700"><X size={14} /></button>
                    </div>
                  )}

                  <textarea
                    ref={editorRef}
                    value={form.content}
                    onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                    rows={16}
                    className="w-full border border-charcoal-200 rounded-b-xl p-4 font-mono text-xs text-charcoal-800 focus:outline-none focus:ring-2 focus:ring-brand-400 resize-y"
                    placeholder="<p>Start writing your blog post here...</p>"
                  />
                  <p className="font-body text-[10px] text-charcoal-400 mt-1">
                    Use toolbar buttons to insert formatted HTML. Images and videos can be inserted inline anywhere.
                  </p>
                </div>

                {/* Tags + Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-body text-xs font-medium text-charcoal-600 mb-1 block">Tags (comma separated)</label>
                    <input
                      value={form.tags}
                      onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                      className="input-base text-sm" placeholder="skincare, tips, ayurveda"
                    />
                  </div>
                  <div>
                    <label className="font-body text-xs font-medium text-charcoal-600 mb-1 block">Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as "DRAFT" | "PUBLISHED" }))}
                      className="input-base"
                    >
                      <option value="DRAFT">Draft</option>
                      <option value="PUBLISHED">Published</option>
                    </select>
                  </div>
                </div>

                {/* SEO */}
                <div className="space-y-3 pt-2 border-t border-charcoal-100">
                  <p className="font-body text-xs font-semibold text-charcoal-500 uppercase tracking-widest">SEO (optional)</p>
                  <input
                    value={form.metaTitle}
                    onChange={(e) => setForm((f) => ({ ...f, metaTitle: e.target.value }))}
                    className="input-base text-sm" placeholder="Meta Title"
                  />
                  <textarea
                    value={form.metaDesc}
                    onChange={(e) => setForm((f) => ({ ...f, metaDesc: e.target.value }))}
                    rows={2} className="input-base text-sm resize-none" placeholder="Meta Description"
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
