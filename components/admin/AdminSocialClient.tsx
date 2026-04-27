"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Video, Image, ExternalLink, ToggleLeft, ToggleRight } from "lucide-react";
import toast from "react-hot-toast";

interface Post {
  id: string; type: string; url: string;
  link?: string | null; caption?: string | null;
  sortOrder: number; isActive: boolean;
}

export default function AdminSocialClient({ posts: initial }: { posts: Post[] }) {
  const [posts, setPosts] = useState<Post[]>(initial);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const router = useRouter();

  const [form, setForm] = useState({
    type: "IMAGE", url: "", link: "", caption: "", sortOrder: 0,
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.url.trim()) { toast.error("URL is required"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/social-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setPosts((p) => [...p, data.data.post]);
        setForm({ type: "IMAGE", url: "", link: "", caption: "", sortOrder: 0 });
        toast.success("Post added!");
        router.refresh();
      } else toast.error(data.error?.message || "Failed");
    } catch { toast.error("Failed to add post"); }
    finally { setSaving(false); }
  };

  const handleToggle = async (post: Post) => {
    try {
      const res = await fetch("/api/admin/social-posts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: post.id, isActive: !post.isActive }),
      });
      const data = await res.json();
      if (data.success) {
        setPosts((ps) => ps.map((p) => p.id === post.id ? { ...p, isActive: !p.isActive } : p));
      }
    } catch { toast.error("Failed"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this post?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/social-posts?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setPosts((ps) => ps.filter((p) => p.id !== id));
        toast.success("Deleted");
        router.refresh();
      } else toast.error(data.error?.message || "Failed");
    } catch { toast.error("Failed"); }
    finally { setDeleting(null); }
  };

  // Extract YouTube/video embed URL
  const getVideoEmbed = (url: string) => {
    const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
    return url;
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="font-body text-2xl font-semibold text-charcoal-900">Social / Instagram Posts</h1>

      {/* Add form */}
      <div className="bg-white rounded-2xl p-6 shadow-soft border border-charcoal-50">
        <h2 className="font-body text-sm font-semibold text-charcoal-700 mb-4">Add New Post</h2>
        <form onSubmit={handleAdd} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-body text-xs text-charcoal-500 mb-1 block">Type</label>
              <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} className="input-base">
                <option value="IMAGE">Image</option>
                <option value="VIDEO">Video (YouTube / URL)</option>
              </select>
            </div>
            <div>
              <label className="font-body text-xs text-charcoal-500 mb-1 block">Sort Order</label>
              <input type="number" value={form.sortOrder} onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))} className="input-base" min={0} />
            </div>
          </div>

          <div>
            <label className="font-body text-xs text-charcoal-500 mb-1 block">
              {form.type === "IMAGE" ? "Image URL" : "Video URL (YouTube link or direct video URL)"}
            </label>
            <input
              value={form.url}
              onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
              placeholder={form.type === "IMAGE" ? "https://res.cloudinary.com/..." : "https://youtube.com/watch?v=..."}
              required className="input-base"
            />
          </div>

          <div>
            <label className="font-body text-xs text-charcoal-500 mb-1 block">Link (optional — where to go on click)</label>
            <input value={form.link} onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))} placeholder="https://..." className="input-base" />
          </div>

          <div>
            <label className="font-body text-xs text-charcoal-500 mb-1 block">Caption (optional)</label>
            <input value={form.caption} onChange={(e) => setForm((f) => ({ ...f, caption: e.target.value }))} placeholder="Caption text..." className="input-base" />
          </div>

          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 py-2.5">
            <Plus size={15} /> {saving ? "Adding..." : "Add Post"}
          </button>
        </form>
      </div>

      {/* Posts grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {posts.map((post) => (
          <div key={post.id} className={`bg-white rounded-2xl overflow-hidden shadow-soft border ${post.isActive ? "border-charcoal-50" : "border-red-100 opacity-60"}`}>
            {/* Preview */}
            <div className="aspect-square bg-cream-100 relative">
              {post.type === "VIDEO" ? (
                <iframe
                  src={getVideoEmbed(post.url)}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <img src={post.url} alt={post.caption || ""} className="w-full h-full object-cover" />
              )}
              <div className="absolute top-2 left-2">
                {post.type === "VIDEO"
                  ? <span className="bg-black/70 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1"><Video size={10} /> Video</span>
                  : <span className="bg-black/70 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1"><Image size={10} /> Image</span>
                }
              </div>
            </div>

            {/* Actions */}
            <div className="p-3 flex items-center justify-between gap-2">
              {post.caption && <p className="font-body text-xs text-charcoal-500 truncate flex-1">{post.caption}</p>}
              <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                {post.link && (
                  <a href={post.link} target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded-lg bg-charcoal-50 flex items-center justify-center text-charcoal-400 hover:text-brand-600">
                    <ExternalLink size={12} />
                  </a>
                )}
                <button onClick={() => handleToggle(post)} className="w-7 h-7 rounded-lg bg-charcoal-50 flex items-center justify-center">
                  {post.isActive
                    ? <ToggleRight size={14} className="text-green-500" />
                    : <ToggleLeft size={14} className="text-charcoal-400" />
                  }
                </button>
                <button onClick={() => handleDelete(post.id)} disabled={deleting === post.id}
                  className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center text-red-400 hover:text-red-600 disabled:opacity-40">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {posts.length === 0 && (
          <div className="col-span-3 bg-white rounded-2xl p-10 text-center text-charcoal-400 font-body text-sm">
            No posts yet. Add your first post above.
          </div>
        )}
      </div>
    </div>
  );
}
