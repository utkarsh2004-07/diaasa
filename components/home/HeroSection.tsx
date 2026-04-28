"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Banner {
  id: string;
  title: string;
  image: string;
  mobileImage?: string | null;
  link?: string | null;
}

interface Props {
  banners: Banner[];
}

const FALLBACK_SLIDES = [
  {
    id: "1",
    title: "Glow From Within",
    subtitle: "Premium skincare for your daily ritual",
    cta: "Shop Skincare",
    link: "/products?category=skincare",
    bg: "from-cream-200 to-cream-400",
    accent: "#e08a28",
  },
  {
    id: "2",
    title: "Nourish. Restore. Shine.",
    subtitle: "Transform your haircare routine",
    cta: "Explore Haircare",
    link: "/products?category=haircare",
    bg: "from-charcoal-100 to-charcoal-200",
    accent: "#c4701e",
  },
];

export default function HeroSection({ banners }: Props) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const slides = banners.length > 0 ? banners : null;

  const next = useCallback(() => {
    const total = slides ? slides.length : FALLBACK_SLIDES.length;
    setDirection(1);
    setCurrent((c) => (c + 1) % total);
  }, [slides]);

  const prev = () => {
    const total = slides ? slides.length : FALLBACK_SLIDES.length;
    setDirection(-1);
    setCurrent((c) => (c - 1 + total) % total);
  };

  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? "100%" : "-100%", opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? "-100%" : "100%", opacity: 0 }),
  };

  if (slides) {
    return (
      <section className="relative w-full overflow-hidden bg-transparent">
        <AnimatePresence custom={direction} initial={false}>
          <motion.div
            key={current}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            className="w-full"
          >
            {/* Desktop image */}
            <img
              src={slides[current].image}
              alt={slides[current].title || "Banner"}
              className="w-full h-auto block hidden sm:block"
            />
            {/* Mobile image — uses mobileImage if set, falls back to desktop image */}
            <img
              src={slides[current].mobileImage || slides[current].image}
              alt={slides[current].title || "Banner"}
              className="w-full h-auto block sm:hidden"
            />
            {(slides[current].title || slides[current].link) && (
              <>
                <div className="absolute inset-0 bg-gradient-to-r from-charcoal-900/60 via-transparent to-transparent" />
                <div className="absolute inset-0 flex items-center">
                  <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 w-full">
                    {slides[current].title && (
                      <motion.h1
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                        className="font-display text-4xl md:text-6xl lg:text-7xl font-light text-white leading-tight max-w-xl"
                      >
                        {slides[current].title}
                      </motion.h1>
                    )}
                    {slides[current].link && (
                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                        className="mt-8"
                      >
                        <Link href={slides[current].link!} className="btn-primary inline-flex">
                          Shop Now
                        </Link>
                      </motion.div>
                    )}
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
        <SliderControls current={current} total={slides.length} onPrev={prev} onNext={next} onDot={setCurrent} />
      </section>
    );
  }

  // Fallback hero when no banners in DB
  const slide = FALLBACK_SLIDES[current];
  return (
    <section className={`relative h-[60vh] md:h-[85vh] overflow-hidden bg-gradient-to-br ${slide.bg}`}>
      <AnimatePresence custom={direction} initial={false}>
        <motion.div
          key={current}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className="absolute inset-0 flex items-center"
        >
          {/* Decorative circles */}
          <div className="absolute right-0 top-0 w-[60vw] h-full opacity-20 overflow-hidden">
            <div className="absolute -right-20 top-10 w-96 h-96 rounded-full border-2 border-charcoal-400" />
            <div className="absolute right-40 bottom-20 w-64 h-64 rounded-full border border-charcoal-400" />
            <div className="absolute right-10 top-1/3 w-48 h-48 rounded-full bg-charcoal-300/20" />
          </div>

          <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 w-full">
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="font-body text-xs tracking-[0.35em] uppercase text-charcoal-500 mb-4"
            >
              New Collection
            </motion.p>
            <motion.h1
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.7 }}
              className="font-display text-5xl md:text-7xl lg:text-8xl font-light text-charcoal-900 leading-[0.9] max-w-2xl"
            >
              {slide.title.split(" ").map((word, i) => (
                <span key={i} className={i % 2 === 1 ? "italic" : ""}>{word}{" "}</span>
              ))}
            </motion.h1>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="mt-4 font-body text-base text-charcoal-600 max-w-sm"
            >
              {slide.subtitle}
            </motion.p>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-8 flex items-center gap-4"
            >
              <Link href={slide.link} className="btn-primary">
                {slide.cta}
              </Link>
              <Link href="/products" className="btn-outline">
                View All
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>
      <SliderControls current={current} total={FALLBACK_SLIDES.length} onPrev={prev} onNext={next} onDot={setCurrent} />
    </section>
  );
}

function SliderControls({ current, total, onPrev, onNext, onDot }: {
  current: number; total: number;
  onPrev: () => void; onNext: () => void;
  onDot: (i: number) => void;
}) {
  return (
    <>
      <button onClick={onPrev} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/40 transition-colors">
        <ChevronLeft size={20} className="text-white" />
      </button>
      <button onClick={onNext} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/40 transition-colors">
        <ChevronRight size={20} className="text-white" />
      </button>
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <button key={i} onClick={() => onDot(i)}
            className={`transition-all duration-300 rounded-full ${i === current ? "w-6 h-2 bg-brand-500" : "w-2 h-2 bg-white/50 hover:bg-white/80"}`}
          />
        ))}
      </div>
    </>
  );
}
