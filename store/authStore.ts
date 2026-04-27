import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: string;
  phone: string;
  name?: string | null;
  email?: string | null;
  avatar?: string | null;
  role: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,

      setUser: (user) => set({ user }),

      logout: async () => {
        try {
          await fetch("/api/auth/logout", { method: "POST" });
        } catch {}
        set({ user: null });
        window.location.href = "/";
      },
    }),
    {
      name: "luxe-auth",
      partialize: (s) => ({ user: s.user }),
    }
  )
);
