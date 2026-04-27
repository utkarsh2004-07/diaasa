"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Package, ShoppingCart, Users, Tag, Star,
  Image, FileText, Settings, BarChart2, FolderOpen, Layers,
  LogOut, Menu, X, Instagram,
} from "lucide-react";

const NAV = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Categories", href: "/admin/categories", icon: FolderOpen },
  { label: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Reviews", href: "/admin/reviews", icon: Star },
  { label: "Coupons", href: "/admin/coupons", icon: Tag },
  { label: "Banners", href: "/admin/banners", icon: Image },
  { label: "Social Posts", href: "/admin/social", icon: Instagram },
  { label: "Pages", href: "/admin/pages", icon: FileText },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart2 },
  { label: "Inventory", href: "/admin/inventory", icon: Layers },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const SidebarContent = () => (
    <>
      <div className="p-5 border-b border-charcoal-800 flex items-center justify-between">
        <div>
          <span className="font-display text-2xl font-light tracking-[0.25em] text-white">LUXE</span>
          <p className="text-[10px] tracking-widest text-charcoal-500 uppercase mt-0.5">Admin Panel</p>
        </div>
        <button onClick={() => setSidebarOpen(false)} className="md:hidden text-charcoal-400 hover:text-white">
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all group ${
                active
                  ? "bg-charcoal-800 text-white"
                  : "text-charcoal-300 hover:bg-charcoal-800 hover:text-white"
              }`}
            >
              <Icon size={16} className={active ? "text-brand-400" : "text-charcoal-500 group-hover:text-brand-400 transition-colors"} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-charcoal-800">
        <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-charcoal-400 hover:text-white hover:bg-charcoal-800 transition-all">
          <LogOut size={16} /> Back to Store
        </Link>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-charcoal-50 font-body">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 bg-charcoal-900 flex-col shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-64 bg-charcoal-900 flex flex-col h-full z-10">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-charcoal-100 px-4 md:px-6 py-3.5 flex items-center justify-between shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-2 rounded-lg text-charcoal-600 hover:bg-charcoal-50"
          >
            <Menu size={20} />
          </button>
          <div className="md:flex-1" />
          <div className="flex items-center gap-3">
            <span className="font-body text-sm text-charcoal-500 hidden sm:block">Admin</span>
            <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center">
              <span className="font-body text-xs font-bold text-brand-700">A</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
