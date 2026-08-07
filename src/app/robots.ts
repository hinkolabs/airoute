import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/kr/workspace/admin",
          "/kr/workspace/admin/",
          "/test-entitlement.html",
          "/test-entitlement-lock.html",
        ],
      },
    ],
    sitemap: "https://www.airoute.ai/sitemap.xml",
  };
}











