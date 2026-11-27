import type { Metadata } from "next";
import { portfolioMeta, toDescription } from "@/lib/seo";
import { getPortfolioData } from "@/lib/portfolio-data";
import ArticlesPageDispatcher from "@/components/templates/subpages/articles-page-dispatcher";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const p = await getPortfolioData(handle);
  const items = p.articles.slice(0, 3).map((a) => a.title).join(", ");
  return portfolioMeta(p, {
    title: "Articles",
    path: "/articles",
    description: items ? `Articles and writing by ${p.name}: ${items}.` : `Articles and writing by ${p.name}.`,
  });
}

export default async function ArticlesListPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const portfolio = await getPortfolioData(handle);

  return <ArticlesPageDispatcher portfolio={portfolio} handle={handle} />;
}
