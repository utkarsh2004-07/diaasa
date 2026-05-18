import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import "@/styles/globals.css";
import { Toaster } from "react-hot-toast";
import StoreInitializer from "@/components/StoreInitializer";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Diaasa Store — Premium Beauty & Skincare", template: "%s | Diaasa Store" },
  description: "Discover premium beauty, skincare and wellness products curated for you.",
  keywords: ["beauty", "skincare", "wellness", "premium", "luxury"],
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: "Diaasa Store",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${dmSans.variable}`}>
      <body className="font-body bg-cream-50 text-charcoal-900 antialiased">
        <StoreInitializer />
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              fontFamily: "var(--font-body), DM Sans, sans-serif",
              fontSize: "14px",
              borderRadius: "12px",
              background: "#1a1714",
              color: "#fdf9f3",
              padding: "12px 16px",
            },
            success: { iconTheme: { primary: "#e08a28", secondary: "#1a1714" } },
          }}
        />
      </body>
    </html>
  );
}
