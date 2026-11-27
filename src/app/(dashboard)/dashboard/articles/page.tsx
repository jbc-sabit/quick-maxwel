import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { db } from "@/db";
import { articles } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Plus, FileText, Star, Trash2, Edit3, ExternalLink, Calendar, Clock } from "lucide-react";
import Link from "next/link";
import { deleteArticleAction, toggleArticleFeaturedAction } from "@/actions/articles";

export default async function DashboardArticlesPage() {
  const user = await requireAuth();

  const userArticles = await db.query.articles.findMany({
    where: eq(articles.userId, user.id),
    orderBy: [desc(articles.publishedAt)],
  });

  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-50 flex items-center gap-2.5">
            <FileText className="h-7 w-7 text-blue-400" />
            <span>Articles</span>
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Write, publish, and feature technical deep-dives and essays on your portfolio.
          </p>
        </div>

        <Button asChild className="h-11 px-5 rounded-xl bg-sky-500 hover:bg-sky-400 text-black text-sm font-semibold transition-all shadow-lg shadow-sky-500/10">
          <Link href="/dashboard/articles/new">
            <Plus className="h-4 w-4 mr-2" />
            <span>New Article</span>
          </Link>
        </Button>
      </div>

      {/* List */}
      {userArticles.length === 0 ? (
        <Card className="bg-zinc-900/40 border-zinc-800/80 rounded-2xl p-12 text-center space-y-4">
          <div className="h-12 w-12 rounded-2xl bg-zinc-800/80 flex items-center justify-center mx-auto text-zinc-400">
            <FileText className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-lg text-zinc-100">No articles published yet</h3>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-sm mx-auto">
              Draft your first technical guide or essay to showcase your knowledge.
            </p>
          </div>
          <Button asChild className="h-10 px-4 rounded-xl bg-sky-500 text-black font-semibold text-xs">
            <Link href="/dashboard/articles/new">Write Your First Article</Link>
          </Button>
        </Card>
      ) : (
        <div className="space-y-3.5">
          {userArticles.map((article) => (
            <Card
              key={article.id}
              className="bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700/80 rounded-2xl p-6 py-5 gap-0 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {article.isFeatured && (
                    <Badge variant="outline" className="border-amber-500/30 text-amber-400 bg-amber-500/10 text-xs px-2 py-0.5">
                      <Star className="h-3 w-3 mr-1 fill-amber-400" />
                      Featured
                    </Badge>
                  )}
                  <Badge variant="secondary" className={`text-xs px-2 py-0.5 ${article.isPublished ? "bg-sky-500/10 text-sky-400 border border-sky-500/20" : "bg-zinc-800 text-zinc-400"}`}>
                    {article.isPublished ? "Published" : "Draft"}
                  </Badge>
                  <span className="text-xs text-zinc-500 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {article.readTime}
                  </span>
                </div>

                <div>
                  <h2 className="font-bold text-lg text-zinc-100 hover:text-sky-400 transition-colors">
                    {article.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-zinc-400 line-clamp-1 mt-0.5">
                    {article.excerpt || "No summary provided."}
                  </p>
                </div>

                <div className="text-[11px] font-mono text-zinc-500">
                  Slug: /{user.handle}/articles/{article.slug}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-zinc-800/60">
                <form action={toggleArticleFeaturedAction.bind(null, article.id, article.isFeatured)}>
                  <Button
                    type="submit"
                    variant="outline"
                    size="sm"
                    className={`h-9 px-3 rounded-lg text-xs border-zinc-800 hover:border-zinc-700 ${article.isFeatured ? "text-amber-400 bg-amber-500/10" : "text-zinc-400"}`}
                  >
                    <Star className={`h-3.5 w-3.5 mr-1.5 ${article.isFeatured ? "fill-amber-400" : ""}`} />
                    <span>{article.isFeatured ? "Unfeature" : "Feature"}</span>
                  </Button>
                </form>

                <Button asChild variant="outline" size="sm" className="h-9 px-3 rounded-lg text-xs border-zinc-800 hover:border-zinc-700 text-zinc-300">
                  <Link href={`/${user.handle}/articles/${article.slug}`} target="_blank">
                    <ExternalLink className="h-3.5 w-3.5 mr-1.5 text-zinc-400" />
                    <span>View</span>
                  </Link>
                </Button>

                <Button asChild variant="outline" size="sm" className="h-9 px-3 rounded-lg text-xs border-zinc-800 hover:border-zinc-700 text-zinc-300">
                  <Link href={`/dashboard/articles/${article.id}/edit`}>
                    <Edit3 className="h-3.5 w-3.5 mr-1.5 text-blue-400" />
                    <span>Edit</span>
                  </Link>
                </Button>

                <form action={deleteArticleAction.bind(null, article.id)}>
                  <Button
                    type="submit"
                    variant="ghost"
                    size="sm"
                    className="h-9 px-2.5 rounded-lg text-xs text-zinc-500 hover:text-red-400 hover:bg-red-500/10"
                    title="Delete Article"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export const metadata: Metadata = { title: "Articles" };
