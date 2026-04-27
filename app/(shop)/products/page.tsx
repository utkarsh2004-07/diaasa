import { Suspense } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ProductsClient from "@/components/product/ProductsClient";

export const metadata = {
  title: "All Products",
  description: "Browse our full range of premium beauty and skincare products.",
};

export default function ProductsPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-cream-50">
        <Suspense fallback={<div className="h-96 flex items-center justify-center"><span className="font-body text-charcoal-400">Loading products…</span></div>}>
          <ProductsClient />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
