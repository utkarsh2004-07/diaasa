"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { User, Package, MapPin, LogOut, Edit2, ChevronRight, Trash2, Star, Check, X, Plus } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  PROCESSING: "bg-purple-100 text-purple-700",
  SHIPPED: "bg-indigo-100 text-indigo-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

const STATES = ["Andhra Pradesh","Assam","Bihar","Chhattisgarh","Delhi","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal"];

type Tab = "orders" | "addresses" | "account";

interface Address {
  id: string; name: string; phone: string;
  line1: string; line2?: string | null;
  city: string; state: string; pincode: string;
  isDefault: boolean; addressType: string;
}

interface Props {
  user: { id: string; name?: string | null; phone: string; email?: string | null; avatar?: string | null };
  orders: Array<{ id: string; orderNumber: string; status: string; total: number; createdAt: Date; items: Array<{ name: string; imageUrl?: string | null }> }>;
  addresses: Address[];
}

const EMPTY_FORM = { name: "", phone: "", line1: "", line2: "", city: "", state: "Maharashtra", pincode: "", addressType: "HOME" };

export default function ProfileClient({ user, orders, addresses: initial }: Props) {
  const [tab, setTab] = useState<Tab>("orders");
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.name || "");
  const [email, setEmail] = useState(user.email || "");
  const { logout } = useAuthStore();

  const [addresses, setAddresses] = useState<Address[]>(initial);
  const [showForm, setShowForm] = useState(false);
  const [editingAddr, setEditingAddr] = useState<Address | null>(null);
  const [addrForm, setAddrForm] = useState(EMPTY_FORM);
  const [savingAddr, setSavingAddr] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const navItems = [
    { id: "orders" as Tab, label: "My Orders", icon: Package, count: orders.length },
    { id: "addresses" as Tab, label: "Addresses", icon: MapPin, count: addresses.length },
    { id: "account" as Tab, label: "Account Settings", icon: User },
  ];

  const [displayName, setDisplayName] = useState(user.name || "");
  const [displayEmail, setDisplayEmail] = useState(user.email || "");

  const saveProfile = async () => {
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Profile updated!");
        setEditing(false);
        setDisplayName(name);
        setDisplayEmail(email);
      }
      else toast.error(data.error?.message || "Failed");
    } catch { toast.error("Failed to update"); }
  };

  const openAddNew = () => {
    setEditingAddr(null);
    setAddrForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (addr: Address) => {
    setEditingAddr(addr);
    setAddrForm({ name: addr.name, phone: addr.phone, line1: addr.line1, line2: addr.line2 || "", city: addr.city, state: addr.state, pincode: addr.pincode, addressType: addr.addressType });
    setShowForm(true);
  };

  const handleSaveAddr = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAddr(true);
    try {
      const url = editingAddr ? `/api/user/addresses/${editingAddr.id}` : "/api/user/addresses";
      const method = editingAddr ? "PATCH" : "POST";
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addrForm),
      });
      const data = await res.json();
      if (data.success) {
        if (editingAddr) {
          setAddresses((prev) => prev.map((a) => a.id === editingAddr.id ? data.data.address : a));
          toast.success("Address updated!");
        } else {
          setAddresses((prev) => [...prev, data.data.address]);
          toast.success("Address saved!");
        }
        setShowForm(false);
        setEditingAddr(null);
      } else {
        toast.error(data.error?.message || "Failed to save address");
      }
    } catch { toast.error("Failed to save address"); }
    finally { setSavingAddr(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this address?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/user/addresses/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setAddresses((prev) => prev.filter((a) => a.id !== id));
        toast.success("Address deleted");
      } else toast.error(data.error?.message || "Failed");
    } catch { toast.error("Failed to delete"); }
    finally { setDeletingId(null); }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const res = await fetch(`/api/user/addresses/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...addresses.find((a) => a.id === id), isDefault: true }),
      });
      const data = await res.json();
      if (data.success) {
        setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a.id === id })));
        toast.success("Default address updated");
      }
    } catch { toast.error("Failed"); }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
      <div className="grid md:grid-cols-[280px_1fr] gap-6 items-start">
        {/* Sidebar */}
        <div className="bg-white rounded-2xl shadow-soft p-6 space-y-4">
          <div className="flex flex-col items-center text-center pb-4 border-b border-charcoal-100">
            <div className="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center mb-3">
              <span className="font-display text-2xl font-light text-brand-700">
                {displayName?.charAt(0) || user.phone.charAt(0)}
              </span>
            </div>
            <p className="font-body text-base font-semibold text-charcoal-800">{displayName || "Customer"}</p>
            <p className="font-body text-sm text-charcoal-400">{user.phone}</p>
          </div>
          <nav className="space-y-1">
            {navItems.map(({ id, label, icon: Icon, count }) => (
              <button key={id} onClick={() => setTab(id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-body text-sm transition-all ${tab === id ? "bg-brand-50 text-brand-700 font-medium" : "text-charcoal-600 hover:bg-charcoal-50"}`}>
                <span className="flex items-center gap-2.5"><Icon size={16} />{label}</span>
                <span className="flex items-center gap-1">
                  {count !== undefined && <span className="text-xs text-charcoal-400">{count}</span>}
                  <ChevronRight size={14} className="text-charcoal-300" />
                </span>
              </button>
            ))}
          </nav>
          <button onClick={logout} className="w-full flex items-center gap-2.5 px-4 py-3 rounded-xl font-body text-sm text-red-500 hover:bg-red-50 transition-colors mt-2">
            <LogOut size={16} /> Logout
          </button>
        </div>

        {/* Content */}
        <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>

          {/* Orders tab */}
          {tab === "orders" && (
            <div className="space-y-3">
              <h2 className="font-display text-2xl font-light text-charcoal-900 mb-5">My Orders</h2>
              {orders.length === 0 ? (
                <div className="bg-white rounded-2xl p-10 text-center">
                  <Package size={40} className="text-charcoal-200 mx-auto mb-3" />
                  <p className="font-body text-sm text-charcoal-400 mb-4">No orders yet</p>
                  <Link href="/products" className="btn-primary">Start Shopping</Link>
                </div>
              ) : (
                orders.map((order) => (
                  <Link key={order.id} href={`/orders/${order.id}`}
                    className="bg-white rounded-2xl p-4 shadow-soft flex items-center gap-4 hover:shadow-medium transition-shadow block">
                    <div className="w-14 h-16 bg-cream-100 rounded-xl overflow-hidden shrink-0 flex items-center justify-center">
                      {order.items[0]?.imageUrl
                        ? <img src={order.items[0].imageUrl} alt="" className="w-full h-full object-cover" />
                        : <span className="text-charcoal-300 text-xl">✦</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-sm font-semibold text-charcoal-900">{order.orderNumber}</p>
                      <p className="font-body text-xs text-charcoal-400 mt-0.5">{new Date(order.createdAt).toLocaleDateString("en-IN")}</p>
                      {order.items[0] && <p className="font-body text-xs text-charcoal-500 mt-0.5 truncate">{order.items[0].name}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`badge text-[11px] font-semibold ${STATUS_COLORS[order.status] || "badge-gray"}`}>{order.status}</span>
                      <p className="font-body text-sm font-semibold text-charcoal-900 mt-1.5">₹{order.total.toLocaleString("en-IN")}</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}

          {/* Addresses tab */}
          {tab === "addresses" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display text-2xl font-light text-charcoal-900">Saved Addresses</h2>
                <button onClick={openAddNew} className="btn-outline text-sm py-2 flex items-center gap-1.5">
                  <Plus size={14} /> Add New
                </button>
              </div>

              {/* Add / Edit form */}
              <AnimatePresence>
                {showForm && (
                  <motion.form
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                    onSubmit={handleSaveAddr}
                    className="bg-white rounded-2xl p-5 shadow-soft border border-brand-100 space-y-3 overflow-hidden"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-body text-sm font-semibold text-charcoal-800">{editingAddr ? "Edit Address" : "New Address"}</p>
                      <button type="button" onClick={() => setShowForm(false)} className="text-charcoal-400 hover:text-charcoal-600"><X size={16} /></button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input value={addrForm.name} onChange={(e) => setAddrForm((f) => ({ ...f, name: e.target.value }))} placeholder="Full Name" required className="input-base col-span-2 sm:col-span-1" />
                      <input value={addrForm.phone} onChange={(e) => setAddrForm((f) => ({ ...f, phone: e.target.value.replace(/\D/g, "").slice(0, 10) }))} placeholder="Phone (10-digit)" required pattern="[6-9][0-9]{9}" className="input-base col-span-2 sm:col-span-1" />
                      <input value={addrForm.line1} onChange={(e) => setAddrForm((f) => ({ ...f, line1: e.target.value }))} placeholder="Address Line 1" required className="input-base col-span-2" />
                      <input value={addrForm.line2} onChange={(e) => setAddrForm((f) => ({ ...f, line2: e.target.value }))} placeholder="Address Line 2 (optional)" className="input-base col-span-2" />
                      <input value={addrForm.city} onChange={(e) => setAddrForm((f) => ({ ...f, city: e.target.value }))} placeholder="City" required className="input-base" />
                      <input value={addrForm.pincode} onChange={(e) => setAddrForm((f) => ({ ...f, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) }))} placeholder="Pincode" required className="input-base" />
                      <select value={addrForm.state} onChange={(e) => setAddrForm((f) => ({ ...f, state: e.target.value }))} className="input-base col-span-2">
                        {STATES.map((s) => <option key={s}>{s}</option>)}
                      </select>
                      <select value={addrForm.addressType} onChange={(e) => setAddrForm((f) => ({ ...f, addressType: e.target.value }))} className="input-base col-span-2">
                        <option value="HOME">Home</option>
                        <option value="WORK">Work</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                    <button type="submit" disabled={savingAddr} className="btn-primary w-full">
                      {savingAddr ? "Saving..." : editingAddr ? "Update Address" : "Save Address"}
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>

              {addresses.length === 0 && !showForm ? (
                <div className="bg-white rounded-2xl p-10 text-center">
                  <MapPin size={40} className="text-charcoal-200 mx-auto mb-3" />
                  <p className="font-body text-sm text-charcoal-400">No saved addresses</p>
                </div>
              ) : (
                addresses.map((addr) => (
                  <div key={addr.id} className="bg-white rounded-2xl p-5 shadow-soft border border-charcoal-50">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="font-body text-sm font-semibold text-charcoal-800">{addr.name}</p>
                          <span className="badge-gray text-[10px]">{addr.addressType}</span>
                          {addr.isDefault && <span className="badge-brand text-[10px]">Default</span>}
                        </div>
                        <p className="font-body text-sm text-charcoal-600">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}</p>
                        <p className="font-body text-sm text-charcoal-600">{addr.city}, {addr.state} - {addr.pincode}</p>
                        <p className="font-body text-xs text-charcoal-400 mt-1">📞 {addr.phone}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {!addr.isDefault && (
                          <button onClick={() => handleSetDefault(addr.id)} title="Set as default"
                            className="w-8 h-8 rounded-lg bg-green-50 text-green-500 hover:bg-green-100 flex items-center justify-center transition-colors">
                            <Star size={13} />
                          </button>
                        )}
                        <button onClick={() => openEdit(addr)}
                          className="w-8 h-8 rounded-lg bg-brand-50 text-brand-500 hover:bg-brand-100 flex items-center justify-center transition-colors">
                          <Edit2 size={13} />
                        </button>
                        <button onClick={() => handleDelete(addr.id)} disabled={deletingId === addr.id}
                          className="w-8 h-8 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 flex items-center justify-center transition-colors disabled:opacity-40">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Account tab */}
          {tab === "account" && (
            <div className="bg-white rounded-2xl shadow-soft p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl font-light text-charcoal-900">Account Settings</h2>
                <button onClick={() => setEditing(!editing)}
                  className="flex items-center gap-1.5 font-body text-sm text-brand-600 hover:text-brand-700">
                  <Edit2 size={14} /> {editing ? "Cancel" : "Edit"}
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="font-body text-xs font-medium text-charcoal-500 uppercase tracking-wider block mb-1.5">Full Name</label>
                  {editing ? <input value={name} onChange={(e) => setName(e.target.value)} className="input-base" /> : <p className="font-body text-base text-charcoal-800">{displayName || "—"}</p>}
                </div>
                <div>
                  <label className="font-body text-xs font-medium text-charcoal-500 uppercase tracking-wider block mb-1.5">Mobile Number</label>
                  <p className="font-body text-base text-charcoal-400">{user.phone} <span className="text-xs">(cannot be changed)</span></p>
                </div>
                <div>
                  <label className="font-body text-xs font-medium text-charcoal-500 uppercase tracking-wider block mb-1.5">Email</label>
                  {editing ? <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-base" /> : <p className="font-body text-base text-charcoal-800">{displayEmail || "—"}</p>}
                </div>
              </div>
              {editing && <button onClick={saveProfile} className="btn-primary py-3">Save Changes</button>}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
