"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, CreditCard, Truck, CheckCircle, Plus, Tag, X } from "lucide-react";
import toast from "react-hot-toast";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

declare global {
  interface Window { Razorpay: unknown; }
}

// interface Address {
//   id: string; name: string; phone: string; line1: string;
//   line2?: string | null; city: string; state: string; pincode: string;
//   isDefault: boolean;
// }


interface Address {
  id: string;
  name: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
  addressType?: "HOME" | "WORK" | "OTHER";
}

type Step = "address" | "payment";

const STATES = ["Andhra Pradesh","Assam","Bihar","Chhattisgarh","Delhi","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal"];

export default function CheckoutPage() {
  const [step, setStep] = useState<Step>("address");
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"ONLINE" | "COD">("ONLINE");
  const [couponCode, setCouponCode] = useState("");
  const [couponData, setCouponData] = useState<{ discount: number; code: string } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [newAddress, setNewAddress] = useState({
    name: "", phone: "", line1: "", line2: "", city: "", state: "Maharashtra", pincode: "", addressType: "HOME",
  });

  const router = useRouter();
  const { items, subtotal, totalGST, total, count, fetchCart } = useCartStore();
  const { user } = useAuthStore();

  useEffect(() => { fetchCart(); fetchAddresses(); }, []);

  const fetchAddresses = async () => {
    try {
      const res = await fetch("/api/user/addresses");
      const data = await res.json();
      if (data.success) {
        setAddresses(data.data.addresses);
        const def = data.data.addresses.find((a: Address) => a.isDefault);
        if (def) setSelectedAddress(def.id);
      }
    } catch {}
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/user/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAddress),
      });
      const data = await res.json();
      if (data.success) {
        await fetchAddresses();
        setSelectedAddress(data.data.address.id);
        setShowAddressForm(false);
        toast.success("Address saved!");
      } else {
        toast.error(data.error?.message || "Failed to save address");
      }
    } catch { toast.error("Failed to save address"); }
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const res = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode, cartTotal: subtotal }),
      });
      const data = await res.json();
      if (data.success) {
        setCouponData({ discount: data.data.discount, code: data.data.code });
        toast.success(data.message);
      } else {
        toast.error(data.error?.message || "Invalid coupon");
      }
    } finally { setCouponLoading(false); }
  };

  const loadRazorpay = () => new Promise<boolean>((resolve) => {
    if (document.getElementById("razorpay-sdk")) { resolve(true); return; }
    const script = document.createElement("script");
    script.id = "razorpay-sdk";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

  const handlePlaceOrder = async () => {
    if (!selectedAddress) { toast.error("Please select a delivery address"); return; }
    setPlacing(true);
    try {
      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addressId: selectedAddress,
          paymentMethod,
          couponCode: couponData?.code,
          notes: "",
        }),
      });
      const data = await res.json();
      if (!data.success) { toast.error(data.error?.message || "Failed to place order"); return; }

      if (paymentMethod === "COD") {
        toast.success("Order placed successfully!");
        router.push(`/orders/${data.data.orderId}?success=1`);
        return;
      }

      // Razorpay
      const loaded = await loadRazorpay();
      if (!loaded) { toast.error("Payment gateway failed to load"); return; }

      const rzp = new (window.Razorpay as new (opts: unknown) => { open: () => void })({
        key: data.data.keyId,
        amount: Math.round(data.data.amount * 100),
        currency: data.data.currency,
        order_id: data.data.razorpayOrderId,
        name: "Diaasa Store",
        description: `Order #${data.data.orderNumber}`,
        prefill: { name: user?.name || "", contact: user?.phone || "" },
        theme: { color: "#e08a28" },
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          const verifyRes = await fetch("/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: data.data.orderId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            }),
          });
          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            toast.success("Payment successful! 🎉");
            router.push(`/orders/${data.data.orderId}?success=1`);
          } else {
            toast.error("Payment verification failed");
          }
        },
        modal: { ondismiss: () => setPlacing(false) },
      });
      rzp.open();
    } catch { toast.error("Something went wrong"); setPlacing(false); }
  };

  const shippingCost = subtotal >= 500 ? 0 : 49;
  const discount = couponData?.discount || 0;
  const finalTotal = total + shippingCost - discount;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-cream-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
          <motion.h1
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="font-display text-4xl font-light text-charcoal-900 mb-8"
          >
            Checkout
          </motion.h1>

          {/* Steps indicator */}
          <div className="flex items-center gap-3 mb-8">
            {(["address", "payment"] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-body text-sm font-bold transition-all ${step === s || (s === "address" && step === "payment") ? "bg-brand-500 text-white" : "bg-charcoal-100 text-charcoal-400"}`}>
                  {s === "address" && step === "payment" ? <CheckCircle size={16} /> : i + 1}
                </div>
                <span className={`font-body text-sm capitalize ${step === s ? "font-semibold text-charcoal-800" : "text-charcoal-400"}`}>{s}</span>
                {i < 1 && <div className="w-8 h-px bg-charcoal-200 mx-1" />}
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-[1fr_360px] gap-8 items-start">
            {/* Left panel */}
            <div className="space-y-4">
              <AnimatePresence mode="wait">
                {step === "address" && (
                  <motion.div key="address" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
                    <div className="bg-white rounded-2xl p-6 shadow-soft">
                      <div className="flex items-center justify-between mb-5">
                        <h2 className="font-body text-lg font-semibold text-charcoal-800 flex items-center gap-2">
                          <MapPin size={18} className="text-brand-500" /> Delivery Address
                        </h2>
                        <button onClick={() => setShowAddressForm(true)}
                          className="flex items-center gap-1.5 font-body text-sm text-brand-600 hover:text-brand-700">
                          <Plus size={15} /> Add New
                        </button>
                      </div>

                      {addresses.length === 0 && !showAddressForm && (
                        <div className="text-center py-8">
                          <p className="font-body text-sm text-charcoal-400 mb-4">No saved addresses</p>
                          <button onClick={() => setShowAddressForm(true)} className="btn-primary">Add Address</button>
                        </div>
                      )}

                      <div className="space-y-3">
                        {addresses.map((addr) => (
                          <label key={addr.id} className={`flex gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedAddress === addr.id ? "border-brand-400 bg-brand-50" : "border-charcoal-100 hover:border-charcoal-300"}`}>
                            <input type="radio" name="address" checked={selectedAddress === addr.id}
                              onChange={() => setSelectedAddress(addr.id)} className="mt-0.5 accent-brand-500" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-body text-sm font-semibold text-charcoal-800">{addr.name}</span>
                                <span className="badge-gray text-[10px]">{addr.addressType || "HOME"}</span>
                                {addr.isDefault && <span className="badge-brand text-[10px]">Default</span>}
                              </div>
                              <p className="font-body text-sm text-charcoal-600 mt-1">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}</p>
                              <p className="font-body text-sm text-charcoal-600">{addr.city}, {addr.state} - {addr.pincode}</p>
                              <p className="font-body text-xs text-charcoal-400 mt-1">📞 {addr.phone}</p>
                            </div>
                          </label>
                        ))}
                      </div>

                      {showAddressForm && (
                        <motion.form
                          initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                          onSubmit={handleSaveAddress}
                          className="mt-5 pt-5 border-t border-charcoal-100 space-y-3"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <p className="font-body text-sm font-semibold">New Address</p>
                            <button type="button" onClick={() => setShowAddressForm(false)} className="text-charcoal-400"><X size={16} /></button>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <input value={newAddress.name} onChange={e => setNewAddress(a => ({...a, name: e.target.value}))} placeholder="Full Name" required className="input-base col-span-2 sm:col-span-1" />
                            <input value={newAddress.phone} onChange={e => setNewAddress(a => ({...a, phone: e.target.value.replace(/\D/g, "").slice(0, 10)}))} placeholder="Phone (10-digit)" required pattern="[6-9][0-9]{9}" title="Enter a valid 10-digit Indian mobile number" className="input-base col-span-2 sm:col-span-1" />
                            <input value={newAddress.line1} onChange={e => setNewAddress(a => ({...a, line1: e.target.value}))} placeholder="Address Line 1" required className="input-base col-span-2" />
                            <input value={newAddress.line2} onChange={e => setNewAddress(a => ({...a, line2: e.target.value}))} placeholder="Address Line 2 (optional)" className="input-base col-span-2" />
                            <input value={newAddress.city} onChange={e => setNewAddress(a => ({...a, city: e.target.value}))} placeholder="City" required className="input-base" />
                            <input value={newAddress.pincode} onChange={e => setNewAddress(a => ({...a, pincode: e.target.value}))} placeholder="Pincode" required className="input-base" />
                            <select value={newAddress.state} onChange={e => setNewAddress(a => ({...a, state: e.target.value}))} className="input-base col-span-2">
                              {STATES.map(s => <option key={s}>{s}</option>)}
                            </select>
                          </div>
                          <button type="submit" className="btn-primary w-full">Save Address</button>
                        </motion.form>
                      )}

                      {selectedAddress && (
                        <button onClick={() => setStep("payment")} className="btn-primary w-full mt-5">
                          Continue to Payment
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}

                {step === "payment" && (
                  <motion.div key="payment" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
                    <div className="bg-white rounded-2xl p-6 shadow-soft">
                      <button onClick={() => setStep("address")} className="text-sm font-body text-charcoal-500 hover:text-brand-600 mb-4 flex items-center gap-1">
                        ← Back to Address
                      </button>
                      <h2 className="font-body text-lg font-semibold text-charcoal-800 flex items-center gap-2 mb-5">
                        <CreditCard size={18} className="text-brand-500" /> Payment Method
                      </h2>

                      <div className="space-y-3">
                        {[
                          { value: "ONLINE", icon: CreditCard, title: "Online Payment", desc: "UPI, Cards, Net Banking via Razorpay" },
                          { value: "COD", icon: Truck, title: "Cash on Delivery", desc: "Pay when you receive your order" },
                        ].map(({ value, icon: Icon, title, desc }) => (
                          <label key={value} className={`flex gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === value ? "border-brand-400 bg-brand-50" : "border-charcoal-100 hover:border-charcoal-300"}`}>
                            <input type="radio" name="payment" checked={paymentMethod === value}
                              onChange={() => setPaymentMethod(value as "ONLINE" | "COD")} className="mt-1 accent-brand-500" />
                            <div>
                              <div className="flex items-center gap-2">
                                <Icon size={16} className="text-brand-500" />
                                <span className="font-body text-sm font-semibold text-charcoal-800">{title}</span>
                              </div>
                              <p className="font-body text-xs text-charcoal-400 mt-0.5">{desc}</p>
                            </div>
                          </label>
                        ))}
                      </div>

                      {/* Coupon */}
                      <div className="mt-6 pt-5 border-t border-charcoal-100">
                        <p className="font-body text-sm font-semibold text-charcoal-800 mb-3 flex items-center gap-2">
                          <Tag size={15} className="text-brand-500" /> Apply Coupon
                        </p>
                        {couponData ? (
                          <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                            <div>
                              <p className="font-body text-sm font-semibold text-green-700">{couponData.code}</p>
                              <p className="font-body text-xs text-green-600">You save ₹{couponData.discount}</p>
                            </div>
                            <button onClick={() => { setCouponData(null); setCouponCode(""); }} className="text-green-500 hover:text-green-700">
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <input value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())}
                              placeholder="Enter coupon code" className="input-base flex-1 text-sm" />
                            <button onClick={applyCoupon} disabled={couponLoading}
                              className="px-4 py-2 rounded-xl bg-brand-500 text-white font-body text-sm font-medium hover:bg-brand-600 transition-colors disabled:opacity-50">
                              {couponLoading ? "..." : "Apply"}
                            </button>
                          </div>
                        )}
                      </div>

                      <button onClick={handlePlaceOrder} disabled={placing}
                        className="btn-primary w-full mt-6 py-4 text-base flex items-center justify-center gap-2">
                        {placing ? (
                          <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg> Processing…</>
                        ) : (
                          <>{paymentMethod === "COD" ? "Place Order" : "Pay ₹" + finalTotal.toLocaleString("en-IN")}</>
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Order summary */}
            <div className="bg-white rounded-2xl p-6 shadow-soft sticky top-24">
              <h3 className="font-display text-xl font-light text-charcoal-900 mb-4">Order Summary</h3>
              <div className="space-y-3 max-h-48 overflow-y-auto mb-4">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="relative w-12 h-14 rounded-lg overflow-hidden bg-cream-100 shrink-0">
                      {item.product.image && <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-xs font-medium text-charcoal-800 line-clamp-1">{item.product.name}</p>
                      <p className="font-body text-xs text-charcoal-400">{item.variant.name} × {item.quantity}</p>
                    </div>
                    <span className="font-body text-sm font-medium shrink-0">₹{item.lineTotal.toLocaleString("en-IN")}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-charcoal-100 pt-3 space-y-2 text-sm font-body">
                <div className="flex justify-between text-charcoal-600"><span>Subtotal</span><span>₹{subtotal.toLocaleString("en-IN")}</span></div>
                <div className="flex justify-between text-charcoal-600"><span>GST</span><span>₹{totalGST.toLocaleString("en-IN")}</span></div>
                <div className="flex justify-between text-charcoal-600"><span>Shipping</span><span className={shippingCost === 0 ? "text-green-600" : ""}>{shippingCost === 0 ? "FREE" : "₹49"}</span></div>
                {discount > 0 && <div className="flex justify-between text-green-600"><span>Coupon Discount</span><span>-₹{discount}</span></div>}
                <div className="flex justify-between font-semibold text-charcoal-900 text-base pt-2 border-t border-charcoal-100">
                  <span>Total</span><span>₹{finalTotal.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
