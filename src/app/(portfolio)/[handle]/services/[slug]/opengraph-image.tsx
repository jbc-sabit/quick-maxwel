import { notFound } from "next/navigation";
import { getPortfolioData } from "@/lib/portfolio-data";
import { OG_CONTENT_TYPE, OG_SIZE, loadImage, portfolioHost, renderCard } from "@/lib/og";

export const alt = "Service";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({
  params,
}: {
  params: Promise<{ handle: string; slug: string }>;
}) {
  const { handle, slug } = await params;
  const p = await getPortfolioData(handle);
  const service = p.services.find((x) => x.slug === slug);
  if (!service) notFound();
  return renderCard({
    eyebrow: service.price ? `Service · ${service.price}` : "Service",
    title: service.title,
    subtitle: service.shortDescription,
    byline: p.name,
    host: portfolioHost(p.handle),
    background: await loadImage(null),
  });
}
