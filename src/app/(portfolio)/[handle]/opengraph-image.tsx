import { getPortfolioData } from "@/lib/portfolio-data";
import { OG_CONTENT_TYPE, OG_SIZE, loadImage, portfolioHost, renderCard } from "@/lib/og";

export const alt = "Portfolio";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const p = await getPortfolioData(handle);
  return renderCard({
    eyebrow: "Portfolio",
    title: p.name,
    subtitle: p.headline || p.bio,
    byline: p.location || undefined,
    host: portfolioHost(p.handle),
    avatar: await loadImage(p.avatarUrl),
  });
}
