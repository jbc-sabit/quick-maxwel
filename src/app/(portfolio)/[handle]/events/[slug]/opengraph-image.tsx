import { notFound } from "next/navigation";
import { getPortfolioData } from "@/lib/portfolio-data";
import { OG_CONTENT_TYPE, OG_SIZE, loadImage, portfolioHost, renderCard } from "@/lib/og";

export const alt = "Event";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({
  params,
}: {
  params: Promise<{ handle: string; slug: string }>;
}) {
  const { handle, slug } = await params;
  const p = await getPortfolioData(handle);
  const event = p.events.find((x) => x.slug === slug);
  if (!event) notFound();
  return renderCard({
    eyebrow: `${event.eventType} · ${event.date}`,
    title: event.title,
    subtitle: event.description || event.location,
    byline: p.name,
    host: portfolioHost(p.handle),
    background: await loadImage(null),
  });
}
