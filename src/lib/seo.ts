import type { Metadata } from "next";
import type { PortfolioUser } from "@/lib/portfolio-data";

export const SITE_NAME = "PortfoliooSite";

/** Absolute origin used to resolve relative canonical / image URLs. */
export function siteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}

/** Plain text from HTML/markdown-ish content, collapsed and truncated for meta descriptions. */
export function toDescription(input: string | null | undefined, max = 160): string {
  if (!input) return "";
  const text = input
    .replace(/<[^>]*>/g, " ")
    .replace(/[#*_`>~\[\]]/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= max) return text;
  return text.slice(0, max - 1).replace(/\s+\S*$/, "") + "…";
}

type PageMeta = {
  /** Page title without the "| Name" suffix (added by the portfolio layout template). */
  title?: string;
  description?: string;
  /** Path under the portfolio, e.g. "/projects/atlas". */
  path?: string;
  type?: "website" | "article" | "profile";
  keywords?: string[];
  publishedTime?: Date | string;
};

/** Full metadata for a public portfolio page (title, description, canonical, Open Graph, Twitter). */
export function portfolioMeta(p: PortfolioUser, o: PageMeta = {}): Metadata {
  const homeTitle = p.settings?.seoTitle || [p.name, p.headline].filter(Boolean).join(" — ");
  const title = o.title ?? homeTitle;
  const description =
    o.description ||
    p.settings?.seoDescription ||
    toDescription(p.bio) ||
    `${p.name}'s portfolio${p.headline ? ` — ${p.headline}` : ""}.`;
  const url = `/${p.handle}${o.path ?? ""}`;
  const ogTitle = o.title ? `${o.title} | ${p.name}` : title;

  return {
    title: o.title ? o.title : { absolute: title },
    description,
    keywords: o.keywords,
    authors: [{ name: p.name }],
    alternates: { canonical: url },
    // Template previews and Theme Studio renders aren't the real site.
    robots: p.isPreview || p.isStudioPreview ? { index: false, follow: false } : undefined,
    openGraph: {
      type: o.type ?? "website",
      siteName: p.name,
      title: ogTitle,
      description,
      url,
      ...(o.type === "article" && o.publishedTime
        ? { publishedTime: new Date(o.publishedTime).toISOString(), authors: [p.name] }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description,
    },
  };
}
