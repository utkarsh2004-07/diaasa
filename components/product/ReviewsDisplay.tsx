"use client";

import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { useReviewStore } from "@/store/reviewStore";

interface ReviewsDisplayProps {
  productId: string;
  showTitle?: boolean;
}

export default function ReviewsDisplay({ productId, showTitle = true }: ReviewsDisplayProps) {
  const [reviewData, setReviewData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getReviews } = useReviewStore();

  useEffect(() => {
    loadReviews();
  }, [productId]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getReviews(productId);
      setReviewData(data);
    } catch (err) {
      setError("Failed to load reviews");
      console.error("Error loading reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {showTitle && <div className="h-6 bg-cream-200 rounded w-32 animate-pulse"></div>}
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white p-4 rounded-xl animate-pulse">
            <div className="flex gap-3">
              <div className="w-10 h-10 bg-cream-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-cream-200 rounded w-1/4"></div>
                <div className="h-3 bg-cream-200 rounded w-full"></div>
                <div className="h-3 bg-cream-200 rounded w-3/4"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-charcoal-500 text-sm">{error}</p>
        <button
          onClick={loadReviews}
          className="btn-outline text-sm mt-2"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!reviewData || reviewData.totalCount === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-charcoal-500 text-sm">No reviews yet. Be the first to review!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showTitle && (
        <div className="flex items-center justify-between">
          <h3 className="font-display text-xl font-light text-charcoal-900">
            Reviews ({reviewData.totalCount})
          </h3>
          <div className="flex items-center gap-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={16}
                  className={`${
                    star <= Math.round(reviewData.avgRating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-charcoal-300"
                  }`}
                />
              ))}
            </div>
            <span className="font-body text-sm text-charcoal-600">
              {reviewData.avgRating.toFixed(1)}
            </span>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {reviewData.reviews.map((review: any) => (
          <div key={review.id} className="bg-white rounded-xl p-4 shadow-soft border border-charcoal-50">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center shrink-0">
                {review.user.avatar ? (
                  <img
                    src={review.user.avatar}
                    alt={review.user.name || "User"}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-brand-600 font-semibold text-sm">
                    {(review.user.name || "U").charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-body text-sm font-semibold text-charcoal-800">
                    {review.user.name || "Anonymous"}
                  </p>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={12}
                        className={`${
                          star <= review.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-charcoal-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                {review.title && (
                  <p className="font-body text-sm font-medium text-charcoal-700 mb-1">
                    {review.title}
                  </p>
                )}
                <p className="font-body text-sm text-charcoal-600 leading-relaxed">
                  {review.message}
                </p>
                <p className="font-body text-xs text-charcoal-400 mt-2">
                  {new Date(review.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}