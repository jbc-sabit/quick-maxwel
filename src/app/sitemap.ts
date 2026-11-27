import type { MetadataRoute } from "next";
import { db } from "@/db";
import { articles, events, projects, services, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { siteUrl } from "@/lib/seo";

// Built from the database on request, so it never goes stale or needs a DB at build time.
export const dynamic = "force-dynamic";

const SECTIONS = ["experience", "projects", "achievements", "articles", "services", "events", "contact"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const entries: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/register`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/login`, changeFrequency: "yearly", priority: 0.2 },
  ];

  try {
    const [people, projs, arts, evs, svcs] = await Promise.all([
      db.select({ id: users.id, handle: users.handle, updatedAt: users.updatedAt }).from(users),
      db.select({ userId: projects.userId, slug: projects.slug, updatedAt: projects.updatedAt }).from(projects),
      db
        .select({ userId: articles.userId, slug: articles.slug, updatedAt: articles.updatedAt })
        .from(articles)
        .where(eq(articles.isPublished, true)),
      db.select({ userId: events.userId, slug: events.slug, updatedAt: events.updatedAt }).from(events),
      db.select({ userId: services.userId, slug: services.slug, updatedAt: services.updatedAt }).from(services),
    ]);
    const handleById = new Map(people.map((u) => [u.id, u.handle]));

    for (const u of people) {
      entries.push({ url: `${base}/${u.handle}`, lastModified: u.updatedAt, changeFrequency: "weekly", priority: 0.8 });
      for (const s of SECTIONS) {
        entries.push({ url: `${base}/${u.handle}/${s}`, lastModified: u.updatedAt, changeFrequency: "weekly", priority: 0.6 });
      }
    }
    const detail = (rows: { userId: string; slug: string; updatedAt: Date }[], seg: string) => {
      for (const r of rows) {
        const handle = handleById.get(r.userId);
        if (handle) {
          entries.push({ url: `${base}/${handle}/${seg}/${r.slug}`, lastModified: r.updatedAt, changeFrequency: "monthly", priority: 0.5 });
        }
      }
    };
    detail(projs, "projects");
    detail(arts, "articles");
    detail(evs, "events");
    detail(svcs, "services");
  } catch (err) {
    console.error("sitemap: database unavailable, serving static entries only", err);
  }
  return entries;
}
