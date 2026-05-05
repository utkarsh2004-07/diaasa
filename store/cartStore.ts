import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CartItem {
  id: string;
  productId: string;
  variantId: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    slug: string;
    image: string | null;
    gstPercent: number;
  };
  variant: {
    id: string;
    name: string;
    price: number;
    comparePrice?: number | null;
    stock: number;
  };
  lineTotal: number;
  gstAmount: number;
}

interface CartState {
  items: CartItem[];
  count: number;
  subtotal: number;
  totalGST: number;
  total: number;
  guestCartId: string;
  isLoading: boolean;

  addItem: (params: { productId: string; variantId: string; quantity: number }) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  fetchCart: () => Promise<void>;
  clearCart: () => void;
}

function generateGuestId() {
  return `guest_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      count: 0,
      subtotal: 0,
      totalGST: 0,
      total: 0,
      guestCartId: generateGuestId(),
      isLoading: false,

      fetchCart: async () => {
        set({ isLoading: true });
        try {
          const { guestCartId } = get();
          const res = await fetch(`/api/cart?guestId=${guestCartId}`);
          const data = await res.json();
          if (data.success) {
            set({
              items: data.data.items,
              count: data.data.count,
              subtotal: data.data.subtotal,
              totalGST: data.data.totalGST,
              total: data.data.total,
            });
          }
        } catch (err) {
          console.error("fetchCart error:", err);
        } finally {
          set({ isLoading: false });
        }
      },

      addItem: async ({ productId, variantId, quantity }) => {
        const { guestCartId } = get();
        const res = await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId, variantId, quantity, guestCartId }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error?.message || "Failed to add");
        await get().fetchCart();
      },

      removeItem: async (itemId) => {
        const res = await fetch(`/api/cart?itemId=${itemId}`, { method: "DELETE" });
        const data = await res.json();
        if (!data.success) throw new Error(data.error?.message);
        await get().fetchCart();
      },

      updateQuantity: async (itemId, quantity) => {
        const res = await fetch("/api/cart", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemId, quantity }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error?.message);
        await get().fetchCart();
      },

      clearCart: () => set({ items: [], count: 0, subtotal: 0, totalGST: 0, total: 0 }),
    }),
    {
      name: "diaasa-cart",
      partialize: (s) => ({ guestCartId: s.guestCartId }),
    }
  )
);
