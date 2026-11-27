import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import ProfileForm from "./profile-form";

export default async function DashboardProfilePage() {
  const sessionUser = await requireAuth();

  const user = await db.query.users.findFirst({
    where: eq(users.id, sessionUser.id),
  });

  if (!user) {
    throw new Error("User not found");
  }

  return (
    <ProfileForm
      user={{
        handle: user.handle,
        name: user.name,
        email: user.email,
        headline: user.headline,
        bio: user.bio,
        location: user.location,
        avatarUrl: user.avatarUrl,
        cvUrl: user.cvUrl,
        socialLinks: user.socialLinks,
      }}
    />
  );
}

export const metadata: Metadata = { title: "Profile" };
