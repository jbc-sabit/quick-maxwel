import type { Metadata } from "next";
import { portfolioMeta, toDescription } from "@/lib/seo";
import { getPortfolioData } from "@/lib/portfolio-data";
import ServicesPageDispatcher from "@/components/templates/subpages/services-page-dispatcher";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const p = await getPortfolioData(handle);
  const items = p.services.slice(0, 3).map((s) => s.title).join(", ");
  return portfolioMeta(p, {
    title: "Services",
    path: "/services",
    description: items ? `Services offered by ${p.name}: ${items}.` : `Work with ${p.name}: services and packages.`,
  });
}

export default async function ServicesPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const portfolio = await getPortfolioData(handle);

  return <ServicesPageDispatcher portfolio={portfolio} handle={handle} />;
}
