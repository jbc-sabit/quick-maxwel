import type { Metadata } from "next";
import { portfolioMeta, toDescription } from "@/lib/seo";
import { getPortfolioData } from "@/lib/portfolio-data";
import ProjectsPageDispatcher from "@/components/templates/subpages/projects-page-dispatcher";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const p = await getPortfolioData(handle);
  const items = p.projects.slice(0, 3).map((x) => x.title).join(", ");
  return portfolioMeta(p, {
    title: "Projects",
    path: "/projects",
    description: items ? `Projects by ${p.name}: ${items}.` : `Projects built by ${p.name}.`,
  });
}

export default async function ProjectsPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const portfolio = await getPortfolioData(handle);

  return <ProjectsPageDispatcher portfolio={portfolio} handle={handle} />;
}
