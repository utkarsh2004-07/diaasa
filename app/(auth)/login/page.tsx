"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, ArrowLeft, Shield, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";

type Step = "phone" | "otp";

export default function LoginPage() {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";
  const { setUser } = useAuthStore();
  const { guestCartId, fetchCart } = useCartStore();

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[6-9]\d{9}$/.test(phone)) {
      toast.error("Enter a valid 10-digit mobile number");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (data.success) {
        setStep("otp");
        setResendCooldown(30);
        toast.success("OTP sent to your mobile!");
        setTimeout(() => otpRefs.current[0]?.focus(), 200);
      } else {
        toast.error(data.error?.message || "Failed to send OTP");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOTPInput = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
    if (newOtp.every((d) => d) && newOtp.join("").length === 6) {
      handleVerifyOTP(newOtp.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async (code?: string) => {
    const otpCode = code || otp.join("");
    if (otpCode.length !== 6) { toast.error("Enter complete 6-digit OTP"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp: otpCode, guestCartId }),
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.data.user);
        await fetchCart();
        toast.success(data.message || "Welcome back!");
        router.push(redirect);
      } else {
        toast.error(data.error?.message || "Invalid OTP");
        setOtp(["", "", "", "", "", ""]);
        otpRefs.current[0]?.focus();
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (data.success) {
        setResendCooldown(30);
        setOtp(["", "", "", "", "", ""]);
        otpRefs.current[0]?.focus();
        toast.success("OTP resent!");
      } else {
        toast.error(data.error?.message || "Failed to resend");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-brand-100 opacity-40 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-cream-300 opacity-60 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative bg-white rounded-3xl shadow-strong w-full max-w-md overflow-hidden"
      >
        {/* Header strip */}
        <div className="bg-charcoal-900 px-8 py-8 text-center">
          <span className="font-display text-3xl font-light tracking-[0.3em] text-white">DIAASA</span>
          <p className="mt-1 font-body text-xs tracking-widest uppercase text-charcoal-400">Store</p>
        </div>

        <div className="p-8">
          <AnimatePresence mode="wait">
            {step === "phone" ? (
              <motion.div
                key="phone"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-brand-50 mx-auto mb-5">
                  <Phone size={24} className="text-brand-600" />
                </div>
                <h1 className="font-display text-3xl font-light text-charcoal-900 text-center mb-2">
                  Welcome
                </h1>
                <p className="font-body text-sm text-charcoal-500 text-center mb-8">
                  Enter your mobile number to continue
                </p>

                <form onSubmit={handleSendOTP} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 min-w-[108px] items-center justify-center rounded-2xl border border-charcoal-200 bg-white px-4 text-charcoal-700 shadow-sm">
                      <span className="font-body text-sm font-medium">🇮🇳 +91</span>
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      placeholder="10-digit mobile number"
                      className="input-base flex-1 h-12 text-base tracking-widest"
                      autoFocus
                      maxLength={10}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || phone.length !== 10}
                    className="btn-primary w-full text-base py-4"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        Sending OTP…
                      </span>
                    ) : "Get OTP"}
                  </button>
                </form>

                

                <p className="mt-6 font-body text-xs text-charcoal-400 text-center leading-relaxed">
                  By continuing, you agree to our{" "}
                  <a href="/pages/terms" className="text-brand-600 hover:underline">Terms</a> and{" "}
                  <a href="/pages/privacy" className="text-brand-600 hover:underline">Privacy Policy</a>
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <button
                  onClick={() => { setStep("phone"); setOtp(["", "", "", "", "", ""]); }}
                  className="flex items-center gap-1.5 text-charcoal-500 hover:text-charcoal-800 mb-6 transition-colors"
                >
                  <ArrowLeft size={16} />
                  <span className="font-body text-sm">Back</span>
                </button>

                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-green-50 mx-auto mb-5">
                  <Shield size={24} className="text-green-600" />
                </div>
                <h1 className="font-display text-3xl font-light text-charcoal-900 text-center mb-2">
                  Verify OTP
                </h1>
                <p className="font-body text-sm text-charcoal-500 text-center mb-8">
                  Sent to <span className="font-semibold text-charcoal-800">+91 {phone}</span>
                </p>

                <div className="flex gap-2 justify-center mb-8">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { otpRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOTPInput(i, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(i, e)}
                      className="otp-input"
                    />
                  ))}
                </div>

                <button
                  onClick={() => handleVerifyOTP()}
                  disabled={loading || otp.join("").length < 6}
                  className="btn-primary w-full text-base py-4 mb-4"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Verifying…
                    </span>
                  ) : "Verify & Continue"}
                </button>

                <button
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || loading}
                  className="w-full flex items-center justify-center gap-2 font-body text-sm text-charcoal-500 hover:text-brand-600 transition-colors disabled:opacity-50 py-2"
                >
                  <RefreshCw size={14} />
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
