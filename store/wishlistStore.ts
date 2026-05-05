import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WishlistState {
  ids: string[];
  toggle: (productId: string) => Promise<void>;
  isWishlisted: (productId: string) => boolean;
  fetchWishlist: () => Promise<void>;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      ids: [],

      isWishlisted: (productId) => get().ids.includes(productId),

      toggle: async (productId) => {
        const isIn = get().isWishlisted(productId);
        // Optimistic update
        set((s) => ({
          ids: isIn ? s.ids.filter((id) => id !== productId) : [...s.ids, productId],
        }));
        try {
          if (isIn) {
            await fetch(`/api/wishlist?productId=${productId}`, { method: "DELETE" });
          } else {
            await fetch("/api/wishlist", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ productId }),
            });
          }
        } catch {
          // Revert on error
          set((s) => ({
            ids: isIn ? [...s.ids, productId] : s.ids.filter((id) => id !== productId),
          }));
        }
      },

      fetchWishlist: async () => {
        try {
          const res = await fetch("/api/wishlist");
          const data = await res.json();
          if (data.success) {
            set({ ids: data.data.items.map((i: { productId: string }) => i.productId) });
          }
        } catch {}
      },
    }),
    { name: "diaasa-wishlist", partialize: (s) => ({ ids: s.ids }) }
  )
);
