import type { Metadata } from "next";
import { portfolioMeta, toDescription } from "@/lib/seo";
import { getPortfolioData } from "@/lib/portfolio-data";
import ProjectDetailPageDispatcher from "@/components/templates/subpages/project-detail-dispatcher";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string; slug: string }>;
}): Promise<Metadata> {
  const { handle, slug } = await params;
  const p = await getPortfolioData(handle);
  const project = p.projects.find((x) => x.slug === slug);
  if (!project) return { title: "Project not found" };
  return portfolioMeta(p, {
    title: project.title,
    path: `/projects/${slug}`,
    description: `${toDescription(project.summary, 140).replace(/[.\s]+$/, "")} — a project by ${p.name}.`,
    keywords: project.techStack ?? undefined,
  });
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ handle: string; slug: string }>;
}) {
  const { handle, slug } = await params;
  const portfolio = await getPortfolioData(handle);

  const project = portfolio.projects.find((p) => p.slug === slug);
  if (!project) {
    notFound();
  }

  return <ProjectDetailPageDispatcher portfolio={portfolio} project={project} handle={handle} />;
}
