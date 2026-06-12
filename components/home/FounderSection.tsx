"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export function FounderSection() {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p className="font-body text-xs tracking-widest uppercase text-brand-600 mb-3">Our Story</p>
          <h2 className="section-title">A Message from the Founder</h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Founder Image */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="relative w-full aspect-[4/5] max-w-sm mx-auto rounded-3xl overflow-hidden shadow-medium">
              <Image
                src="/images/founder.png"
                alt="Founder of DIAASA"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                loading="eager"
                priority
              />
              {/* Decorative accent */}
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal-900/30 to-transparent" />
            </div>
            {/* Floating badge */}
            <div className="absolute -bottom-4 -right-4 md:bottom-6 md:right-0 bg-brand-600 text-white rounded-2xl px-5 py-3 shadow-medium">
              <p className="font-body text-xs font-semibold tracking-wide">Founder, DIAASA</p>
            </div>
          </motion.div>

          {/* Story Text */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-5"
          >
            {/* Opening quote */}
            <svg width="40" height="28" viewBox="0 0 40 28" fill="none" className="text-brand-200" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 28V17.6C0 12.8 1.2 8.93333 3.6 6C6.13333 2.93333 9.86667 1.06667 14.8 0.399994L16 4.39999C13.2 5.06666 11.0667 6.26666 9.6 8C8.26667 9.6 7.6 11.6 7.6 14H14.8V28H0ZM22.8 28V17.6C22.8 12.8 24 8.93333 26.4 6C28.9333 2.93333 32.6667 1.06667 37.6 0.399994L38.8 4.39999C36 5.06666 33.8667 6.26666 32.4 8C31.0667 9.6 30.4 11.6 30.4 14H37.6V28H22.8Z" fill="currentColor"/>
            </svg>

            <p className="font-body text-charcoal-600 leading-relaxed">
              Like many teenagers, I struggled with acne, stubborn marks, uneven skin tone, and tanning. As I grew older, these concerns only became more frustrating. I tried countless products that promised results — some didn't work, others left my skin feeling worse.
            </p>
            <p className="font-body text-charcoal-600 leading-relaxed">
              Determined to find something that truly helped, I turned to traditional home remedies and DIY skincare inspired by ingredients trusted for generations. After many trials, I created an ubtan blend that worked beautifully — and sparked a thought: <em className="text-charcoal-800 not-italic font-medium">what if this could help others too?</em>
            </p>
            <p className="font-body text-charcoal-600 leading-relaxed">
              That's when DIAASA took shape. We combine the wisdom of traditional Ayurvedic ingredients with a modern approach designed for today's generation — starting with our Ubtan Soap and expanding into botanical-infused sunscreens and more.
            </p>

            <blockquote className="border-l-4 border-brand-400 pl-5 py-1">
              <p className="font-display text-xl md:text-2xl font-light text-charcoal-800 italic leading-snug">
                "Because good skincare shouldn't be complicated — it should simply work."
              </p>
            </blockquote>

            <p className="font-body text-sm font-semibold text-charcoal-500 tracking-wide">
              — Founder, DIAASA
            </p>
            
          </motion.div>
        </div>
      </div>
    </section>
  );
}
