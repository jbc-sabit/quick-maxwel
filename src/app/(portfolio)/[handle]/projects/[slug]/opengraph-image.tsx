import { notFound } from "next/navigation";
import { getPortfolioData } from "@/lib/portfolio-data";
import { OG_CONTENT_TYPE, OG_SIZE, loadImage, portfolioHost, renderCard } from "@/lib/og";

export const alt = "Project";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({
  params,
}: {
  params: Promise<{ handle: string; slug: string }>;
}) {
  const { handle, slug } = await params;
  const p = await getPortfolioData(handle);
  const project = p.projects.find((x) => x.slug === slug);
  if (!project) notFound();
  return renderCard({
    eyebrow: "Project",
    title: project.title,
    subtitle: project.summary,
    byline: p.name,
    host: portfolioHost(p.handle),
    background: await loadImage(project.coverImageUrl),
  });
}
