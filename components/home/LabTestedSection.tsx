"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FlaskConical, ShieldCheck, Award, BadgeCheck, X, ChevronLeft, ChevronRight } from "lucide-react";

const TRUST_POINTS = [
  { icon: Award,        label: "Quality Evaluated",          desc: "Every product meets our high standards" },
  { icon: BadgeCheck,   label: "Carefully Curated",          desc: "Handpicked for quality & consistency" },
  { icon: FlaskConical, label: "Inspired by Ayurvedic Traditions", desc: "Rooted in ancient skincare wisdom" },
  { icon: ShieldCheck,  label: "Crafted for Everyday Use",   desc: "Gentle, effective & skin-friendly" },
];

const CERTIFICATES = [
  { src: "/images/sunscreen.jpg",      label: "Sunscreen SPF 50+ PA++++" },
  { src: "/images/kesar.jpg",          label: "Kesar Soap" },
  { src: "/images/kesarfacialbar.jpg", label: "Kesar Facial Bar" },
  { src: "/images/sandal.jpg",         label: "Sandal Cream" },
  { src: "/images/ubtan.jpg",          label: "Ubtan Soap" },
];

export function LabTestedSection() {
  const [lightbox, setLightbox] = useState<number | null>(null);

  const prev = () => setLightbox((i) => (i! - 1 + CERTIFICATES.length) % CERTIFICATES.length);
  const next = () => setLightbox((i) => (i! + 1) % CERTIFICATES.length);

  return (
    <section className="py-14 md:py-20 bg-cream-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-brand-100 text-brand-700 font-body text-xs font-semibold px-4 py-1.5 rounded-full mb-4 uppercase tracking-widest">
            <FlaskConical size={13} />
            Certified Quality
          </div>
          <h2 className="section-title mb-3">Lab Tested. Proven Safe.</h2>
          <p className="font-body text-sm sm:text-base text-charcoal-500 max-w-xl mx-auto leading-relaxed">
            Every DIAASA product is carefully curated and quality evaluated to maintain high standards of craftsmanship, consistency, and everyday skincare comfort.
          </p>
        </motion.div>

        {/* Trust points */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-12">
          {TRUST_POINTS.map(({ icon: Icon, label, desc }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="flex flex-col items-center text-center gap-3 p-5 bg-white rounded-2xl border border-brand-100 shadow-soft hover:shadow-medium hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className="w-11 h-11 rounded-full bg-brand-50 flex items-center justify-center">
                <Icon size={20} className="text-brand-600" />
              </div>
              <div>
                <p className="font-body text-sm font-semibold text-charcoal-800">{label}</p>
                <p className="font-body text-xs text-charcoal-400 mt-0.5 leading-snug">{desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Certificate images */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10"
        >
          <p className="font-body text-xs font-semibold uppercase tracking-widest text-charcoal-400 text-center mb-6">
            Certificate of Analysis — Click to enlarge
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
            {CERTIFICATES.map((cert, i) => (
              <motion.button
                key={i}
                onClick={() => setLightbox(i)}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="group relative rounded-2xl overflow-hidden border-2 border-brand-100 hover:border-brand-400 transition-all duration-300 shadow-soft hover:shadow-medium hover:-translate-y-1 bg-white"
              >
                <div className="relative w-full aspect-[3/4]">
                  <Image
                    src={cert.src}
                    alt={cert.label}
                    fill
                    className="object-contain p-2"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                  />
                </div>
                {/* hover overlay */}
                <div className="absolute inset-0 bg-brand-900/0 group-hover:bg-brand-900/10 transition-colors duration-300 flex items-center justify-center">
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity font-body text-xs font-semibold text-white bg-brand-600 px-3 py-1.5 rounded-full shadow">
                    View
                  </span>
                </div>
                {/* label */}
                <div className="px-3 py-2 border-t border-brand-50">
                  <p className="font-body text-[11px] font-medium text-charcoal-600 text-center truncate">{cert.label}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Bottom CTA banner */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl bg-charcoal-900 p-8 md:p-10 text-white"
        >
          <div className="absolute -top-12 -right-12 w-56 h-56 rounded-full bg-brand-500/10" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-brand-500/10" />
          <div className="relative flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                <FlaskConical size={18} className="text-brand-400" />
                <span className="font-body text-xs font-semibold uppercase tracking-widest text-brand-400">
                  Official Document
                </span>
              </div>
              <h3 className="font-display text-2xl sm:text-3xl font-light mb-2">
                View Full Lab Certificate
              </h3>
              <p className="font-body text-sm text-charcoal-300 max-w-md leading-relaxed">
                Download the complete Certificate of Analysis for Diaasa Enterprises — verified by an accredited third-party laboratory.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <Link
                href="/lab-certificate"
                className="flex items-center justify-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white font-body text-sm font-semibold rounded-full transition-colors shadow-brand"
              >
                <FlaskConical size={15} />
                View Certificate
              </Link>
              <a
                href="/images/Diaasa enterprises.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-6 py-3 border border-charcoal-600 text-charcoal-200 font-body text-sm font-medium rounded-full hover:border-brand-400 hover:text-brand-400 transition-colors"
              >
                Open PDF
              </a>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={() => setLightbox(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative max-w-lg w-full bg-white rounded-3xl overflow-hidden shadow-strong"
              onClick={(e) => e.stopPropagation()}
            >
              {/* close */}
              <button
                onClick={() => setLightbox(null)}
                className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-charcoal-900/60 text-white flex items-center justify-center hover:bg-charcoal-900 transition-colors"
              >
                <X size={15} />
              </button>

              {/* image */}
              <div className="relative w-full aspect-[3/4] bg-cream-50">
                <Image
                  src={CERTIFICATES[lightbox].src}
                  alt={CERTIFICATES[lightbox].label}
                  fill
                  className="object-contain p-4"
                  sizes="(max-width: 640px) 100vw, 512px"
                />
              </div>

              {/* footer */}
              <div className="flex items-center justify-between px-5 py-3 border-t border-charcoal-100">
                <button onClick={prev} className="w-9 h-9 rounded-full border border-charcoal-200 flex items-center justify-center hover:border-brand-400 hover:text-brand-600 transition-colors">
                  <ChevronLeft size={16} />
                </button>
                <div className="text-center">
                  <p className="font-body text-sm font-semibold text-charcoal-800">{CERTIFICATES[lightbox].label}</p>
                  <p className="font-body text-xs text-charcoal-400">{lightbox + 1} / {CERTIFICATES.length}</p>
                </div>
                <button onClick={next} className="w-9 h-9 rounded-full border border-charcoal-200 flex items-center justify-center hover:border-brand-400 hover:text-brand-600 transition-colors">
                  <ChevronRight size={16} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
