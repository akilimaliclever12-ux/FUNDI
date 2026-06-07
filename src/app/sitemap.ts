import type { MetadataRoute } from "next";
import { getApprovedWorkerIds } from "@/lib/queries/workers";
import { SITE_URL } from "@/lib/constants";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const ids = await getApprovedWorkerIds();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, priority: 1 },
    { url: `${SITE_URL}/workers`, priority: 0.9 },
    { url: `${SITE_URL}/about`, priority: 0.5 },
    { url: `${SITE_URL}/contact`, priority: 0.5 },
    { url: `${SITE_URL}/rejoindre`, priority: 0.7 },
  ];

  const workerPages: MetadataRoute.Sitemap = ids.map((id) => ({
    url: `${SITE_URL}/workers/${id}`,
    priority: 0.8,
  }));

  return [...staticPages, ...workerPages];
}
