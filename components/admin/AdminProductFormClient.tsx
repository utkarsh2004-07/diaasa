"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { Plus, Trash2, Save, ArrowLeft, X } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";
import ImageUpload from "@/components/ImageUpload";

interface Category { id: string; name: string; }
interface Variant { id?: string; name: string; price: number; comparePrice?: number | null; stock: number; sku?: string | null; }
interface ProductImage { id?: string; url: string; altText?: string | null; isPrimary?: boolean; }

interface WhyWeLoveItem { title: string; content: string; }

interface Product {
  id: string; name: string; slug: string;
  shortDesc?: string | null; description?: string | null;
  categoryId: string; brand?: string | null;
  sku?: string | null; gstPercent: number; tags?: string | null;
  isActive: boolean; isFeatured: boolean; isNew: boolean; isBestSeller: boolean;
  variants: Variant[]; images: ProductImage[];
  whyWeLove?: string | null; whyWeLoveItems?: string | null;
  howToUse?: string | null;
  benefits?: string | null; keyIngredients?: string | null;
  benefitsImage?: string | null;
  ingredientsImages?: string | null;
  ingredientsImage?: string | null; // legacy
}

interface Props {
  product: Product | null;
  categories: Category[];
}

const EMPTY_VARIANT: Variant = { name: "", price: 0, comparePrice: null, stock: 0, sku: "" };

