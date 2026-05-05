export const TAGS = {
  banners:     "banners",
  products:    "products",
  categories:  "categories",
  socialPosts: "social-posts",
  dashboard:   "dashboard",
  reviews:     "reviews",
  settings:    "settings",
  pages:       "pages",
  coupons:     "coupons",
  product:     (slug: string) => `product-${slug}`,
} as const;
