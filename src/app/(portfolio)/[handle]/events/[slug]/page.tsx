import type { Metadata } from "next";
import { portfolioMeta, toDescription } from "@/lib/seo";
import { getPortfolioData } from "@/lib/portfolio-data";
import EventDetailPageDispatcher from "@/components/templates/subpages/event-detail-dispatcher";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string; slug: string }>;
}): Promise<Metadata> {
  const { handle, slug } = await params;
  const p = await getPortfolioData(handle);
  const event = p.events.find((x) => x.slug === slug);
  if (!event) return { title: "Event not found" };
  const when = [event.eventType, event.date, event.location].filter(Boolean).join(" · ");
  return portfolioMeta(p, {
    title: event.title,
    path: `/events/${slug}`,
    description: toDescription(event.description) || `${when} with ${p.name}.`,
  });
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ handle: string; slug: string }>;
}) {
  const { handle, slug } = await params;
  const portfolio = await getPortfolioData(handle);

  const event = portfolio.events.find((e) => e.slug === slug);
  if (!event) {
    notFound();
  }

  return <EventDetailPageDispatcher portfolio={portfolio} event={event} handle={handle} />;
}
