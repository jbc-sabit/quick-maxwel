import { requireAuth } from "@/lib/auth";
import { db } from "@/db";
import { articles, experiences, achievements, services, projects, events, contacts, portfolioSettings } from "@/db/schema";
import { eq, count, desc } from "drizzle-orm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Briefcase,
  Award,
  Sparkles,
  Calendar,
  Mail,
  Palette,
  ExternalLink,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle2,
  Globe,
  Inbox,
  Layout,
  Layers,
  FolderKanban,
} from "lucide-react";
import Link from "next/link";
import { subdomainHost } from "@/lib/site";
import { LinkedinIcon as Linkedin } from "@/components/icons";

export default async function DashboardOverviewPage() {
  const user = await requireAuth();

  // Parallel data fetching for metrics, settings, and inquiries
  const [
    [articlesCount],
    [experiencesCount],
    [achievementsCount],
    [servicesCount],
    [projectsCount],
    [eventsCount],
    [inquiriesCount],
    userSettings,
    recentInquiries,
  ] = await Promise.all([
    db.select({ count: count() }).from(articles).where(eq(articles.userId, user.id)),
    db.select({ count: count() }).from(experiences).where(eq(experiences.userId, user.id)),
    db.select({ count: count() }).from(achievements).where(eq(achievements.userId, user.id)),
    db.select({ count: count() }).from(services).where(eq(services.userId, user.id)),
    db.select({ count: count() }).from(projects).where(eq(projects.userId, user.id)),
    db.select({ count: count() }).from(events).where(eq(events.userId, user.id)),
    db.select({ count: count() }).from(contacts).where(eq(contacts.userId, user.id)),
    db.query.portfolioSettings.findFirst({
      where: eq(portfolioSettings.userId, user.id),
    }),
    db.query.contacts.findMany({
      where: eq(contacts.userId, user.id),
      orderBy: [desc(contacts.createdAt)],
      limit: 3,
    }),
  ]);

  const stats = [
    {
      title: "Articles",
      count: articlesCount?.count || 0,
      icon: FileText,
      href: "/dashboard/articles",
      color: "text-blue-400",
      bg: "bg-blue-500/10 border-blue-500/20",
      addHref: "/dashboard/articles/new",
    },
    {
      title: "Experience",
      count: experiencesCount?.count || 0,
      icon: Briefcase,
      href: "/dashboard/experience",
      color: "text-sky-400",
      bg: "bg-sky-500/10 border-sky-500/20",
      addHref: "/dashboard/experience/new",
    },
    {
      title: "Projects",
      count: projectsCount?.count || 0,
      icon: FolderKanban,
      href: "/dashboard/projects",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20",
      addHref: "/dashboard/projects/new",
    },
    {
      title: "Achievements",
      count: achievementsCount?.count || 0,
      icon: Award,
      href: "/dashboard/achievements",
      color: "text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/20",
      addHref: "/dashboard/achievements/new",
    },
    {
      title: "Services",
      count: servicesCount?.count || 0,
      icon: Sparkles,
      href: "/dashboard/services",
      color: "text-purple-400",
      bg: "bg-purple-500/10 border-purple-500/20",
      addHref: "/dashboard/services/new",
    },
    {
      title: "Events",
      count: eventsCount?.count || 0,
      icon: Calendar,
      href: "/dashboard/events",
      color: "text-rose-400",
      bg: "bg-rose-500/10 border-rose-500/20",
      addHref: "/dashboard/events/new",
    },
    {
      title: "Inquiries",
      count: inquiriesCount?.count || 0,
      icon: Mail,
      href: "/dashboard/inbox",
      color: "text-cyan-400",
      bg: "bg-cyan-500/10 border-cyan-500/20",
      addHref: null,
    },
  ];

  const templateDisplayNames: Record<string, string> = {
    developer_terminal: "Developer Terminal",
    minimal_swiss: "Minimal Swiss",
    aurora_studio: "Aurora Studio",
    bento_grid: "Bento Grid",
    fancy_creative: "Fancy Creative",
    simple_professional: "Simple Professional",
  };

  const activeTemplateName =
    templateDisplayNames[userSettings?.templateId || "simple_professional"] ||
    "Simple Professional";

  return (
    <div className="w-full space-y-8">
      {experiencesCount.count === 0 && (
        <Link
          href="/dashboard/import"
          className="group flex items-center gap-4 rounded-2xl border border-sky-500/30 bg-sky-500/10 p-5 hover:bg-sky-500/15 transition-colors"
        >
          <div className="p-3 rounded-xl bg-sky-500/20">
            <Linkedin className="h-5 w-5 text-sky-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-zinc-50">Skip the typing — import from LinkedIn</p>
            <p className="text-xs text-zinc-400">
              Bring in your experience, certifications and projects in under a minute.
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-sky-400 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      )}
      {/* Welcome & Public Link Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="text-sky-400 border-sky-500/30 bg-sky-500/10 text-xs py-0.5 px-2.5 font-medium flex items-center gap-1.5"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse" />
                <span>Live Portfolio Active</span>
              </Badge>
              <span className="text-xs font-mono text-zinc-400">{subdomainHost(user.handle)}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white">
              Welcome back, {user.name}
            </h1>

            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Your multi-page portfolio is published and accessible worldwide. Manage your articles, career timeline, consulting packages, and client inquiries below.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              asChild
              variant="outline"
              className="h-11 px-4 sm:px-5 rounded-xl border-zinc-700 bg-zinc-800/80 hover:bg-zinc-800 text-zinc-200 text-xs sm:text-sm font-semibold transition-all"
            >
              <Link href="/dashboard/theme">
                <Palette className="h-4 w-4 mr-2 text-purple-400" />
                <span>Theme Studio</span>
              </Link>
            </Button>

            <Button
              asChild
              className="h-11 px-4 sm:px-5 rounded-xl bg-sky-500 hover:bg-sky-400 text-black text-xs sm:text-sm font-bold transition-all shadow-md shadow-sky-500/20"
            >
              <a href={`/${user.handle}`} target="_blank" rel="noopener noreferrer">
                <span>View Public Portfolio</span>
                <ExternalLink className="h-4 w-4 ml-2" />
              </a>
            </Button>
          </div>
        </div>
      </div>

      {/* Content Metrics Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Portfolio Content Metrics
          </h2>
          <span className="text-xs text-zinc-400 font-mono">6 Categories Active</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-7 gap-3 sm:gap-4">
          {stats.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.title} href={item.href} className="group block">
                <Card className="h-full bg-zinc-900/50 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/80 transition-all p-5 rounded-2xl flex flex-col justify-between space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className={`p-2.5 rounded-xl border ${item.bg}`}>
                      <Icon className={`h-4 w-4 ${item.color}`} />
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-zinc-600 group-hover:text-sky-400 group-hover:translate-x-0.5 transition-all" />
                  </div>

                  <div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                      {item.count}
                    </div>
                    <div className="text-xs font-medium text-zinc-400 group-hover:text-zinc-200 transition-colors mt-0.5">
                      {item.title}
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Middle Split: Recent Inquiries & Presentation Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Inquiries (Spans 2 cols) */}
        <div className="lg:col-span-2 rounded-2xl p-6 sm:p-7 bg-zinc-900/50 border border-zinc-800/80 shadow-md space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-cyan-400" />
              <h2 className="text-base font-bold text-white">Recent Client Inquiries</h2>
            </div>
            <Link
              href="/dashboard/inbox"
              className="text-xs text-sky-400 hover:underline font-semibold flex items-center gap-1"
            >
              <span>View All Inquiries</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {recentInquiries && recentInquiries.length > 0 ? (
            <div className="space-y-3">
              {recentInquiries.map((inquiry) => (
                <Link
                  key={inquiry.id}
                  href="/dashboard/inbox"
                  className="block p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-950 transition-all space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-semibold text-sm text-zinc-200">{inquiry.senderName}</div>
                    <span className="text-[11px] font-mono text-zinc-400">
                      {new Date(inquiry.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="text-xs font-medium text-sky-400">
                    {inquiry.subject || "Direct Portfolio Inquiry"}
                  </div>
                  <p className="text-xs text-zinc-400 line-clamp-1 leading-relaxed">
                    {inquiry.message}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-8 rounded-xl bg-zinc-950/40 border border-dashed border-zinc-800 text-center space-y-3">
              <Inbox className="h-8 w-8 text-zinc-600 mx-auto" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-zinc-300">Your direct inbox is waiting</p>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  Messages dispatched via your public contact form will be delivered directly here.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Active Template & Theme Studio Preview */}
        <div className="rounded-2xl p-6 sm:p-7 bg-zinc-900/50 border border-zinc-800/80 shadow-md space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-purple-400" />
              <h2 className="text-base font-bold text-white">Active Presentation</h2>
            </div>

            <div className="space-y-3 pt-1">
              <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-2">
                <div className="text-xs text-zinc-400">Current Template</div>
                <div className="text-base font-bold text-white flex items-center justify-between">
                  <span>{activeTemplateName}</span>
                  <Badge variant="secondary" className="bg-zinc-800 text-zinc-200 text-xs font-mono capitalize">
                    {userSettings?.templateId?.replace("_", " ") || "default"}
                  </Badge>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-2">
                <div className="text-xs text-zinc-400">Color Palette</div>
                <div className="text-sm font-bold text-white flex items-center justify-between">
                  <span className="capitalize">{userSettings?.colorPalette || "Slate"}</span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="h-3 w-3 rounded-full border border-white/20"
                      style={{
                        backgroundColor:
                          userSettings?.colorPalette === "sky"
                            ? "#10b981"
                            : userSettings?.colorPalette === "violet"
                            ? "#8b5cf6"
                            : userSettings?.colorPalette === "rose"
                            ? "#f43f5e"
                            : userSettings?.colorPalette === "indigo"
                            ? "#6366f1"
                            : "#64748b",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Button
            asChild
            className="w-full h-11 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-white font-semibold text-xs border border-zinc-700"
          >
            <Link href="/dashboard/theme">
              <Palette className="h-4 w-4 mr-2 text-purple-400" />
              <span>Customize in Theme Studio</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick Publishing Actions Bar */}
      <div className="rounded-2xl p-6 sm:p-7 bg-zinc-900/50 border border-zinc-800/80 shadow-md space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
          Quick Content Actions
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          <Button
            asChild
            variant="outline"
            className="h-11 rounded-xl border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850 justify-start px-4 text-xs font-semibold text-zinc-200"
          >
            <Link href="/dashboard/articles/new">
              <Plus className="h-4 w-4 mr-2 text-blue-400" />
              <span>Draft New Article</span>
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="h-11 rounded-xl border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850 justify-start px-4 text-xs font-semibold text-zinc-200"
          >
            <Link href="/dashboard/experience/new">
              <Plus className="h-4 w-4 mr-2 text-sky-400" />
              <span>Add Career Milestone</span>
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="h-11 rounded-xl border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850 justify-start px-4 text-xs font-semibold text-zinc-200"
          >
            <Link href="/dashboard/projects/new">
              <Plus className="h-4 w-4 mr-2 text-emerald-400" />
              <span>Showcase a Project</span>
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="h-11 rounded-xl border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850 justify-start px-4 text-xs font-semibold text-zinc-200"
          >
            <Link href="/dashboard/services/new">
              <Plus className="h-4 w-4 mr-2 text-purple-400" />
              <span>Create Service Package</span>
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="h-11 rounded-xl border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850 justify-start px-4 text-xs font-semibold text-zinc-200"
          >
            <Link href="/dashboard/events/new">
              <Plus className="h-4 w-4 mr-2 text-rose-400" />
              <span>Add Speaking Session</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
