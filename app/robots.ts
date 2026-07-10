import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: "https://main.d3ag7o87gtn2c8.amplifyapp.com/sitemap.xml",
  };
}
