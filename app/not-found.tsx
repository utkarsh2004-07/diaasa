import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-cream-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <p className="font-display text-[120px] md:text-[160px] font-light text-charcoal-100 leading-none select-none">
            404
          </p>
          <h1 className="font-display text-3xl md:text-4xl font-light text-charcoal-800 -mt-4 mb-4">
            Page not found
          </h1>
          <p className="font-body text-sm text-charcoal-500 mb-8 leading-relaxed">
            The page you're looking for doesn't exist or has been moved.
            Let's get you back to something beautiful.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/" className="btn-primary">Go Home</Link>
            <Link href="/products" className="btn-outline">Browse Products</Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
