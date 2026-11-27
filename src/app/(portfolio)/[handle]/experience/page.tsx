import type { Metadata } from "next";
import { portfolioMeta, toDescription } from "@/lib/seo";
import { getPortfolioData } from "@/lib/portfolio-data";
import ExperiencePageDispatcher from "@/components/templates/subpages/experience-page-dispatcher";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const p = await getPortfolioData(handle);
  const roles = p.experiences.slice(0, 3).map((e) => `${e.role} at ${e.company}`).join(", ");
  return portfolioMeta(p, {
    title: "Experience",
    path: "/experience",
    description: roles ? `${p.name}'s work experience: ${roles}.` : `${p.name}'s career history and experience.`,
  });
}

export default async function ExperiencePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const portfolio = await getPortfolioData(handle);

  return <ExperiencePageDispatcher portfolio={portfolio} handle={handle} />;
}
