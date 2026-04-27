import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const { page = "1", q } = await searchParams;
  const pg = Math.max(1, Number(page));
  const limit = 20;
  const where = q
    ? { OR: [{ phone: { contains: q } }, { name: { contains: q } }, { email: { contains: q } }] }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: { _count: { select: { orders: true } } },
      orderBy: { createdAt: "desc" },
      skip: (pg - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-body text-2xl font-semibold text-charcoal-900">Users</h1>
        <span className="font-body text-sm text-charcoal-400">{total} total</span>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-soft border border-charcoal-50">
        <form className="flex gap-3">
          <input name="q" defaultValue={q} placeholder="Search by phone, name, email…" className="input-base max-w-sm py-2 text-sm" />
          <button type="submit" className="btn-primary py-2 px-4 text-sm">Search</button>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-soft border border-charcoal-50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="bg-charcoal-50 text-charcoal-500 text-xs uppercase tracking-wider">
                <th className="text-left px-5 py-3">User</th>
                <th className="text-left px-5 py-3">Phone</th>
                <th className="text-left px-5 py-3">Role</th>
                <th className="text-right px-5 py-3">Orders</th>
                <th className="text-left px-5 py-3">Joined</th>
                <th className="text-left px-5 py-3">Status</th>
              </tr>
            </thead>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {total > limit && (
          <div className="flex justify-center gap-2 p-4 border-t border-charcoal-50">
            {Array.from({ length: Math.ceil(total / limit) }, (_, i) => (
              <Link key={i} href={`?page=${i + 1}${q ? `&q=${q}` : ""}`}
                className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-body transition-all ${pg === i + 1 ? "bg-brand-500 text-white" : "border border-charcoal-200 text-charcoal-600 hover:border-brand-400"}`}>
                {i + 1}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
