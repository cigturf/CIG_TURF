import type { MetadataRoute } from "next";

import { getAppConfig } from "@/config/app.config";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getAppConfig().url.replace(/\/$/, "");

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/customer/", "/book/details", "/booking/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
