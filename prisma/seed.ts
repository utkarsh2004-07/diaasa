import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database…");

  // Categories
  const skincare = await prisma.category.upsert({
    where: { slug: "skincare" },
    update: {},
    create: { name: "Skincare", slug: "skincare", isActive: true, sortOrder: 1 },
  });
  const haircare = await prisma.category.upsert({
    where: { slug: "haircare" },
    update: {},
    create: { name: "Haircare", slug: "haircare", isActive: true, sortOrder: 2 },
  });
  const bodycare = await prisma.category.upsert({
    where: { slug: "body-care" },
    update: {},
    create: { name: "Body Care", slug: "body-care", isActive: true, sortOrder: 3 },
  });
  const wellness = await prisma.category.upsert({
    where: { slug: "wellness" },
    update: {},
    create: { name: "Wellness", slug: "wellness", isActive: true, sortOrder: 4 },
  });

  console.log("✅ Categories created");

  // Products
  const products = [
    {
      name: "Vitamin C Brightening Serum",
      slug: "vitamin-c-brightening-serum",
      shortDesc: "Powerful antioxidant serum for radiant, even-toned skin",
      categoryId: skincare.id,
      brand: "Luxe Lab",
      gstPercent: 0,
      isActive: true, isFeatured: true, isNew: true, isBestSeller: false,
      variants: [
        { name: "30ml", price: 649, comparePrice: 899, stock: 50 },
        { name: "60ml", price: 999, comparePrice: 1299, stock: 30 },
      ],
    },
    {
      name: "Deep Hydration Face Cream",
      slug: "deep-hydration-face-cream",
      shortDesc: "72-hour moisture lock with hyaluronic acid complex",
      categoryId: skincare.id,
      brand: "Luxe Lab",
      gstPercent: 0,
      isActive: true, isFeatured: true, isNew: false, isBestSeller: true,
      variants: [
        { name: "50g", price: 799, comparePrice: 999, stock: 45 },
      ],
    },
    {
      name: "SPF 50+ Sunscreen Fluid",
      slug: "spf-50-sunscreen-fluid",
      shortDesc: "Lightweight, non-greasy broad spectrum sun protection",
      categoryId: skincare.id,
      brand: "Luxe Lab",
      gstPercent: 12,
      isActive: true, isFeatured: true, isNew: false, isBestSeller: true,
      variants: [
        { name: "50ml", price: 549, comparePrice: 699, stock: 80 },
      ],
    },
    {
      name: "Argan Oil Hair Serum",
      slug: "argan-oil-hair-serum",
      shortDesc: "Frizz-control and shine-boosting hair serum",
      categoryId: haircare.id,
      brand: "Luxe Lab",
      gstPercent: 18,
      isActive: true, isFeatured: false, isNew: true, isBestSeller: true,
      variants: [
        { name: "100ml", price: 449, comparePrice: 599, stock: 60 },
        { name: "200ml", price: 749, comparePrice: 999, stock: 25 },
      ],
    },
    {
      name: "Keratin Repair Hair Mask",
      slug: "keratin-repair-hair-mask",
      shortDesc: "Intensive overnight treatment for damaged hair",
      categoryId: haircare.id,
      brand: "Luxe Lab",
      gstPercent: 18,
      isActive: true, isFeatured: true, isNew: false, isBestSeller: false,
      variants: [
        { name: "200g", price: 599, comparePrice: 799, stock: 35 },
      ],
    },
    {
      name: "Rose Glow Body Butter",
      slug: "rose-glow-body-butter",
      shortDesc: "Rich, velvety body moisturiser with rose extract",
      categoryId: bodycare.id,
      brand: "Luxe Lab",
      gstPercent: 18,
      isActive: true, isFeatured: true, isNew: true, isBestSeller: false,
      variants: [
        { name: "150g", price: 399, comparePrice: 499, stock: 70 },
      ],
    },
    {
      name: "Retinol Night Renewal Cream",
      slug: "retinol-night-renewal-cream",
      shortDesc: "Anti-ageing night cream with 0.3% encapsulated retinol",
      categoryId: skincare.id,
      brand: "Luxe Lab",
      gstPercent: 18,
      isActive: true, isFeatured: true, isNew: false, isBestSeller: true,
      variants: [
        { name: "30ml", price: 1299, comparePrice: 1599, stock: 20 },
      ],
    },
    {
      name: "Niacinamide 10% Toner",
      slug: "niacinamide-10-toner",
      shortDesc: "Pore-minimising and oil-balancing facial toner",
      categoryId: skincare.id,
      brand: "Luxe Lab",
      gstPercent: 18,
      isActive: true, isFeatured: false, isNew: true, isBestSeller: false,
      variants: [
        { name: "100ml", price: 349, comparePrice: 449, stock: 55 },
      ],
    },
  ];

  for (const p of products) {
    const { variants, ...productData } = p;
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        ...productData,
        variants: { create: variants.map((v) => ({ ...v, isActive: true })) },
      },
    });
  }

  console.log("✅ Products created");

  // Default hero banner
  await prisma.banner.upsert({
    where: { id: "default-hero-1" },
    update: {},
    create: {
      id: "default-hero-1",
      title: "Glow From Within",
      image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1600",
      link: "/products?category=skincare",
      type: "HERO",
      isActive: true,
      priority: 0,
    },
  });

  console.log("✅ Banners created");

  // Default coupons
  await prisma.coupon.upsert({
    where: { code: "LUXE10" },
    update: {},
    create: {
      code: "LUXE10",
      type: "PERCENTAGE",
      value: 10,
      minCartValue: 500,
      maxDiscount: 200,
      usageLimit: 1000,
      description: "10% off on your first order",
      isActive: true,
    },
  });

  await prisma.coupon.upsert({
    where: { code: "FLAT100" },
    update: {},
    create: {
      code: "FLAT100",
      type: "FLAT",
      value: 100,
      minCartValue: 999,
      description: "₹100 flat off on orders above ₹999",
      isActive: true,
    },
  });

  console.log("✅ Coupons created");

  // Default settings
  const defaultSettings = [
    { key: "store_name", value: "Luxe Store" },
    { key: "store_tagline", value: "Premium Beauty & Skincare" },
    { key: "store_email", value: "hello@luxestore.com" },
    { key: "store_phone", value: "+91 98765 43210" },
    { key: "free_shipping_above", value: "500" },
    { key: "shipping_charge", value: "49" },
    { key: "cod_enabled", value: "true" },
    { key: "default_gst_percent", value: "18" },
  ];

  for (const s of defaultSettings) {
    await prisma.setting.upsert({ where: { key: s.key }, update: {}, create: s });
  }

  console.log("✅ Settings created");

  // Static pages
  const staticPages = [
    { slug: "about", title: "About Us", content: "<h2>About Luxe Store</h2><p>We are a premium beauty and skincare brand committed to bringing you the finest formulations.</p>" },
    { slug: "terms", title: "Terms & Conditions", content: "<h2>Terms & Conditions</h2><p>By using our services, you agree to these terms.</p>" },
    { slug: "privacy", title: "Privacy Policy", content: "<h2>Privacy Policy</h2><p>We respect your privacy and protect your personal data.</p>" },
    { slug: "refund", title: "Refund Policy", content: "<h2>Refund Policy</h2><p>We offer 7-day easy returns on all products.</p>" },
    { slug: "shipping", title: "Shipping Policy", content: "<h2>Shipping Policy</h2><p>Free shipping on orders above ₹500. Standard delivery in 4-7 business days.</p>" },
  ];

  for (const page of staticPages) {
    await prisma.staticPage.upsert({ where: { slug: page.slug }, update: {}, create: page });
  }

  console.log("✅ Static pages created");
  console.log("🎉 Seeding complete!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
