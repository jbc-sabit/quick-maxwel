import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { db } from "@/db";
import { projects, PROJECT_STATUS_LABELS } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Plus, FolderKanban, Star, Trash2, Edit3, ExternalLink } from "lucide-react";
import Link from "next/link";
import { deleteProjectAction, toggleProjectFeaturedAction } from "@/actions/projects";

export default async function DashboardProjectsPage() {
  const user = await requireAuth();

  const userProjects = await db.query.projects.findMany({
    where: eq(projects.userId, user.id),
    orderBy: [asc(projects.orderIndex), asc(projects.createdAt)],
  });

  return (
    <div className="w-full space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-50 flex items-center gap-2.5">
            <FolderKanban className="h-7 w-7 text-emerald-400" />
            <span>Projects</span>
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Showcase products, open-source work, client builds, and side projects.
          </p>
        </div>

        <Button asChild className="h-11 px-5 rounded-xl bg-sky-500 hover:bg-sky-400 text-black text-sm font-semibold transition-all shadow-lg shadow-sky-500/10">
          <Link href="/dashboard/projects/new">
            <Plus className="h-4 w-4 mr-2" />
            <span>Add Project</span>
          </Link>
        </Button>
      </div>

      {userProjects.length === 0 ? (
        <Card className="bg-zinc-900/40 border-zinc-800/80 rounded-2xl p-12 text-center space-y-4">
          <div className="h-12 w-12 rounded-2xl bg-zinc-800/80 flex items-center justify-center mx-auto text-zinc-400">
            <FolderKanban className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-lg text-zinc-100">No projects yet</h3>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-sm mx-auto">
              Add the work you&apos;re proudest of, with links, tech stack, and a short case study.
            </p>
          </div>
          <Button asChild className="h-10 px-4 rounded-xl bg-sky-500 text-black font-semibold text-xs">
            <Link href="/dashboard/projects/new">Add Your First Project</Link>
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {userProjects.map((project) => (
            <Card
              key={project.id}
              className="bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700/80 rounded-2xl p-6 py-5 gap-0 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {project.isFeatured && (
                      <Badge variant="outline" className="border-amber-500/30 text-amber-400 bg-amber-500/10 text-xs px-2 py-0.5">
                        <Star className="h-3 w-3 mr-1 fill-amber-400" />
                        Featured
                      </Badge>
                    )}
                    <span className="text-xs font-semibold text-emerald-400">
                      {PROJECT_STATUS_LABELS[project.status] ?? project.status}
                    </span>
                  </div>
                  {project.timeline && (
                    <span className="text-xs font-mono text-zinc-500">{project.timeline}</span>
                  )}
                </div>

                <h2 className="font-bold text-base sm:text-lg text-zinc-100">{project.title}</h2>

                <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">{project.summary}</p>

                {project.techStack && project.techStack.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {project.techStack.slice(0, 5).map((tech) => (
                      <Badge key={tech} variant="outline" className="text-[10px] border-zinc-700 text-zinc-300 px-1.5 py-0">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-zinc-800/60">
                <form action={toggleProjectFeaturedAction.bind(null, project.id, project.isFeatured)}>
                  <Button
                    type="submit"
                    variant="outline"
                    size="sm"
                    className={`h-8 px-2.5 rounded-lg text-xs border-zinc-800 hover:border-zinc-700 ${project.isFeatured ? "text-amber-400 bg-amber-500/10" : "text-zinc-400"}`}
                  >
                    <Star className={`h-3 w-3 mr-1 ${project.isFeatured ? "fill-amber-400" : ""}`} />
                    <span>{project.isFeatured ? "Unfeature" : "Feature"}</span>
                  </Button>
                </form>

                <div className="flex items-center gap-1.5">
                  <Button asChild variant="outline" size="sm" className="h-8 px-2.5 rounded-lg text-xs border-zinc-800 hover:border-zinc-700 text-zinc-300">
                    <Link href={`/${user.handle}/projects/${project.slug}`} target="_blank">
                      <ExternalLink className="h-3 w-3 mr-1 text-zinc-400" />
                      <span>View</span>
                    </Link>
                  </Button>

                  <Button asChild variant="outline" size="sm" className="h-8 px-2.5 rounded-lg text-xs border-zinc-800 hover:border-zinc-700 text-zinc-300">
                    <Link href={`/dashboard/projects/${project.id}/edit`}>
                      <Edit3 className="h-3 w-3 mr-1 text-blue-400" />
                      <span>Edit</span>
                    </Link>
                  </Button>

                  <form action={deleteProjectAction.bind(null, project.id)}>
                    <Button
                      type="submit"
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 rounded-lg text-xs text-zinc-500 hover:text-red-400 hover:bg-red-500/10"
                      title="Delete Project"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </form>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export const metadata: Metadata = { title: "Projects" };
