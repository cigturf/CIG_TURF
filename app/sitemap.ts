import type { MetadataRoute } from "next";

import { getAppConfig } from "@/config/app.config";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getAppConfig().url.replace(/\/$/, "");
  const now = new Date();

  return [
    { url: `${baseUrl}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/book`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/login`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
  ];
}
