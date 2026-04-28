import Link from "next/link";
import { FlaskConical, ShieldCheck, Award, ExternalLink, ChevronRight } from "lucide-react";

export const metadata = {
  title: "Lab Tested Certificate | Diaasa",
  description: "View our official lab test certificates. All Diaasa products are independently tested and certified for purity, safety, and quality.",
};

export default function LabCertificatePage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs font-body text-charcoal-400 mb-8 flex-wrap">
        <Link href="/" className="hover:text-brand-600">Home</Link>
        <ChevronRight size={11} />
        <span className="text-charcoal-600">Lab Certificate</span>
      </nav>

      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
          <FlaskConical size={32} className="text-green-600" />
        </div>
        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-light text-charcoal-900 mb-3">
          Lab Tested &amp; Certified
        </h1>
        <p className="font-body text-sm sm:text-base text-charcoal-500 max-w-xl mx-auto leading-relaxed">
          Every Diaasa product is independently tested by accredited laboratories to ensure the highest standards of purity, safety, and quality before reaching you.
        </p>
      </div>

      {/* Trust badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
        {[
          { icon: ShieldCheck, label: "Dermatologically Tested", color: "text-green-600", bg: "bg-green-50 border-green-200" },
          { icon: FlaskConical, label: "No Harmful Chemicals", color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
          { icon: Award, label: "Quality Assured", color: "text-brand-600", bg: "bg-brand-50 border-brand-200" },
          { icon: ShieldCheck, label: "Safe Ingredients", color: "text-purple-600", bg: "bg-purple-50 border-purple-200" },
        ].map(({ icon: Icon, label, color, bg }) => (
          <div key={label} className={`flex flex-col items-center gap-2 p-4 rounded-2xl border ${bg} text-center`}>
            <Icon size={22} className={color} />
            <span className="font-body text-xs font-medium text-charcoal-700 leading-tight">{label}</span>
          </div>
        ))}
      </div>

      {/* PDF Viewer */}
      <div className="bg-white rounded-3xl border border-charcoal-100 shadow-soft overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-charcoal-100">
          <div className="flex items-center gap-2.5">
            <FlaskConical size={18} className="text-green-600" />
            <div>
              <p className="font-body text-sm font-semibold text-charcoal-800">Diaasa Enterprises — Lab Test Report</p>
              <p className="font-body text-xs text-charcoal-400">Official Certificate of Analysis</p>
            </div>
          </div>
          <a
            href="/images/Diaasa enterprises.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-body text-xs font-medium rounded-full transition-colors shrink-0"
          >
            <ExternalLink size={13} />
            Open PDF
          </a>
        </div>

        {/* Embedded PDF */}
        <div className="w-full h-[60vh] sm:h-[75vh] bg-charcoal-50">
          <iframe
            src="/images/Diaasa enterprises.pdf"
            className="w-full h-full"
            title="Diaasa Lab Certificate"
          />
        </div>

        {/* Download footer */}
        <div className="px-5 py-4 bg-green-50 border-t border-green-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-body text-xs text-green-700 text-center sm:text-left">
            ✓ This certificate is issued by an accredited third-party laboratory and confirms product safety and quality.
          </p>
          <a
            href="/images/Diaasa enterprises.pdf"
            download="Diaasa-Lab-Certificate.pdf"
            className="flex items-center gap-1.5 px-5 py-2 border border-green-600 text-green-700 hover:bg-green-600 hover:text-white font-body text-xs font-medium rounded-full transition-colors shrink-0"
          >
            Download Certificate
          </a>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-10 text-center">
        <p className="font-body text-sm text-charcoal-500 mb-4">
          Have questions about our testing process?
        </p>
        <Link
          href="/pages/about"
          className="inline-flex items-center gap-2 font-body text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
        >
          Learn more about us <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  );
}
