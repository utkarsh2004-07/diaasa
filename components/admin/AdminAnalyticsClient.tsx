"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend,
} from "recharts";
import { AlertTriangle } from "lucide-react";

interface Props {
  data: {
    monthly: Array<{ month: string; revenue: number; orders: number }>;
    topProducts: Array<{ productId: string; name: string; _sum: { total: number | null; quantity: number | null }; _count: number }>;
    statusBreakdown: Array<{ status: string; _count: number }>;
    lowStock: Array<{ id: string; name: string; stock: number; product: { name: string } }>;
    userGrowth: Array<{ month: string; users: number }>;
  };
}

const PIE_COLORS = ["#e08a28", "#1a1714", "#8a847d", "#cac5be", "#e5e1dc", "#f5f3f0"];

export default function AdminAnalyticsClient({ data }: Props) {
  const { monthly, topProducts, statusBreakdown, lowStock, userGrowth } = data;

  return (
    <div className="space-y-6">
      <h1 className="font-body text-2xl font-semibold text-charcoal-900">Analytics</h1>

      {/* Revenue + Orders charts */}
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl p-5 shadow-soft border border-charcoal-50">
          <h2 className="font-body text-sm font-semibold text-charcoal-700 mb-4">Monthly Revenue (₹)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f3f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fontFamily: "var(--font-body)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fontFamily: "var(--font-body)" }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}`} />
              <Tooltip
                contentStyle={{ fontFamily: "var(--font-body)", fontSize: 12, borderRadius: 12, border: "1px solid #e5e1dc" }}
                formatter={(v: number) => [`₹${v.toLocaleString("en-IN")}`, "Revenue"]}
              />
              <Bar dataKey="revenue" fill="#e08a28" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-soft border border-charcoal-50">
          <h2 className="font-body text-sm font-semibold text-charcoal-700 mb-4">Monthly Orders</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f3f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fontFamily: "var(--font-body)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fontFamily: "var(--font-body)" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontFamily: "var(--font-body)", fontSize: 12, borderRadius: 12, border: "1px solid #e5e1dc" }} />
              <Line type="monotone" dataKey="orders" stroke="#1a1714" strokeWidth={2.5} dot={{ fill: "#1a1714", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* User growth + Order status */}
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl p-5 shadow-soft border border-charcoal-50">
          <h2 className="font-body text-sm font-semibold text-charcoal-700 mb-4">New Users per Month</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={userGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f3f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fontFamily: "var(--font-body)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fontFamily: "var(--font-body)" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontFamily: "var(--font-body)", fontSize: 12, borderRadius: 12, border: "1px solid #e5e1dc" }} />
              <Bar dataKey="users" fill="#413d38" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-soft border border-charcoal-50">
          <h2 className="font-body text-sm font-semibold text-charcoal-700 mb-4">Order Status Distribution</h2>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={statusBreakdown.map((s) => ({ name: s.status, value: s._count }))}
                dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}>
                {statusBreakdown.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontFamily: "var(--font-body)", fontSize: 12, borderRadius: 12, border: "1px solid #e5e1dc" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Products + Low Stock */}
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl shadow-soft border border-charcoal-50 overflow-hidden">
          <div className="px-5 py-4 border-b border-charcoal-50">
            <h2 className="font-body text-sm font-semibold text-charcoal-700">Top Products by Revenue</h2>
          </div>
          <div className="divide-y divide-charcoal-50">
            {topProducts.map((p, i) => (
              <div key={p.productId} className="flex items-center gap-3 px-5 py-3.5">
                <span className="font-body text-sm font-bold text-charcoal-300 w-6">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-body text-sm font-medium text-charcoal-800 truncate">{p.name}</p>
                  <p className="font-body text-xs text-charcoal-400">{p._sum.quantity || 0} units sold</p>
                </div>
                <p className="font-body text-sm font-semibold text-charcoal-900 shrink-0">
                  ₹{(p._sum.total || 0).toLocaleString("en-IN")}
                </p>
              </div>
            ))}
            {topProducts.length === 0 && (
              <p className="px-5 py-6 text-center font-body text-sm text-charcoal-400">No sales data yet</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-soft border border-charcoal-50 overflow-hidden">
          <div className="px-5 py-4 border-b border-charcoal-50 flex items-center gap-2">
            <AlertTriangle size={15} className="text-amber-500" />
            <h2 className="font-body text-sm font-semibold text-charcoal-700">Low Stock Alert</h2>
          </div>
          <div className="divide-y divide-charcoal-50">
            {lowStock.map((v) => (
              <div key={v.id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="font-body text-sm font-medium text-charcoal-800">{v.product.name}</p>
                  <p className="font-body text-xs text-charcoal-400">{v.name}</p>
                </div>
                <span className={`font-body text-sm font-bold ${v.stock === 0 ? "text-red-500" : "text-amber-500"}`}>
                  {v.stock === 0 ? "Out of stock" : `${v.stock} left`}
                </span>
              </div>
            ))}
            {lowStock.length === 0 && (
              <p className="px-5 py-6 text-center font-body text-sm text-green-600">✓ All products well stocked</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
