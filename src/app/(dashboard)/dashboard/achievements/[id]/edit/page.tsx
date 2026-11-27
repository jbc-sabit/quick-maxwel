import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { db } from "@/db";
import { achievements } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import EditAchievementForm from "./form";

export default async function EditAchievementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAuth();
  const { id } = await params;

  const ach = await db.query.achievements.findFirst({
    where: and(eq(achievements.id, id), eq(achievements.userId, user.id)),
  });

  if (!ach) {
    notFound();
  }

  return <EditAchievementForm achievement={ach} />;
}

export const metadata: Metadata = { title: "Edit achievement" };
