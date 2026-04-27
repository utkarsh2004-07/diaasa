"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { XCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function CancelOrderButton({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast.success("Order cancelled successfully");
        router.refresh();
      } else {
        toast.error(data.error?.message || "Cannot cancel this order");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCancel}
      disabled={loading}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 font-body text-sm font-medium transition-all disabled:opacity-50"
    >
      <XCircle size={14} />
      {loading ? "Cancelling..." : "Cancel Order"}
    </button>
  );
}
