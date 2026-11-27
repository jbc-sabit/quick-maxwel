import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { db } from "@/db";
import { articles } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import EditArticleForm from "./form";

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAuth();
  const { id } = await params;

  const article = await db.query.articles.findFirst({
    where: and(eq(articles.id, id), eq(articles.userId, user.id)),
  });

  if (!article) {
    notFound();
  }

  return <EditArticleForm article={article} userHandle={user.handle} />;
}

export const metadata: Metadata = { title: "Edit article" };
