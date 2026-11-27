import type { Metadata } from "next";
import { portfolioMeta, toDescription } from "@/lib/seo";
import { getPortfolioData } from "@/lib/portfolio-data";
import ArticleDetailPageDispatcher from "@/components/templates/subpages/article-detail-dispatcher";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string; slug: string }>;
}): Promise<Metadata> {
  const { handle, slug } = await params;
  const p = await getPortfolioData(handle);
  const article = p.articles.find((x) => x.slug === slug);
  if (!article) return { title: "Article not found" };
  return portfolioMeta(p, {
    title: article.title,
    path: `/articles/${slug}`,
    description: toDescription(article.excerpt) || toDescription(article.content),
    type: "article",
    keywords: article.tags ?? undefined,
    publishedTime: article.publishedAt,
  });
}

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ handle: string; slug: string }>;
}) {
  const { handle, slug } = await params;
  const portfolio = await getPortfolioData(handle);

  const article = portfolio.articles.find((a) => a.slug === slug);
  if (!article) {
    notFound();
  }

  return <ArticleDetailPageDispatcher portfolio={portfolio} article={article} handle={handle} />;
}
