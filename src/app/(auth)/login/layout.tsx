import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your PortfoliooSite dashboard to manage your portfolio, projects, articles and inquiries.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
