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
  blog:        "blog",
  product:     (slug: string) => `product-${slug}`,
  blogPost:    (slug: string) => `blog-${slug}`,
} as const;
