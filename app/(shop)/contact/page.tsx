"use client";

import { useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Mail, Phone, MapPin, Clock, Send } from "lucide-react";
import toast from "react-hot-toast";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", phone: "", email: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.message) {
      toast.error("Please fill all required fields");
      return;
    }
    setSending(true);
    // Simulate sending — replace with your email API if needed
    await new Promise((r) => setTimeout(r, 1000));
    toast.success("Message sent! We'll get back to you within 24 hours.");
    setForm({ name: "", phone: "", email: "", subject: "", message: "" });
    setSending(false);
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-cream-50">
        {/* Hero */}
        <div className="bg-charcoal-900 py-14 text-center">
          <p className="font-body text-xs tracking-widest uppercase text-brand-400 mb-3">Get In Touch</p>
          <h1 className="font-display text-4xl md:text-5xl font-light text-white">Contact Us</h1>
          <p className="mt-3 font-body text-sm text-charcoal-300 max-w-md mx-auto">
            Have a question or need help? We're here for you.
          </p>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid lg:grid-cols-2 gap-10">

            {/* Left — Info */}
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-2xl font-light text-charcoal-900 mb-6">We'd love to hear from you</h2>
                <p className="font-body text-sm text-charcoal-500 leading-relaxed">
                  Whether you have a question about your order, our products, or anything else — our team is ready to help.
                </p>
              </div>

              <div className="space-y-4">
                {[
                  {
                    icon: Phone,
                    title: "Phone / WhatsApp",
                    value: "+91 84509 87174",
                    sub: "Mon–Sat, 9 AM – 6 PM",
                  },
                  {
                    icon: Mail,
                    title: "Email",
                    value: "info@diaasa.com",
                    sub: "We reply within 24 hours",
                  },
                  {
                    icon: MapPin,
                    title: "Address",
                    value: "Diaasa Enterprises",
                    sub: "Dombivli, Thane, Maharashtra",
                  },
                  {
                    icon: Clock,
                    title: "Support Hours",
                    value: "Mon – Sat: 9 AM – 6 PM",
                    sub: "Closed on Sundays & Public Holidays",
                  },
                ].map(({ icon: Icon, title, value, sub }) => (
                  <div key={title} className="flex items-start gap-4 p-4 bg-white rounded-2xl shadow-soft border border-charcoal-50">
                    <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center shrink-0">
                      <Icon size={18} className="text-brand-600" />
                    </div>
                    <div>
                      <p className="font-body text-xs font-semibold uppercase tracking-wider text-charcoal-400 mb-0.5">{title}</p>
                      <p className="font-body text-sm font-medium text-charcoal-800">{value}</p>
                      <p className="font-body text-xs text-charcoal-400">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Form */}
            <div className="bg-white rounded-2xl shadow-soft border border-charcoal-50 p-6 sm:p-8">
              <h2 className="font-display text-xl font-light text-charcoal-900 mb-6">Send us a message</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-body text-xs text-charcoal-500 mb-1 block">Name *</label>
                    <input
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="Your name"
                      className="input-base"
                      required
                    />
                  </div>
                  <div>
                    <label className="font-body text-xs text-charcoal-500 mb-1 block">Phone *</label>
                    <input
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                      placeholder="10-digit mobile number"
                      className="input-base"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="font-body text-xs text-charcoal-500 mb-1 block">Email (optional)</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="your@email.com"
                    className="input-base"
                  />
                </div>

                <div>
                  <label className="font-body text-xs text-charcoal-500 mb-1 block">Subject</label>
                  <select
                    value={form.subject}
                    onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                    className="input-base"
                  >
                    <option value="">Select a topic</option>
                    <option value="order">Order Issue</option>
                    <option value="product">Product Query</option>
                    <option value="return">Return / Refund</option>
                    <option value="shipping">Shipping Query</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="font-body text-xs text-charcoal-500 mb-1 block">Message *</label>
                  <textarea
                    value={form.message}
                    onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                    placeholder="How can we help you?"
                    rows={5}
                    className="input-base resize-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-3.5"
                >
                  <Send size={16} />
                  {sending ? "Sending…" : "Send Message"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
