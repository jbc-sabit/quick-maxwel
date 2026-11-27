import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { db } from "@/db";
import { events } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import EditEventForm from "./form";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAuth();
  const { id } = await params;

  const event = await db.query.events.findFirst({
    where: and(eq(events.id, id), eq(events.userId, user.id)),
  });

  if (!event) {
    notFound();
  }

  return <EditEventForm event={event} userHandle={user.handle} />;
}

export const metadata: Metadata = { title: "Edit event" };
