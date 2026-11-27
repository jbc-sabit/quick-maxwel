import type { Metadata } from "next";
import { portfolioMeta, toDescription } from "@/lib/seo";
import { getPortfolioData } from "@/lib/portfolio-data";
import EventsPageDispatcher from "@/components/templates/subpages/events-page-dispatcher";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const p = await getPortfolioData(handle);
  const items = p.events.slice(0, 3).map((e) => e.title).join(", ");
  return portfolioMeta(p, {
    title: "Events & Talks",
    path: "/events",
    description: items ? `Talks, workshops and events with ${p.name}: ${items}.` : `Talks, workshops and events with ${p.name}.`,
  });
}

export default async function EventsPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const portfolio = await getPortfolioData(handle);

  return <EventsPageDispatcher portfolio={portfolio} handle={handle} />;
}
