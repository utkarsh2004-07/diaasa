"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Save } from "lucide-react";

interface Props { settings: Record<string, string>; }

const FIELDS = [
  { group: "Store Info", fields: [
    { key: "store_name", label: "Store Name", type: "text" },
    { key: "store_tagline", label: "Tagline", type: "text" },
    { key: "store_email", label: "Email", type: "email" },
    { key: "store_phone", label: "Phone", type: "tel" },
    { key: "store_address", label: "Address", type: "textarea" },
  ]},
  { group: "GST & Tax", fields: [
    { key: "gst_number", label: "GST Number", type: "text" },
    { key: "default_gst_percent", label: "Default GST %", type: "number" },
  ]},
  { group: "Shipping", fields: [
    { key: "free_shipping_above", label: "Free Shipping Above (₹)", type: "number" },
    { key: "shipping_charge", label: "Shipping Charge (₹)", type: "number" },
    { key: "cod_enabled", label: "COD Enabled", type: "toggle" },
    { key: "cod_extra_charge", label: "COD Extra Charge (₹)", type: "number" },
  ]},
  { group: "SEO", fields: [
    { key: "seo_title", label: "Default SEO Title", type: "text" },
    { key: "seo_description", label: "Default Meta Description", type: "textarea" },
  ]},
  { group: "Social Links", fields: [
    { key: "social_instagram", label: "Instagram URL", type: "url" },
    { key: "social_facebook", label: "Facebook URL", type: "url" },
    { key: "social_twitter", label: "Twitter URL", type: "url" },
    { key: "social_youtube", label: "YouTube URL", type: "url" },
  ]},
  { group: "Maintenance", fields: [
    { key: "maintenance_mode", label: "Maintenance Mode", type: "toggle" },
    { key: "maintenance_message", label: "Maintenance Message", type: "textarea" },
  ]},
];

export default function AdminSettingsClient({ settings: initial }: Props) {
  const [settings, setSettings] = useState<Record<string, string>>(initial);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });
      const data = await res.json();
      if (data.success) toast.success("Settings saved!");
      else toast.error("Failed to save");
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="font-body text-2xl font-semibold text-charcoal-900">Settings</h1>
        <button onClick={handleSave} disabled={saving}
          className="btn-primary flex items-center gap-2 text-sm py-2.5">
          <Save size={15} /> {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>

      {FIELDS.map(({ group, fields }) => (
        <div key={group} className="bg-white rounded-2xl shadow-soft border border-charcoal-50 overflow-hidden">
          <div className="px-6 py-4 border-b border-charcoal-50 bg-charcoal-50">
            <h2 className="font-body text-sm font-semibold text-charcoal-700">{group}</h2>
          </div>
          <div className="p-6 space-y-4">
            {fields.map(({ key, label, type }) => (
              <div key={key} className="grid sm:grid-cols-[200px_1fr] gap-3 items-start">
                <label className="font-body text-sm text-charcoal-600 pt-3">{label}</label>
                {type === "toggle" ? (
                  <div className="flex items-center pt-2.5">
                    <button
                      onClick={() => setSettings((s) => ({ ...s, [key]: s[key] === "true" ? "false" : "true" }))}
                      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${settings[key] === "true" ? "bg-brand-500" : "bg-charcoal-200"}`}
                    >
                      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${settings[key] === "true" ? "translate-x-5" : "translate-x-0.5"}`} />
                    </button>
                    <span className="ml-3 font-body text-sm text-charcoal-600">
                      {settings[key] === "true" ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                ) : type === "textarea" ? (
                  <textarea
                    value={settings[key] || ""}
                    onChange={(e) => setSettings((s) => ({ ...s, [key]: e.target.value }))}
                    rows={3}
                    className="input-base resize-none"
                  />
                ) : (
                  <input
                    type={type}
                    value={settings[key] || ""}
                    onChange={(e) => setSettings((s) => ({ ...s, [key]: e.target.value }))}
                    className="input-base"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
