import { MetadataRoute } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/products", "/product/", "/pages/"],
        disallow: ["/admin", "/api/", "/checkout", "/orders", "/profile"],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}
