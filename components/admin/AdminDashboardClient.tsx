"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import {
  TrendingUp, TrendingDown, ShoppingCart, DollarSign,
  Users, Package, AlertTriangle, Star,
} from "lucide-react";
import Link from "next/link";

interface Props {
  data: {
    stats: {
      totalOrders: number; monthOrders: number; orderGrowth: number;
      totalRevenue: number; monthRevenue: number;
      totalUsers: number; newUsers: number;
      totalProducts: number; lowStockCount: number; pendingReviews: number;
    };
    recentOrders: Array<{
      id: string; orderNumber: string; status: string;
      total: number; createdAt: string;
      user: { name?: string | null; phone: string };
    }>;
    dailySales: Array<{ date: string; revenue: number; orders: number }>;
  };
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  PROCESSING: "bg-purple-100 text-purple-700",
  SHIPPED: "bg-indigo-100 text-indigo-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export default function AdminDashboardClient({ data }: Props) {
  const { stats, recentOrders, dailySales } = data;
  const [dateLabel, setDateLabel] = useState("");
  useEffect(() => {
    setDateLabel(new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }));
  }, []);

  const STAT_CARDS = [
    {
      title: "Total Orders", value: stats.totalOrders.toLocaleString(),
      sub: `${stats.monthOrders} this month`,
      icon: ShoppingCart, color: "bg-blue-50 text-blue-600",
      trend: stats.orderGrowth, trendLabel: "vs last month",
    },
    {
      title: "Total Revenue", value: `₹${(stats.totalRevenue / 1000).toFixed(1)}K`,
      sub: `₹${stats.monthRevenue.toLocaleString("en-IN")} this month`,
      icon: DollarSign, color: "bg-green-50 text-green-600",
    },
    {
      title: "Total Users", value: stats.totalUsers.toLocaleString(),
      sub: `${stats.newUsers} new this month`,
      icon: Users, color: "bg-purple-50 text-purple-600",
    },
    {
      title: "Products", value: stats.totalProducts.toLocaleString(),
      sub: `${stats.lowStockCount} low stock`,
      icon: Package, color: "bg-orange-50 text-orange-600",
      alert: stats.lowStockCount > 0,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-body text-2xl font-semibold text-charcoal-900">Dashboard</h1>
          <p className="font-body text-sm text-charcoal-400 mt-0.5">{dateLabel}</p>
        </div>
        {stats.pendingReviews > 0 && (
          <Link href="/admin/reviews" className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 font-body text-xs font-medium px-3 py-2 rounded-lg hover:bg-amber-100 transition-colors">
            <Star size={14} />
            {stats.pendingReviews} pending reviews
          </Link>
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map(({ title, value, sub, icon: Icon, color, trend, trendLabel, alert }, i) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="bg-white rounded-2xl p-5 shadow-soft border border-charcoal-50"
          >
            <div className="flex items-start justify-between">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                <Icon size={18} />
              </div>
              {alert && <AlertTriangle size={16} className="text-amber-500" />}
            </div>
            <p className="font-body text-2xl font-semibold text-charcoal-900 mt-3">{value}</p>
            <p className="font-body text-xs font-medium text-charcoal-500 mt-0.5">{title}</p>
            <div className="flex items-center gap-1.5 mt-2">
              <p className="font-body text-xs text-charcoal-400">{sub}</p>
              {trend !== undefined && (
                <span className={`flex items-center gap-0.5 text-[11px] font-semibold ${trend >= 0 ? "text-green-600" : "text-red-500"}`}>
                  {trend >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                  {Math.abs(trend)}%
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Revenue chart */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl p-6 shadow-soft border border-charcoal-50"
      >
        <h2 className="font-body text-base font-semibold text-charcoal-800 mb-5">Revenue – Last 7 Days</h2>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={dailySales} margin={{ top: 10, right: 10, bottom: 0, left: 10 }}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#e08a28" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#e08a28" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f5f3f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fontFamily: "var(--font-body)" }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 11, fontFamily: "var(--font-body)" }}
              axisLine={false}
              tickLine={false}
              domain={[0, (dataMax: number) => Math.max(dataMax * 1.2, 100)]}
              tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(1)}K` : v}`}
            />
            <Tooltip
              contentStyle={{ fontFamily: "var(--font-body)", fontSize: 12, borderRadius: 12, border: "1px solid #e5e1dc" }}
              formatter={(value: number) => [`₹${value.toLocaleString("en-IN")}`, "Revenue"]}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#e08a28"
              strokeWidth={2.5}
              fill="url(#revGrad)"
              dot={{ fill: "#e08a28", r: 4, strokeWidth: 0 }}
              activeDot={{ r: 6, fill: "#e08a28" }}
              isAnimationActive={true}
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Recent orders — card layout on mobile, table on desktop */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl shadow-soft border border-charcoal-50 overflow-hidden"
      >
        <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-charcoal-50">
          <h2 className="font-body text-base font-semibold text-charcoal-800">Recent Orders</h2>
          <Link href="/admin/orders" className="font-body text-xs text-brand-600 hover:underline">View all</Link>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-charcoal-50">
          {recentOrders.map((order) => (
            <Link key={order.id} href={`/admin/orders/${order.id}`} className="flex items-center justify-between px-4 py-3.5 hover:bg-cream-50 transition-colors">
              <div>
                <p className="font-body text-sm font-medium text-brand-600">{order.orderNumber}</p>
                <p className="font-body text-xs text-charcoal-400 mt-0.5">{order.user.name || order.user.phone}</p>
              </div>
              <div className="text-right">
                <span className={`badge text-[10px] font-semibold ${STATUS_COLORS[order.status] || "bg-gray-100 text-gray-700"}`}>{order.status}</span>
                <p className="font-body text-sm font-semibold text-charcoal-900 mt-1">₹{order.total.toLocaleString("en-IN")}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="bg-charcoal-50 text-charcoal-500 text-xs uppercase tracking-wider">
                <th className="text-left px-6 py-3">Order</th>
                <th className="text-left px-6 py-3">Customer</th>
                <th className="text-left px-6 py-3">Status</th>
                <th className="text-right px-6 py-3">Total</th>
                <th className="text-left px-6 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal-50">
              {recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-cream-50 transition-colors">
                  <td className="px-6 py-3.5">
                    <Link href={`/admin/orders/${order.id}`} className="font-medium text-brand-600 hover:underline">
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-6 py-3.5 text-charcoal-700">{order.user.name || order.user.phone}</td>
                  <td className="px-6 py-3.5">
                    <span className={`badge text-[11px] font-semibold ${STATUS_COLORS[order.status] || "bg-gray-100 text-gray-700"}`}>{order.status}</span>
                  </td>
                  <td className="px-6 py-3.5 text-right font-semibold text-charcoal-900">₹{order.total.toLocaleString("en-IN")}</td>
                  <td className="px-6 py-3.5 text-charcoal-400 text-xs">{new Date(order.createdAt).toLocaleDateString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