export default function AdminProductFormClient({ product, categories }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: product?.name || "",
    slug: product?.slug || "",
    shortDesc: product?.shortDesc || "",
    description: product?.description || "",
    categoryId: product?.categoryId || (categories[0]?.id || ""),
    brand: product?.brand || "",
    sku: product?.sku || "",
    gstPercent: product?.gstPercent ?? 0,
    tags: product?.tags || "",
    isActive: product?.isActive ?? true,
    isFeatured: product?.isFeatured ?? false,
    isNew: product?.isNew ?? false,
    isBestSeller: product?.isBestSeller ?? false,
    whyWeLove: product?.whyWeLove || "",
    howToUse: product?.howToUse || "",
    benefits: product?.benefits || "",
    keyIngredients: product?.keyIngredients || "",
    benefitsImage: product?.benefitsImage || "",
  });

  // multiple ingredient images
  const parseIngredientImgs = (): string[] => {
    if (product?.ingredientsImages) {
      try { return JSON.parse(product.ingredientsImages); } catch { return []; }
    }
    if (product?.ingredientsImage) return [product.ingredientsImage];
    return [];
  };
  const [ingredientImgs, setIngredientImgs] = useState<string[]>(parseIngredientImgs);
  const [newIngredientUrl, setNewIngredientUrl] = useState("");
  const addIngredientImg = () => {
    if (!newIngredientUrl.trim()) return;
    setIngredientImgs((imgs) => [...imgs, newIngredientUrl.trim()]);
    setNewIngredientUrl("");
  };
  const removeIngredientImg = (i: number) => setIngredientImgs((imgs) => imgs.filter((_, idx) => idx !== i));

  const parseItems = (): WhyWeLoveItem[] => {
    if (!product?.whyWeLoveItems) return [{ title: "", content: "" }, { title: "", content: "" }, { title: "", content: "" }, { title: "", content: "" }];
    try { return JSON.parse(product.whyWeLoveItems); } catch { return [{ title: "", content: "" }, { title: "", content: "" }, { title: "", content: "" }, { title: "", content: "" }]; }
  };
  const [whyItems, setWhyItems] = useState<WhyWeLoveItem[]>(parseItems);

  const updateWhyItem = (i: number, key: keyof WhyWeLoveItem, value: string) =>
    setWhyItems((items) => items.map((item, idx) => idx === i ? { ...item, [key]: value } : item));

  const [variants, setVariants] = useState<Variant[]>(
    product?.variants.length ? product.variants : [{ ...EMPTY_VARIANT }]
  );

  const [images, setImages] = useState<ProductImage[]>(product?.images || []);
  const [newImageUrl, setNewImageUrl] = useState("");

  const autoSlug = (name: string) =>
    name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  const handleNameChange = (name: string) => {
    setForm((f) => ({ ...f, name, slug: product ? f.slug : autoSlug(name) }));
  };

  const addVariant = () => setVariants((vs) => [...vs, { ...EMPTY_VARIANT }]);
  const removeVariant = (i: number) => setVariants((vs) => vs.filter((_, idx) => idx !== i));
  const updateVariant = (i: number, key: string, value: unknown) =>
    setVariants((vs) => vs.map((v, idx) => idx === i ? { ...v, [key]: value } : v));

  const addImage = () => {
    if (!newImageUrl.trim()) return;
    setImages((imgs) => [
      ...imgs,
      { url: newImageUrl.trim(), altText: form.name, isPrimary: imgs.length === 0 },
    ]);
    setNewImageUrl("");
  };

  const removeImage = (i: number) => setImages((imgs) => imgs.filter((_, idx) => idx !== i));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (variants.length === 0) { toast.error("Add at least one variant"); return; }
    if (variants.some((v) => !v.name || v.price <= 0)) {
      toast.error("All variants need a name and price > 0"); return;
    }

    setSaving(true);
    try {
      const url = product ? `/api/admin/products/${product.id}` : "/api/admin/products";
      const method = product ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          gstPercent: Number(form.gstPercent),
          whyWeLoveItems: JSON.stringify(whyItems.filter((it) => it.title.trim())),
          ingredientsImages: JSON.stringify(ingredientImgs),
          ingredientsImage: null,
          variants: variants.map((v) => ({
            ...v,
            price: Number(v.price),
            comparePrice: v.comparePrice ? Number(v.comparePrice) : null,
            stock: Number(v.stock),
          })),
          images,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(product ? "Product updated!" : "Product created!");
        router.push("/admin/products");
      } else {
        toast.error(data.error?.message || "Failed to save");
      }
    } finally {
      setSaving(false);
    }
  };

  const TOGGLE_FIELDS = [
    { key: "isActive", label: "Active" },
    { key: "isFeatured", label: "Featured" },
    { key: "isNew", label: "New Arrival" },
    { key: "isBestSeller", label: "Best Seller" },
  ] as const;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/products" className="p-2 rounded-xl hover:bg-charcoal-100 transition-colors">
            <ArrowLeft size={18} className="text-charcoal-600" />
          </Link>
          <h1 className="font-body text-2xl font-semibold text-charcoal-900">
            {product ? "Edit Product" : "New Product"}
          </h1>
        </div>
        <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 py-2.5">
          <Save size={15} /> {saving ? "Saving…" : "Save Product"}
        </button>
      </div>

      <div className="grid lg:grid-cols-[1fr_300px] gap-6">
        {/* Left column */}
        <div className="space-y-5">
          {/* Basic info */}
          <div className="bg-white rounded-2xl p-6 shadow-soft border border-charcoal-50 space-y-4">
            <h2 className="font-body text-sm font-semibold text-charcoal-700">Basic Information</h2>

            <div>
              <label className="font-body text-xs font-medium text-charcoal-600 mb-1 block">Product Name *</label>
              <input
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                required className="input-base"
                placeholder="Vitamin C Serum"
              />
            </div>

            <div>
              <label className="font-body text-xs font-medium text-charcoal-600 mb-1 block">Slug *</label>
              <input
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                required className="input-base font-mono text-sm"
                placeholder="vitamin-c-serum"
              />
            </div>

            <div>
              <label className="font-body text-xs font-medium text-charcoal-600 mb-1 block">Short Description</label>
              <input
                value={form.shortDesc}
                onChange={(e) => setForm((f) => ({ ...f, shortDesc: e.target.value }))}
                className="input-base"
                placeholder="Brief product summary"
              />
            </div>

            <div>
              <label className="font-body text-xs font-medium text-charcoal-600 mb-1 block">Full Description (HTML)</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={6}
                className="input-base resize-y font-mono text-xs"
                placeholder="<p>Product details…</p>"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-body text-xs font-medium text-charcoal-600 mb-1 block">Brand</label>
                <input value={form.brand} onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))} className="input-base" />
              </div>
              <div>
                <label className="font-body text-xs font-medium text-charcoal-600 mb-1 block">SKU</label>
                <input value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} className="input-base font-mono text-sm" />
              </div>
              <div>
                <label className="font-body text-xs font-medium text-charcoal-600 mb-1 block">GST %</label>
                <select value={form.gstPercent} onChange={(e) => setForm((f) => ({ ...f, gstPercent: Number(e.target.value) }))} className="input-base">
                  {[0, 5, 12, 18, 28].map((g) => <option key={g} value={g}>{g}%</option>)}
                </select>
              </div>
              <div>
                <label className="font-body text-xs font-medium text-charcoal-600 mb-1 block">Tags</label>
                <input value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} className="input-base" placeholder="serum, vitamin-c" />
              </div>
            </div>
          </div>

          {/* Variants */}
          <div className="bg-white rounded-2xl p-6 shadow-soft border border-charcoal-50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-body text-sm font-semibold text-charcoal-700">Variants & Pricing</h2>
              <button type="button" onClick={addVariant}
                className="flex items-center gap-1.5 font-body text-xs text-brand-600 hover:text-brand-700">
                <Plus size={14} /> Add Variant
              </button>
            </div>

            <div className="space-y-3">
              {variants.map((v, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-3 bg-charcoal-50 rounded-xl"
                >
                  <div className="col-span-2 sm:col-span-1">
                    <label className="font-body text-[10px] text-charcoal-400 block mb-1">Name *</label>
                    <input value={v.name} onChange={(e) => updateVariant(i, "name", e.target.value)}
                      required placeholder="50ml" className="input-base py-2 text-sm" />
                  </div>
                  <div>
                    <label className="font-body text-[10px] text-charcoal-400 block mb-1">Price (₹) *</label>
                    <input type="number" value={v.price} onChange={(e) => updateVariant(i, "price", e.target.value)}
                      required min={1} className="input-base py-2 text-sm" />
                  </div>
                  <div>
                    <label className="font-body text-[10px] text-charcoal-400 block mb-1">MRP (₹)</label>
                    <input type="number" value={v.comparePrice || ""} onChange={(e) => updateVariant(i, "comparePrice", e.target.value)}
                      placeholder="—" className="input-base py-2 text-sm" />
                  </div>
                  <div>
                    <label className="font-body text-[10px] text-charcoal-400 block mb-1">Stock</label>
                    <input type="number" value={v.stock} onChange={(e) => updateVariant(i, "stock", e.target.value)}
                      min={0} className="input-base py-2 text-sm" />
                  </div>
                  <div className="flex items-end">
                    {variants.length > 1 && (
                      <button type="button" onClick={() => removeVariant(i)}
                        className="w-8 h-8 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 flex items-center justify-center ml-auto transition-colors">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Detail Page Content */}
          <div className="bg-white rounded-2xl p-6 shadow-soft border border-charcoal-50 space-y-4">
            <h2 className="font-body text-sm font-semibold text-charcoal-700">Detail Page Content <span className="text-charcoal-400 font-normal">(optional)</span></h2>

            <div>
              <label className="font-body text-xs font-medium text-charcoal-600 mb-1 block">Why You&apos;ll Love It — Accordion Items</label>
              <p className="font-body text-[10px] text-charcoal-400 mb-3">Each item becomes a collapsible row with ➕/➖ toggle on the product page.</p>
              <div className="space-y-3">
                {whyItems.map((item, i) => (
                  <div key={i} className="p-3 bg-charcoal-50 rounded-xl space-y-2">
                    <p className="font-body text-[10px] font-semibold text-charcoal-500 uppercase tracking-wide">Item {i + 1}</p>
                    <input
                      value={item.title}
                      onChange={(e) => updateWhyItem(i, "title", e.target.value)}
                      className="input-base text-sm"
                      placeholder={`e.g. Glowing, Brighter Skin`}
                    />
                    <textarea
                      value={item.content}
                      onChange={(e) => updateWhyItem(i, "content", e.target.value)}
                      rows={2}
                      className="input-base resize-y text-sm"
                      placeholder="Detailed description shown when expanded…"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="font-body text-xs font-medium text-charcoal-600 mb-1 block">How To Use</label>
              <textarea value={form.howToUse} onChange={(e) => setForm((f) => ({ ...f, howToUse: e.target.value }))}
                rows={3} className="input-base resize-y text-sm" placeholder="Step 1: Apply…&#10;Step 2: Massage…" />
            </div>

            <div>
              <label className="font-body text-xs font-medium text-charcoal-600 mb-1 block">Benefits</label>
              <textarea value={form.benefits} onChange={(e) => setForm((f) => ({ ...f, benefits: e.target.value }))}
                rows={3} className="input-base resize-y text-sm" placeholder="• Hydrates deeply&#10;• Reduces dark spots…" />
            </div>

            <div>
              <label className="font-body text-xs font-medium text-charcoal-600 mb-1 block">Key Ingredients</label>
              <textarea value={form.keyIngredients} onChange={(e) => setForm((f) => ({ ...f, keyIngredients: e.target.value }))}
                rows={3} className="input-base resize-y text-sm" placeholder="• Vitamin C 15%&#10;• Hyaluronic Acid…" />
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="font-body text-xs font-medium text-charcoal-600 mb-1 block">Benefits Image URL</label>
                <input value={form.benefitsImage} onChange={(e) => setForm((f) => ({ ...f, benefitsImage: e.target.value }))}
                  className="input-base text-sm" placeholder="https://res.cloudinary.com/… (1200×800px, 3:2)" />
                <p className="text-[10px] text-charcoal-400 mt-1">Recommended: 1200×800 px · 3:2 ratio · max 1 MB · JPG/PNG</p>
              </div>
              <div>
                <label className="font-body text-xs font-medium text-charcoal-600 mb-1 block">Key Ingredients Images</label>
                <p className="text-[10px] text-charcoal-400 mb-2">Add multiple images — shown as a responsive grid on the product page.</p>
                <div className="flex gap-2 mb-2">
                  <input
                    value={newIngredientUrl}
                    onChange={(e) => setNewIngredientUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addIngredientImg())}
                    className="input-base flex-1 text-sm"
                    placeholder="Paste Cloudinary URL and press Add…"
                  />
                  <button type="button" onClick={addIngredientImg} className="btn-outline text-sm py-2 px-4">Add</button>
                </div>
                {ingredientImgs.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {ingredientImgs.map((url, i) => (
                      <div key={i} className="relative group aspect-[4/3] rounded-xl overflow-hidden bg-cream-100">
                        <Image src={url} alt={`Ingredient ${i + 1}`} fill className="object-cover" sizes="150px" />
                        <button
                          type="button"
                          onClick={() => removeIngredientImg(i)}
                          className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="bg-white rounded-2xl p-6 shadow-soft border border-charcoal-50">
            <h2 className="font-body text-sm font-semibold text-charcoal-700 mb-4">Product Images</h2>
            <div className="flex gap-2 mb-3">
              <input
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="Paste Cloudinary URL…"
                className="input-base flex-1 text-sm"
              />
              <button type="button" onClick={addImage} className="btn-outline text-sm py-2 px-4">Add</button>
            </div>
            <div className="mb-4">
              <ImageUpload
                folder="diaasa/products"
                label="Upload from PC"
                onUpload={(url) => {
                  setImages((imgs) => [...imgs, { url, altText: form.name, isPrimary: imgs.length === 0 }]);
                }}
              />
            </div>
            {images.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {images.map((img, i) => (
                  <div key={i} className="relative group aspect-square rounded-xl overflow-hidden bg-cream-100">
                    <Image 
                      src={img.url} 
                      alt={img.altText || ""} 
                      fill 
                      className="object-cover"
                      sizes="(max-width: 768px) 25vw, 150px"
                    />
                    {i === 0 && (
                      <div className="absolute top-1 left-1 bg-brand-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-body font-bold">
                        Primary
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={11} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Category */}
          <div className="bg-white rounded-2xl p-5 shadow-soft border border-charcoal-50">
            <h2 className="font-body text-sm font-semibold text-charcoal-700 mb-3">Category *</h2>
            <select
              value={form.categoryId}
              onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
              required className="input-base"
            >
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Flags */}
          <div className="bg-white rounded-2xl p-5 shadow-soft border border-charcoal-50">
            <h2 className="font-body text-sm font-semibold text-charcoal-700 mb-4">Product Status</h2>
            <div className="space-y-3">
              {TOGGLE_FIELDS.map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="font-body text-sm text-charcoal-700">{label}</span>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, [key]: !f[key] }))}
                    className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
                      form[key] ? "bg-brand-500" : "bg-charcoal-200"
                    }`}
                  >
                    <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                      form[key] ? "translate-x-6" : "translate-x-0"
                    }`} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Preview */}
          {images[0] && (
            <div className="bg-white rounded-2xl p-5 shadow-soft border border-charcoal-50">
              <h2 className="font-body text-sm font-semibold text-charcoal-700 mb-3">Preview</h2>
              <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-cream-100">
                <Image 
                  src={images[0].url} 
                  alt={form.name} 
                  fill 
                  className="object-cover" 
                />
              </div>
              <p className="font-body text-sm font-medium text-charcoal-800 mt-2 line-clamp-1">{form.name || "Product Name"}</p>
              <p className="font-body text-base font-semibold text-charcoal-900">
                {variants[0]?.price ? `₹${Number(variants[0].price).toLocaleString("en-IN")}` : "₹0"}
              </p>
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
