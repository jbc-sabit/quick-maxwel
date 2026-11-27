import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { db } from "@/db";
import { services } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import EditServiceForm from "./form";

export default async function EditServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAuth();
  const { id } = await params;

  const service = await db.query.services.findFirst({
    where: and(eq(services.id, id), eq(services.userId, user.id)),
  });

  if (!service) {
    notFound();
  }

  return <EditServiceForm service={service} userHandle={user.handle} />;
}

export const metadata: Metadata = { title: "Edit service" };
