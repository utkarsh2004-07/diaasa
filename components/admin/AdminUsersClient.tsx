"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  _count: { orders: number };
};

export default function AdminUsersClient({
  users,
  currentUserId,
}: {
  users: User[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function toggleRole(user: User) {
    const newRole = user.role === "ADMIN" ? "CUSTOMER" : "ADMIN";
    setLoading(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) router.refresh();
      else {
        const data = await res.json();
        alert(data.message || "Failed to update role");
      }
    } finally {
      setLoading(null);
    }
  }

  return (
    <tbody className="divide-y divide-charcoal-50">
      {users.map((user) => (
        <tr key={user.id} className="hover:bg-cream-50 transition-colors">
          <td className="px-5 py-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
                <span className="font-body text-xs font-bold text-brand-700">
                  {user.name?.charAt(0) || user.phone.charAt(0)}
                </span>
              </div>
              <div>
                <p className="font-medium text-charcoal-800">{user.name || "—"}</p>
                {user.email && <p className="text-xs text-charcoal-400">{user.email}</p>}
              </div>
            </div>
          </td>
          <td className="px-5 py-3.5 text-charcoal-700 font-mono text-xs">{user.phone}</td>
          <td className="px-5 py-3.5">
            <span className={`badge text-[11px] font-semibold ${
              user.role === "SUPER_ADMIN" ? "bg-red-100 text-red-700" :
              user.role === "ADMIN" ? "bg-purple-100 text-purple-700" :
              user.role === "MANAGER" ? "bg-blue-100 text-blue-700" : "badge-gray"
            }`}>{user.role}</span>
          </td>
          <td className="px-5 py-3.5 text-right font-medium text-charcoal-700">{user._count.orders}</td>
          <td className="px-5 py-3.5 text-charcoal-400 text-xs">
            {new Date(user.createdAt).toLocaleDateString("en-IN")}
          </td>
          <td className="px-5 py-3.5">
            <span className={`badge text-[11px] ${user.isActive ? "badge-green" : "badge-red"}`}>
              {user.isActive ? "Active" : "Banned"}
            </span>
          </td>
          <td className="px-5 py-3.5">
            {user.role !== "SUPER_ADMIN" && user.id !== currentUserId && (
              <button
                onClick={() => toggleRole(user)}
                disabled={loading === user.id}
                className={`text-[11px] font-semibold px-3 py-1 rounded-full border transition-colors ${
                  user.role === "ADMIN"
                    ? "border-purple-300 text-purple-700 hover:bg-purple-50"
                    : "border-charcoal-300 text-charcoal-600 hover:bg-charcoal-50"
                } disabled:opacity-50`}
              >
                {loading === user.id ? "…" : user.role === "ADMIN" ? "Remove Admin" : "Make Admin"}
              </button>
            )}
          </td>
        </tr>
      ))}
    </tbody>
  );
}
