"use client";

import { useState, useEffect } from "react";
import { Star, X } from "lucide-react";
import toast from "react-hot-toast";
import { useReviewStore } from "@/store/reviewStore";
import ImageUpload from "@/components/ImageUpload";
import Image from "next/image";

interface ReviewFormProps {
  productId: string;
  productName: string;
  onReviewSubmitted?: () => void;
}

export default function ReviewForm({ productId, productName, onReviewSubmitted }: ReviewFormProps) {
  const [canReview, setCanReview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const { clearCache } = useReviewStore();

  useEffect(() => {
    checkReviewEligibility();
  }, [productId]);

  const checkReviewEligibility = async () => {
    try {
      const res = await fetch(`/api/reviews/can-review/${productId}`);
      const data = await res.json();
      if (data.success) {
        setCanReview(data.data.canReview);
      }
    } catch (error) {
      console.error("Error checking review eligibility:", error);
    } finally {
      setLoading(false);
    }
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }
    if (message.length < 10) {
      toast.error("Review message must be at least 10 characters");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          rating,
          title: title.trim() || undefined,
          message: message.trim(),
          images: images.length > 0 ? JSON.stringify(images) : undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Review submitted successfully!");
        setShowForm(false);
        setCanReview(false);
        clearCache(productId); // Clear cache to refresh reviews
        onReviewSubmitted?.();
      } else {
        toast.error(data.error?.message || "Failed to submit review");
      }
    } catch (error) {
      toast.error("Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-cream-50 rounded-xl p-4 animate-pulse">
        <div className="h-4 bg-cream-200 rounded w-1/3"></div>
      </div>
    );
  }

  if (!canReview) return null;

  return (
    <div className="bg-cream-50 rounded-xl p-4 border border-cream-200">
      {!showForm ? (
        <div className="text-center">
          <p className="font-body text-sm text-charcoal-600 mb-3">
            How was your experience with <span className="font-semibold">{productName}</span>?
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary text-sm py-2 px-4"
          >
            Write a Review
          </button>
        </div>
      ) : (
        <form onSubmit={submitReview} className="space-y-4">
          <div>
            <label className="block font-body text-sm font-medium text-charcoal-700 mb-2">
              Rating *
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-colors"
                >
                  <Star
                    size={24}
                    className={`${
                      star <= (hoverRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-charcoal-300"
                    } transition-colors`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-body text-sm font-medium text-charcoal-700 mb-2">
              Title (Optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              className="w-full px-3 py-2 border border-charcoal-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              placeholder="Brief summary of your review"
            />
          </div>

          <div>
            <label className="block font-body text-sm font-medium text-charcoal-700 mb-2">
              Review *
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              minLength={10}
              maxLength={1000}
              rows={4}
              className="w-full px-3 py-2 border border-charcoal-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
              placeholder="Share your experience with this product..."
              required
            />
            <p className="text-xs text-charcoal-400 mt-1">
              {message.length}/1000 characters (minimum 10)
            </p>
          </div>

          <div>
            <label className="block font-body text-sm font-medium text-charcoal-700 mb-2">
              Add Photos (Optional)
            </label>
            <div className="flex flex-wrap gap-2">
              {images.map((url, i) => (
                <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden bg-cream-100 group">
                  <Image src={url} alt={`review-img-${i}`} fill className="object-cover" sizes="80px" />
                  <button
                    type="button"
                    onClick={() => setImages((imgs) => imgs.filter((_, idx) => idx !== i))}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
              {images.length < 3 && (
                <ImageUpload
                  folder="diaasa/reviews"
                  label="Add Photo"
                  onUpload={(url) => setImages((imgs) => [...imgs, url])}
                />
              )}
            </div>
            <p className="text-xs text-charcoal-400 mt-1">Max 3 photos, 5MB each</p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="btn-outline flex-1 text-sm py-2"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1 text-sm py-2"
              disabled={submitting || rating === 0 || message.length < 10}
            >
              {submitting ? "Submitting..." : "Submit Review"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}