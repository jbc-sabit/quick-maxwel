import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create your portfolio",
  description: "Claim your own subdomain and publish a multi-page portfolio in seconds. Choose a template and go live for free.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
