"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Tag, Copy, Check } from "lucide-react";
import toast from "react-hot-toast";

interface Coupon {
  code: string;
  type: string;
  value: number;
  description?: string | null;
  minCartValue: number;
  maxDiscount?: number | null;
}

const BG_COLORS = [
  "from-amber-50 to-yellow-100 border-amber-200",
  "from-rose-50 to-pink-100 border-rose-200",
  "from-emerald-50 to-green-100 border-emerald-200",
  "from-violet-50 to-purple-100 border-violet-200",
];

export function CouponStrip({ coupons }: { coupons: Coupon[] }) {
  const [copied, setCopied] = useState<string | null>(null);

  if (!coupons.length) return null;

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(code);
      toast.success(`Coupon "${code}" copied!`);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  return (
    <section className="py-10 md:py-12 bg-cream-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-7"
        >
          <p className="font-body text-xs tracking-widest uppercase text-brand-600 mb-2">Exclusive Deals</p>
          <h2 className="font-display text-2xl md:text-3xl font-light text-charcoal-900">Offers & Coupons</h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {coupons.map((coupon, i) => (
            <motion.div
              key={coupon.code}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className={`relative bg-gradient-to-br ${BG_COLORS[i % BG_COLORS.length]} border rounded-2xl p-5 overflow-hidden`}
            >
              {/* Decorative circle */}
              <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/30" />
              <div className="absolute -right-2 -bottom-8 w-20 h-20 rounded-full bg-white/20" />

              {/* Tag icon */}
              <div className="w-9 h-9 rounded-full bg-white/70 flex items-center justify-center mb-3">
                <Tag size={16} className="text-charcoal-700" />
              </div>

              {/* Offer text */}
              <p className="font-body text-xs text-charcoal-500 mb-1 leading-snug">
                {coupon.description || (coupon.type === "PERCENTAGE"
                  ? `Get ${coupon.value}% off`
                  : `Flat ₹${coupon.value} off`)}
              </p>

              {/* Min cart */}
              {coupon.minCartValue > 0 && (
                <p className="font-body text-[10px] text-charcoal-400 mb-3">
                  On orders above ₹{coupon.minCartValue}
                </p>
              )}

              {/* Coupon code + copy */}
              <div className="flex items-center gap-2 mt-auto">
                <div className="flex-1 border border-dashed border-charcoal-300 rounded-lg px-3 py-1.5 bg-white/60">
                  <span className="font-body text-sm font-bold text-charcoal-800 tracking-widest">
                    {coupon.code}
                  </span>
                </div>
                <button
                  onClick={() => handleCopy(coupon.code)}
                  className="w-8 h-8 rounded-lg bg-white/80 hover:bg-white flex items-center justify-center transition-colors shrink-0 shadow-sm"
                >
                  {copied === coupon.code
                    ? <Check size={14} className="text-green-600" />
                    : <Copy size={14} className="text-charcoal-600" />
                  }
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
