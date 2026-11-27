import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { db } from "@/db";
import { portfolioSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import ThemeStudioForm from "./studio-form";

export default async function DashboardThemePage() {
  const user = await requireAuth();

  const settings = await db.query.portfolioSettings.findFirst({
    where: eq(portfolioSettings.userId, user.id),
  });

  return (
    <ThemeStudioForm
      settings={settings || null}
      user={{
        handle: user.handle,
        name: user.name,
        headline: user.headline,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
      }}
    />
  );
}

export const metadata: Metadata = { title: "Theme Studio" };
