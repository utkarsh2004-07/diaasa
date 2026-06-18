"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ShoppingBag,
  Heart,
  User,
  Menu,
  X,
  ChevronDown,
} from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  {
    label: "Shop",
    href: "/products",
    children: [
      { label: "All Products", href: "/products" },
      { label: "Sunscreen", href: "/products?category=sunscreen" },
      { label: "Bath Essential Range", href: "/products?category=bath-essential-range" },
    ],
  },
  { label: "Best Sellers", href: "/products?bestseller=true" },
  { label: "New Arrivals", href: "/products?new=true" },
  { label: "Offers", href: "/products?sale=true" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const cartCount = useCartStore((s) => s.count);
  const { user } = useAuthStore();
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchRef.current?.focus(), 100);
  }, [searchOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  return (
    <>
      {/* Announcement bar */}
      <div className="bg-charcoal-900 text-cream-200 text-xs font-body text-center py-2 overflow-hidden tracking-widest uppercase">
        <div className="flex whitespace-nowrap">
          <span className="marquee-track inline-flex gap-12 shrink-0">
            {[
              "Free shipping on orders above ₹500",
              "✦",
              "100% Authentic Products",
              "✦",
              "⚠️ YOUR SAFETY MATTERS — WE NEVER CALL TO ASK FOR BANK DETAILS, OTPS, OR PAYMENTS",
              "✦",
            ].map((t, i) => (
              <span key={i} className="shrink-0">{t}</span>
            ))}
          </span>
          <span className="marquee-track inline-flex gap-12 shrink-0" aria-hidden>
            {[
              "Free shipping on orders above ₹500",
              "✦",
              "100% Authentic Products",
              "✦",
              "⚠️ YOUR SAFETY MATTERS — WE NEVER CALL TO ASK FOR BANK DETAILS, OTPS, OR PAYMENTS",
              "✦",
            ].map((t, i) => (
              <span key={i} className="shrink-0">{t}</span>
            ))}
          </span>
        </div>
      </div>

      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/95 backdrop-blur-md shadow-soft border-b border-charcoal-100"
            : "bg-cream-50/90 backdrop-blur-sm"
        }`}
      >
        <div className="max-w-7xl mx-auto px-0 ">
          <div className="flex items-center justify-between h-[80px] md:h-[90px]">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 text-charcoal-700 hover:text-charcoal-900 transition-colors"
            >
              <Menu size={22} />
            </button>

            {/* Logo */}

            <Link href="/" className="flex items-center">
              <Image
                src="https://res.cloudinary.com/dqx1vrmsp/image/upload/v1776678349/WhatsApp_Image_2026-04-20_at_2.14.09_PM-removebg-preview_sfgngq.png"
                alt="Logo"
                width={320}
                height={120}
                className="h-[110px] md:h-[140px] w-auto object-contain"
                priority
                loading="eager"
              />

              <span className="hidden sm:block w-px h-10 bg-charcoal-300 " />

             <span className="hidden sm:block font-body text-xs tracking-[0.2em] text-charcoal-500 uppercase p-2">
  STORE
</span>


            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <div
                  key={link.label}
                  className="relative"
                  onMouseEnter={() =>
                    link.children && setActiveMenu(link.label)
                  }
                  onMouseLeave={() => setActiveMenu(null)}
                >
                  <Link
                    href={link.href}
                    className="flex items-center gap-1 px-4 py-2 font-body text-sm font-medium text-charcoal-700 hover:text-brand-600 transition-colors rounded-full hover:bg-cream-100"
                  >
                    {link.label}
                    {link.children && (
                      <ChevronDown
                        size={14}
                        className={`transition-transform duration-200 ${activeMenu === link.label ? "rotate-180" : ""}`}
                      />
                    )}
                  </Link>

                  {/* Dropdown */}
                  <AnimatePresence>
                    {link.children && activeMenu === link.label && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full left-0 mt-1 w-52 bg-white rounded-2xl shadow-medium border border-charcoal-100 overflow-hidden p-2"
                      >
                        {link.children.map((child) => (
                          <Link
                            key={child.label}
                            href={child.href}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-body text-charcoal-700 hover:bg-cream-100 hover:text-brand-600 transition-colors"
                          >
                            {child.label}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2.5 rounded-full text-charcoal-700 hover:text-charcoal-900 hover:bg-charcoal-50 transition-all duration-200"
              >
                <Search size={20} />
              </button>

              <Link
                href="/wishlist"
                className="p-2.5 rounded-full text-charcoal-700 hover:text-brand-500 hover:bg-cream-100 transition-all duration-200 hidden sm:flex"
              >
                <Heart size={20} />
              </Link>

              <Link
                href={user ? "/profile" : "/login"}
                className="p-2.5 rounded-full text-charcoal-700 hover:text-charcoal-900 hover:bg-charcoal-50 transition-all duration-200"
              >
                <User size={20} />
              </Link>

              <Link
                href="/cart"
                className="relative p-2.5 rounded-full text-charcoal-700 hover:text-charcoal-900 hover:bg-charcoal-50 transition-all duration-200"
              >
                <ShoppingBag size={20} />
                {cartCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 min-w-[18px] h-[18px] rounded-full bg-brand-500 text-white text-[10px] font-bold flex items-center justify-center"
                  >
                    {cartCount > 9 ? "9+" : cartCount}
                  </motion.span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Search overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-charcoal-900/60 backdrop-blur-sm"
            onClick={() => setSearchOpen(false)}
          >
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="bg-white max-w-2xl mx-auto mt-20 rounded-2xl shadow-strong overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <form
                onSubmit={handleSearch}
                className="flex items-center gap-3 p-4"
              >
                <Search size={20} className="text-charcoal-400 shrink-0" />
                <input
                  ref={searchRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for products, brands…"
                  className="flex-1 font-body text-base text-charcoal-900 bg-transparent outline-none placeholder:text-charcoal-400"
                />
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="p-2 rounded-full hover:bg-charcoal-50 text-charcoal-500 transition-colors"
                >
                  <X size={18} />
                </button>
              </form>
              <div className="px-4 pb-4">
                <p className="text-xs text-charcoal-400 font-body">
                  Popular searches
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {[
                    "Ubtan Soap",
                    "Kesar Soap",
                    "Sunscreen",
                    "Facial Bar",
                    "Sandal Soap",
                  ].map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        setSearchQuery(t);
                        router.push(`/products?q=${encodeURIComponent(t)}`);
                        setSearchOpen(false);
                      }}
                      className="px-3 py-1.5 rounded-full bg-cream-100 text-sm font-body text-charcoal-700 hover:bg-cream-200 transition-colors"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-charcoal-900/60"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 350, damping: 35 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-72 bg-white shadow-strong overflow-y-auto"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-charcoal-100">
                <Image
                  src="https://res.cloudinary.com/dqx1vrmsp/image/upload/v1776678349/WhatsApp_Image_2026-04-20_at_2.14.09_PM-removebg-preview_sfgngq.png"
                  alt="Logo"
                  width={260}
                  height={90}
                  className="h-[90px] w-auto object-contain"
                />
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-2 rounded-full hover:bg-charcoal-50"
                >
                  <X size={20} />
                </button>
              </div>
              <nav className="p-4 space-y-1">
                {NAV_LINKS.map((link) => (
                  <div key={link.label}>
                    <Link
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className="block px-4 py-3 rounded-xl font-body text-sm font-medium text-charcoal-800 hover:bg-cream-100 transition-colors"
                    >
                      {link.label}
                    </Link>
                    {link.children && (
                      <div className="pl-4 space-y-1">
                        {link.children.slice(1).map((child) => (
                          <Link
                            key={child.label}
                            href={child.href}
                            onClick={() => setMobileOpen(false)}
                            className="block px-4 py-2 rounded-xl font-body text-sm text-charcoal-500 hover:text-brand-600 hover:bg-cream-100 transition-colors"
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </nav>
              <div className="p-4 border-t border-charcoal-100 space-y-2">
                <Link
                  href={user ? "/profile" : "/login"}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-cream-100 transition-colors"
                >
                  <User size={18} className="text-charcoal-500" />
                  <span className="font-body text-sm">
                    {user ? user.name || "My Account" : "Login / Register"}
                  </span>
                </Link>
                <Link
                  href="/wishlist"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-cream-100 transition-colors"
                >
                  <Heart size={18} className="text-charcoal-500" />
                  <span className="font-body text-sm">Wishlist</span>
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}