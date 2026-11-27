import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { db } from "@/db";
import { experiences } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import EditExperienceForm from "./form";

export default async function EditExperiencePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAuth();
  const { id } = await params;

  const exp = await db.query.experiences.findFirst({
    where: and(eq(experiences.id, id), eq(experiences.userId, user.id)),
  });

  if (!exp) {
    notFound();
  }

  return <EditExperienceForm experience={exp} />;
}

export const metadata: Metadata = { title: "Edit position" };
