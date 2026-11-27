import type { Metadata } from "next";
import { portfolioMeta, toDescription } from "@/lib/seo";
import { getPortfolioData } from "@/lib/portfolio-data";
import ServiceDetailPageDispatcher from "@/components/templates/subpages/service-detail-dispatcher";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string; slug: string }>;
}): Promise<Metadata> {
  const { handle, slug } = await params;
  const p = await getPortfolioData(handle);
  const service = p.services.find((x) => x.slug === slug);
  if (!service) return { title: "Service not found" };
  return portfolioMeta(p, {
    title: service.title,
    path: `/services/${slug}`,
    description: `${toDescription(service.shortDescription, 130)}${service.price ? ` From ${service.price}.` : ""} Offered by ${p.name}.`,
  });
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ handle: string; slug: string }>;
}) {
  const { handle, slug } = await params;
  const portfolio = await getPortfolioData(handle);

  const service = portfolio.services.find((s) => s.slug === slug);
  if (!service) {
    notFound();
  }

  return <ServiceDetailPageDispatcher portfolio={portfolio} service={service} handle={handle} />;
}
