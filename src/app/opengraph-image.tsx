import { OG_CONTENT_TYPE, OG_SIZE, renderCard } from "@/lib/og";
import { ROOT_DOMAIN } from "@/lib/site";

export const alt = "PortfoliooSite — your portfolio on your own subdomain";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderCard({
    eyebrow: "Portfolio platform",
    title: "Your portfolio on your own subdomain",
    subtitle: "Six templates, LinkedIn import, projects, articles, services and an inbox — live in minutes.",
    host: `you.${ROOT_DOMAIN}`,
  });
}
