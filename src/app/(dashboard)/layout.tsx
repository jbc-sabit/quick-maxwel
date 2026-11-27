import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export const metadata: Metadata = {
  title: { default: "Dashboard", template: "%s | Dashboard" },
  // Private area: keep it out of search results.
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAuth();

  return (
    <DashboardShell user={user}>
      {children}
    </DashboardShell>
  );
}
