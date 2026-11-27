import { notFound } from "next/navigation";
import { getPortfolioData } from "@/lib/portfolio-data";
import { OG_CONTENT_TYPE, OG_SIZE, loadImage, portfolioHost, renderCard } from "@/lib/og";

export const alt = "Article";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({
  params,
}: {
  params: Promise<{ handle: string; slug: string }>;
}) {
  const { handle, slug } = await params;
  const p = await getPortfolioData(handle);
  const article = p.articles.find((x) => x.slug === slug);
  if (!article) notFound();
  return renderCard({
    eyebrow: `Article · ${article.readTime ?? ""}`.replace(/ · $/, ""),
    title: article.title,
    subtitle: article.excerpt || article.content,
    byline: p.name,
    host: portfolioHost(p.handle),
    background: await loadImage(article.coverImageUrl),
  });
}
