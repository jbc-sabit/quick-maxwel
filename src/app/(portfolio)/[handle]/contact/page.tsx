import type { Metadata } from "next";
import { portfolioMeta, toDescription } from "@/lib/seo";
import { getPortfolioData } from "@/lib/portfolio-data";
import ContactPageDispatcher from "@/components/templates/subpages/contact-page-dispatcher";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const p = await getPortfolioData(handle);
  return portfolioMeta(p, {
    title: "Contact",
    path: "/contact",
    description: `Get in touch with ${p.name}${p.headline ? `, ${p.headline}` : ""}. Send a message or an inquiry.`,
  });
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const portfolio = await getPortfolioData(handle);
  const templateId = portfolio.settings?.templateId || "simple_professional";

  return <ContactPageDispatcher handle={handle} templateId={templateId} />;
}
