import Link from "next/link";
import Image from "next/image";
import { Instagram, Facebook, Linkedin } from "lucide-react";

const links = {
  "Quick Links": [
    { label: "About Us", href: "/pages/about" },
    { label: "Blog", href: "/blog" },
    { label: "Lab Certificate", href: "/lab-certificate" },
    { label: "Careers", href: "/pages/careers" },
  ],
  "Customer Care": [
    { label: "Track Order", href: "/orders" },
    { label: "Shipping Policy", href: "/pages/shipping" },
    { label: "Refund Policy", href: "/pages/refund" },
    { label: "Contact Us", href: "/contact" },
  ],
  "Legal": [
    { label: "Privacy Policy", href: "/pages/privacy" },
    { label: "Terms & Conditions", href: "/pages/terms" },
    { label: "Cookie Policy", href: "/pages/cookies" },
    { label: "Disclaimer", href: "/pages/disclaimer" },
  ],
};

const social = [
  { icon: Instagram, href: "https://www.instagram.com/diaasabeauty", label: "Instagram" },
  { icon: Facebook, href: "https://www.facebook.com/people/Diaasa-Skin-Bath-Luxury/61579664244903/", label: "Facebook" },
  { icon: Linkedin, href: "https://www.linkedin.com/in/diaasa-skin-and-bath-luxury-%F0%9F%8C%BF-8b0355363/", label: "LinkedIn" },
];

export default function Footer() {
  return (
    <footer className="bg-charcoal-900 text-cream-200">
      {/* Top section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="https://res.cloudinary.com/dqx1vrmsp/image/upload/v1776678349/WhatsApp_Image_2026-04-20_at_2.14.09_PM-removebg-preview_sfgngq.png"
                alt="Logo"
                width={180}
                height={80}
                className="h-[110px] md:h-[140px] w-auto object-contain"
              />
              <span className="w-px h-6 bg-charcoal-600" />
              <span className="font-body text-xs tracking-[0.3em] text-charcoal-400 uppercase">STORE</span>
            </Link>
            <p className="mt-4 font-body text-sm text-charcoal-300 leading-relaxed max-w-xs">
              Premium beauty and skincare products crafted with the finest ingredients.
              Your daily ritual, elevated.
            </p>
            {/* Social */}
            <div className="flex items-center gap-3 mt-6">
              {social.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full border border-charcoal-700 flex items-center justify-center text-charcoal-400 hover:border-brand-500 hover:text-brand-400 transition-all duration-200"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
            {/* Newsletter */}
            {/* <div className="mt-6">
              <p className="font-body text-xs text-charcoal-400 uppercase tracking-widest mb-3">Newsletter</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="flex-1 px-4 py-2.5 rounded-full bg-charcoal-800 border border-charcoal-700 text-sm font-body text-white placeholder:text-charcoal-500 focus:outline-none focus:border-brand-500 transition-colors"
                />
                <button className="px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium font-body rounded-full transition-colors whitespace-nowrap">
                  Subscribe
                </button>
              </div>
            </div> */}
          </div>

          {/* Links */}
          {Object.entries(links).map(([title, items]) => (
            <div key={title}>
              <h4 className="font-body text-xs font-semibold tracking-widest uppercase text-charcoal-400 mb-4">
                {title}
              </h4>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="font-body text-sm text-charcoal-300 hover:text-brand-400 transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-charcoal-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-body text-xs text-charcoal-500">
            © {new Date().getFullYear()} Diaasa Store. All rights reserved.
          </p>
          <div className="flex items-center gap-3">
            {["visa", "mastercard", "upi", "razorpay"].map((m) => (
              <span
                key={m}
                className="font-body text-[10px] text-charcoal-600 border border-charcoal-700 px-2 py-1 rounded uppercase tracking-wider"
              >
                {m}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}