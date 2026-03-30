import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://tracker.kelby.in/sitemap.xml",
    host: "https://tracker.kelby.in",
  };
}
