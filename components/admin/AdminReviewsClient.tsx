"use client";

import { useState } from "react";
import { Star, Check, X, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

interface Review {
  id: string; rating: number; title?: string | null; message: string;
  status: string; createdAt: Date;
  user: { name?: string | null; phone: string };
  product: { name: string; slug: string };
}

export default function AdminReviewsClient({ reviews: initial }: { reviews: Review[] }) {
  const [reviews, setReviews] = useState(initial);
  const [filter, setFilter] = useState<string>("PENDING");

  const moderate = async (id: string, status: "APPROVED" | "REJECTED") => {
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        setReviews((rs) => rs.map((r) => r.id === id ? { ...r, status } : r));
        toast.success(`Review ${status.toLowerCase()}`);
      }
    } catch { toast.error("Failed to update"); }
  };

  const deleteReview = async (id: string) => {
    if (!confirm("Delete this review permanently?")) return;
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setReviews((rs) => rs.filter((r) => r.id !== id));
        toast.success("Review deleted");
      }
    } catch { toast.error("Failed to delete"); }
  };

  const filtered = reviews.filter((r) => filter === "ALL" ? true : r.status === filter);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-body text-2xl font-semibold text-charcoal-900">Reviews</h1>
        <div className="flex gap-2">
          {["ALL", "PENDING", "APPROVED", "REJECTED"].map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-full font-body text-xs font-medium transition-all ${filter === s ? "bg-brand-500 text-white" : "border border-charcoal-200 text-charcoal-600 hover:border-brand-400"}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="bg-white rounded-2xl p-10 text-center text-charcoal-400 font-body text-sm">
            No reviews found
          </div>
        )}
        {filtered.map((review) => (
          <div key={review.id} className="bg-white rounded-2xl p-5 shadow-soft border border-charcoal-50">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`badge text-[11px] font-semibold ${
                    review.status === "APPROVED" ? "badge-green" :
                    review.status === "REJECTED" ? "badge-red" : "badge-gray"
                  }`}>{review.status}</span>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star key={i} size={12} className={i < review.rating ? "fill-brand-400 text-brand-400" : "text-charcoal-200"} />
                    ))}
                  </div>
                </div>
                <p className="font-body text-xs text-charcoal-400 mb-1">
                  {review.user.name || review.user.phone} → {review.product.name}
                </p>
                {review.title && <p className="font-body text-sm font-semibold text-charcoal-800">{review.title}</p>}
                <p className="font-body text-sm text-charcoal-600 mt-1">{review.message}</p>
                <p className="font-body text-xs text-charcoal-400 mt-2">{new Date(review.createdAt).toLocaleDateString("en-IN")}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                {review.status === "PENDING" && (
                  <>
                    <button onClick={() => moderate(review.id, "APPROVED")}
                      className="w-9 h-9 rounded-full bg-green-50 text-green-600 hover:bg-green-100 flex items-center justify-center transition-colors">
                      <Check size={16} />
                    </button>
                    <button onClick={() => moderate(review.id, "REJECTED")}
                      className="w-9 h-9 rounded-full bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors">
                      <X size={16} />
                    </button>
                  </>
                )}
                <button onClick={() => deleteReview(review.id)}
                  className="w-9 h-9 rounded-full bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
