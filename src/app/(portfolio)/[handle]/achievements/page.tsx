import type { Metadata } from "next";
import { portfolioMeta, toDescription } from "@/lib/seo";
import { getPortfolioData } from "@/lib/portfolio-data";
import AchievementsPageDispatcher from "@/components/templates/subpages/achievements-page-dispatcher";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const p = await getPortfolioData(handle);
  const items = p.achievements.slice(0, 3).map((a) => a.title).join(", ");
  return portfolioMeta(p, {
    title: "Achievements",
    path: "/achievements",
    description: items ? `Certifications and achievements by ${p.name}: ${items}.` : `Certifications and achievements by ${p.name}.`,
  });
}

export default async function AchievementsPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const portfolio = await getPortfolioData(handle);

  return <AchievementsPageDispatcher portfolio={portfolio} handle={handle} />;
}
