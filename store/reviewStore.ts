import { create } from "zustand";

interface Review {
  id: string;
  rating: number;
  title?: string;
  message: string;
  createdAt: string;
  user: {
    name?: string;
    avatar?: string;
  };
}

interface ReviewData {
  reviews: Review[];
  avgRating: number;
  totalCount: number;
  distribution: Record<number, number>;
}

interface ReviewStore {
  cache: Record<string, ReviewData>;
  loading: Record<string, boolean>;
  getReviews: (productId: string) => Promise<ReviewData>;
  clearCache: (productId?: string) => void;
}

export const useReviewStore = create<ReviewStore>((set, get) => ({
  cache: {},
  loading: {},

  getReviews: async (productId: string) => {
    const { cache, loading } = get();
    
    // Return cached data if available
    if (cache[productId]) {
      return cache[productId];
    }

    // Prevent duplicate requests
    if (loading[productId]) {
      return new Promise((resolve) => {
        const checkCache = () => {
          const currentCache = get().cache;
          if (currentCache[productId]) {
            resolve(currentCache[productId]);
          } else {
            setTimeout(checkCache, 100);
          }
        };
        checkCache();
      });
    }

    // Set loading state
    set((state) => ({
      loading: { ...state.loading, [productId]: true },
    }));

    try {
      const res = await fetch(`/api/reviews?productId=${productId}`);
      const data = await res.json();
      
      if (data.success) {
        const reviewData = data.data;
        
        // Cache the data
        set((state) => ({
          cache: { ...state.cache, [productId]: reviewData },
          loading: { ...state.loading, [productId]: false },
        }));
        
        return reviewData;
      } else {
        throw new Error(data.error?.message || "Failed to fetch reviews");
      }
    } catch (error) {
      set((state) => ({
        loading: { ...state.loading, [productId]: false },
      }));
      throw error;
    }
  },

  clearCache: (productId?: string) => {
    if (productId) {
      set((state) => {
        const newCache = { ...state.cache };
        delete newCache[productId];
        return { cache: newCache };
      });
    } else {
      set({ cache: {} });
    }
  },
}));