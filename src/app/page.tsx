import { db } from "@/db";
import { users } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LandingHeader } from "@/components/landing/landing-header";
import { ProfessionShowcase, type ShowcaseProfile } from "@/components/landing/profession-showcase";
import { DEMO_ACCOUNTS, DEMO_USER_HANDLE } from "@/lib/demo-account";
import { getPaletteConfig, getTemplateConfig } from "@/lib/templates";
import { inArray } from "drizzle-orm";
import {
  Sparkles,
  ArrowRight,
  ExternalLink,
  Layers,
  Palette,
  Terminal,
  Grid,
  FileText,
  Briefcase,
  Award,
  Calendar,
  Mail,
  CheckCircle2,
  Compass,
  Zap,
  ShieldCheck,
  Layout,
  Globe,
  Users,
} from "lucide-react";
import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/seo";
import Link from "next/link";
import { subdomainHost, ROOT_DOMAIN } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: `${SITE_NAME} — Your portfolio on your own subdomain` },
  description:
    "Create a multi-page portfolio on your own subdomain (you.portfolioosite.dev). Choose from six templates, import your career from LinkedIn, add projects, articles and services, and receive client inquiries in one dashboard.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Your portfolio on your own subdomain`,
    description:
      "Six templates, LinkedIn import, projects, articles, services and an inbox — published on your own subdomain in minutes.",
    url: "/",
  },
  twitter: {
    card: "summary",
    title: `${SITE_NAME} — Your portfolio on your own subdomain`,
    description: "Build and publish a multi-page portfolio on your own subdomain in minutes.",
  },
};

export default async function HomePage() {
  const session = await getSession();

  let demoUser = null;
  try {
    demoUser = await db.query.users.findFirst({
      where: (table, { eq }) => eq(table.handle, DEMO_USER_HANDLE),
      with: {
        settings: true,
        articles: true,
        experiences: true,
        achievements: true,
        services: true,
        events: true,
      },
    });
  } catch (error) {
    console.error("Failed to load demo user", error);
  }

  // Fallback to first user if sarah is not found
  if (!demoUser) {
    try {
      demoUser = await db.query.users.findFirst({
        with: {
          settings: true,
          articles: true,
          experiences: true,
          achievements: true,
          services: true,
          events: true,
        },
      });
    } catch (e) {
      console.error(e);
    }
  }

  const demoHandle = demoUser?.handle || DEMO_USER_HANDLE;

  // Demo portfolios across professions for the showcase gallery (only seeded ones appear).
  let showcaseProfiles: ShowcaseProfile[] = [];
  try {
    const rows = await db.query.users.findMany({
      where: inArray(
        users.handle,
        DEMO_ACCOUNTS.map((a) => a.handle)
      ),
      columns: { handle: true, name: true, avatarUrl: true, location: true },
      with: {
        settings: { columns: { templateId: true, colorPalette: true } },
        articles: { columns: { id: true } },
        projects: { columns: { id: true } },
        services: { columns: { id: true } },
        experiences: { columns: { id: true } },
      },
    });
    const byHandle = new Map(rows.map((r) => [r.handle, r]));
    showcaseProfiles = DEMO_ACCOUNTS.flatMap((account) => {
      const row = byHandle.get(account.handle);
      if (!row) return [];
      return [
        {
          handle: account.handle,
          name: row.name,
          profession: account.profession,
          discipline: account.discipline,
          pitch: account.pitch,
          avatarUrl: row.avatarUrl,
          location: row.location,
          templateName: getTemplateConfig(row.settings?.templateId).name,
          accentHex: getPaletteConfig(row.settings?.colorPalette).accentHex,
          stats: [
            { label: "projects", count: row.projects.length },
            { label: "articles", count: row.articles.length },
            { label: "services", count: row.services.length },
            { label: "roles", count: row.experiences.length },
          ],
        },
      ];
    });
  } catch (error) {
    console.error("Failed to load demo showcase", error);
  }

  const templatesList = [
    {
      id: "developer_terminal",
      name: "Developer Terminal",
      vibe: "Command-Line Precision",
      description: "macOS window chrome with traffic lights, monospace zsh command prompt, and CLI-driven tabs. Built for systems engineers, DevOps leads, and backend specialists.",
      badge: "Obsidian & Emerald",
      icon: Terminal,
      palette: "sky",
    },
    {
      id: "minimal_swiss",
      name: "Minimal Swiss",
      vibe: "International Typographic Order",
      description: "Archival folio metadata, rigorous typographic hierarchy, brutalist grid lines, and numbered chronology. Built for architects, design leaders, and researchers.",
      badge: "Monochrome & Slate",
      icon: Layout,
      palette: "mono",
    },
    {
      id: "aurora_studio",
      name: "Aurora Studio",
      vibe: "Spatial Glassmorphic Glow",
      description: "Spatial frosted glass cards, ambient aurora lighting flares, and floating capsule navigation. Built for product designers, UI/UX innovators, and creative technologists.",
      badge: "Frosted & Indigo",
      icon: Sparkles,
      palette: "indigo",
    },
    {
      id: "bento_grid",
      name: "Bento Grid",
      vibe: "Modular Information Architecture",
      description: "Linear and Apple-inspired asymmetrical tiles, live operational status telemetry, and dense tactile cards. Built for full-stack builders, founders, and makers.",
      badge: "Tactile & Violet",
      icon: Grid,
      palette: "violet",
    },
    {
      id: "fancy_creative",
      name: "Fancy Creative",
      vibe: "Fluid Gradient Expressiveness",
      description: "Fluid radial gradient meshes, animated radar availability ping, metallic accolades, and expressive headlines. Built for creative developers and agency founders.",
      badge: "Radial Mesh & Rose",
      icon: Zap,
      palette: "rose",
    },
    {
      id: "simple_professional",
      name: "Simple Professional",
      vibe: "Editorial Resume & Timeline",
      description: "Classic executive resume styling with continuous vertical timeline ruler, structured 2-column grids, and timeless elegance. Built for engineering managers and consultants.",
      badge: "Executive & Slate",
      icon: Compass,
      palette: "slate",
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between selection:bg-sky-500 selection:text-black">
      {/* Dynamic Client Navigation Header with Mobile Drawer */}
      <LandingHeader sessionUser={session ? { handle: session.handle, name: session.name } : null} />

      <main className="flex-1 w-full">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden pt-12 sm:pt-20 pb-16 sm:pb-24 border-b border-zinc-800/60">
          {/* Ambient Lighting Gradients */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] sm:w-[1000px] h-[400px] sm:h-[500px] bg-gradient-to-b from-sky-500/15 via-sky-500/5 to-transparent rounded-full blur-[140px] pointer-events-none" />

          <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-8 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-800 text-xs font-medium text-zinc-300 backdrop-blur-md shadow-sm">
              <span className="h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
              <span>The Multi-Page Personal Brand Engine</span>
            </div>

            <div className="space-y-4 max-w-4xl">
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white leading-[1.1] sm:leading-[1.15]">
                A portfolio builder that respects the{" "}
                <span className="bg-gradient-to-r from-sky-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                  true depth
                </span>{" "}
                of your work.
              </h1>

              <p className="text-base sm:text-xl text-zinc-300 font-light leading-relaxed max-w-3xl mx-auto sm:mx-0">
                Single-page sites reduce years of craft to a superficial summary. PortfoliooSite gives you an end-to-end multi-page platform with dedicated spaces for your writings, career timeline, consulting packages, verified achievements, and speaking appearances—backed by 6 signature design templates and a personal dashboard.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-2 justify-center sm:justify-start">
              {session ? (
                <Button
                  asChild
                  className="w-full sm:w-auto h-12 px-7 rounded-xl bg-sky-500 hover:bg-sky-400 text-black font-bold text-sm transition-all shadow-lg shadow-sky-500/20"
                >
                  <Link href="/dashboard">
                    <span>Open Dashboard (@{session.handle})</span>
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              ) : (
                <Button
                  asChild
                  className="w-full sm:w-auto h-12 px-7 rounded-xl bg-sky-500 hover:bg-sky-400 text-black font-bold text-sm transition-all shadow-lg shadow-sky-500/20"
                >
                  <Link href="/register">
                    <span>Claim Your Subdomain</span>
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              )}

              <Button
                asChild
                variant="outline"
                className="w-full sm:w-auto h-12 px-7 rounded-xl border-zinc-700 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-200 text-sm font-semibold transition-all"
              >
                <Link href={showcaseProfiles.length > 1 ? "#showcase" : `/${demoHandle}?exit_preview=true`}>
                  <span>{showcaseProfiles.length > 1 ? "See Demo Portfolios" : `Explore Live Showcase (@${demoHandle})`}</span>
                  <ArrowRight className="h-4 w-4 ml-2 text-sky-400" />
                </Link>
              </Button>
            </div>

            {/* Value Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-zinc-800/80 text-left">
              <div className="space-y-1">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-sky-400" />
                  <span>100% Multi-Page</span>
                </div>
                <p className="text-[11px] text-zinc-400">Dedicated pages for all items, not just landing.</p>
              </div>

              <div className="space-y-1">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-sky-400" />
                  <span>6 Signature Themes</span>
                </div>
                <p className="text-[11px] text-zinc-400">Terminal, Swiss, Aurora, Bento, Fancy &amp; Simple.</p>
              </div>

              <div className="space-y-1">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-sky-400" />
                  <span>Private Inbox</span>
                </div>
                <p className="text-[11px] text-zinc-400">Direct inquiries delivered straight to your dashboard.</p>
              </div>

              <div className="space-y-1">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-sky-400" />
                  <span>Your Own Subdomain</span>
                </div>
                <p className="text-[11px] text-zinc-400">Share a clean link like {subdomainHost(demoHandle)}.</p>
              </div>
            </div>
          </div>
        </section>

        {/* DEMO PORTFOLIOS ACROSS PROFESSIONS */}
        {showcaseProfiles.length > 0 && (
          <section id="showcase" className="py-16 sm:py-20 border-b border-zinc-800/60 scroll-mt-16">
            <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-semibold text-sky-400">
                  <Users className="h-3.5 w-3.5" />
                  <span>Built for every discipline</span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
                  See real portfolios for your profession.
                </h2>
                <p className="text-sm sm:text-base text-zinc-400 max-w-2xl leading-relaxed">
                  Doctors, designers, researchers, engineers, photographers, and consultants all need a credible home on the web.
                  Explore {showcaseProfiles.length} live demo portfolios, each with its own template, content, and story.
                </p>
              </div>

              <ProfessionShowcase profiles={showcaseProfiles} />
            </div>
          </section>
        )}

        {/* LIVE MULTI-PAGE SHOWCASE SECTION */}
        <section id="demo" className="py-16 sm:py-20 border-b border-zinc-800/60 bg-zinc-950/60">
          <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-semibold text-sky-400">
                <Globe className="h-3.5 w-3.5" />
                <span>Live Interactive Showcase</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
                One portfolio dataset. Complete multi-page reach.
              </h2>
              <p className="text-sm sm:text-base text-zinc-400 max-w-2xl leading-relaxed">
                Take a look at how @{demoHandle}&apos;s live portfolio is structured. Every single category has its own dedicated index and detail views, ready to explore:
              </p>
            </div>

            {/* Public Route Explorer Card */}
            <div className="rounded-3xl p-6 sm:p-8 bg-zinc-900/60 border border-zinc-800/80 shadow-2xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
                <div className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full bg-sky-400 animate-pulse" />
                  <span className="font-mono text-sm text-zinc-300">
                    <strong className="text-sky-400">{demoHandle}</strong>.{ROOT_DOMAIN}
                  </span>
                </div>

                <Button
                  asChild
                  size="sm"
                  className="w-fit h-9 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs border border-zinc-700"
                >
                  <Link href={`/${demoHandle}?exit_preview=true`}>
                    <span>Launch Full Portfolio</span>
                    <ExternalLink className="h-3 w-3 ml-1.5 text-sky-400" />
                  </Link>
                </Button>
              </div>

              {/* 6 Category Sub-Pages Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
                <Link
                  href={`/${demoHandle}/articles`}
                  className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 hover:border-zinc-600 hover:bg-zinc-900/80 transition-all text-center group flex flex-col justify-between space-y-3"
                >
                  <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 w-fit mx-auto group-hover:scale-110 transition-transform">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xl font-extrabold text-white">
                      {demoUser?.articles?.length || 3}
                    </div>
                    <div className="text-xs font-semibold text-zinc-400 group-hover:text-zinc-200 transition-colors">
                      Articles →
                    </div>
                  </div>
                </Link>

                <Link
                  href={`/${demoHandle}/experience`}
                  className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 hover:border-zinc-600 hover:bg-zinc-900/80 transition-all text-center group flex flex-col justify-between space-y-3"
                >
                  <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 w-fit mx-auto group-hover:scale-110 transition-transform">
                    <Briefcase className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xl font-extrabold text-white">
                      {demoUser?.experiences?.length || 4}
                    </div>
                    <div className="text-xs font-semibold text-zinc-400 group-hover:text-zinc-200 transition-colors">
                      Career →
                    </div>
                  </div>
                </Link>

                <Link
                  href={`/${demoHandle}/achievements`}
                  className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 hover:border-zinc-600 hover:bg-zinc-900/80 transition-all text-center group flex flex-col justify-between space-y-3"
                >
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 w-fit mx-auto group-hover:scale-110 transition-transform">
                    <Award className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xl font-extrabold text-white">
                      {demoUser?.achievements?.length || 3}
                    </div>
                    <div className="text-xs font-semibold text-zinc-400 group-hover:text-zinc-200 transition-colors">
                      Honors →
                    </div>
                  </div>
                </Link>

                <Link
                  href={`/${demoHandle}/services`}
                  className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 hover:border-zinc-600 hover:bg-zinc-900/80 transition-all text-center group flex flex-col justify-between space-y-3"
                >
                  <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 w-fit mx-auto group-hover:scale-110 transition-transform">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xl font-extrabold text-white">
                      {demoUser?.services?.length || 3}
                    </div>
                    <div className="text-xs font-semibold text-zinc-400 group-hover:text-zinc-200 transition-colors">
                      Services →
                    </div>
                  </div>
                </Link>

                <Link
                  href={`/${demoHandle}/events`}
                  className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 hover:border-zinc-600 hover:bg-zinc-900/80 transition-all text-center group flex flex-col justify-between space-y-3"
                >
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 w-fit mx-auto group-hover:scale-110 transition-transform">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xl font-extrabold text-white">
                      {demoUser?.events?.length || 3}
                    </div>
                    <div className="text-xs font-semibold text-zinc-400 group-hover:text-zinc-200 transition-colors">
                      Speaking →
                    </div>
                  </div>
                </Link>

                <Link
                  href={`/${demoHandle}/contact`}
                  className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 hover:border-zinc-600 hover:bg-zinc-900/80 transition-all text-center group flex flex-col justify-between space-y-3"
                >
                  <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 w-fit mx-auto group-hover:scale-110 transition-transform">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-sky-400 pt-1">
                      Direct Form
                    </div>
                    <div className="text-xs font-semibold text-zinc-400 group-hover:text-zinc-200 transition-colors mt-1">
                      Inquiries →
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 6 CURATED DESIGN TEMPLATES SECTION */}
        <section id="templates" className="py-16 sm:py-24 border-b border-zinc-800/60">
          <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="space-y-3 text-center sm:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-semibold text-sky-400">
                <Palette className="h-3.5 w-3.5" />
                <span>6 Award-Winning Design Languages</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                Not just color skins. Complete visual architectures.
              </h2>
              <p className="text-sm sm:text-base text-zinc-400 max-w-2xl leading-relaxed">
                Switching templates doesn&apos;t just change accents. It re-renders every single page with bespoke navigation, typography, cards, and interactive behaviors designed around different creative philosophies.
              </p>
            </div>

            {/* Template Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templatesList.map((tpl) => {
                const Icon = tpl.icon;
                return (
                  <Card
                    key={tpl.id}
                    className="p-6 sm:p-7 rounded-3xl bg-zinc-900/50 border border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/80 transition-all flex flex-col justify-between space-y-6 group shadow-lg"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="h-10 w-10 rounded-2xl bg-zinc-800/80 border border-zinc-700/80 flex items-center justify-center text-white group-hover:scale-105 transition-transform">
                          <Icon className="h-5 w-5" />
                        </div>
                        <Badge variant="outline" className="text-[10px] font-mono border-zinc-700 text-zinc-400">
                          {tpl.badge}
                        </Badge>
                      </div>

                      <div className="space-y-1.5">
                        <h3 className="text-xl font-bold text-white group-hover:text-sky-400 transition-colors">
                          {tpl.name}
                        </h3>
                        <p className="text-xs font-semibold text-sky-400/90 uppercase tracking-wider">
                          {tpl.vibe}
                        </p>
                      </div>

                      <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                        {tpl.description}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                      <Link
                        href={`/${demoHandle}?template=${tpl.id}`}
                        className="text-zinc-300 hover:text-white flex items-center gap-1.5 font-medium transition-colors group-hover:text-sky-400"
                      >
                        <span>Preview Live</span>
                        <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </Link>

                      <Link
                        href={`/register?template=${tpl.id}`}
                        className="text-sky-400 font-bold hover:underline"
                      >
                        Use Template
                      </Link>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* WHY MULTI-PAGE MATTERS SECTION */}
        <section id="why-multipage" className="py-16 sm:py-24 border-b border-zinc-800/60 bg-zinc-950/40">
          <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="space-y-3 text-center sm:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-semibold text-sky-400">
                <Layers className="h-3.5 w-3.5" />
                <span>The Core Advantage</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                Why professionals outgrow single-page portfolios
              </h2>
              <p className="text-sm sm:text-base text-zinc-400 max-w-2xl leading-relaxed">
                As your career progresses, a one-page overview cannot communicate your technical depth, leadership trajectory, advisory scope, or writing authority.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-7 rounded-3xl bg-zinc-900/50 border border-zinc-800/80 space-y-3.5">
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                  <FileText className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold text-white">Dedicated Technical Writings</h3>
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                  Publish architectural retrospectives, engineering essays, and tutorials with tags, estimated reading times, and dedicated reading layouts with feedback forms.
                </p>
              </div>

              <div className="p-7 rounded-3xl bg-zinc-900/50 border border-zinc-800/80 space-y-3.5">
                <div className="h-10 w-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
                  <Briefcase className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold text-white">Continuous Career Chronology</h3>
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                  Document your leadership roles, platform transformations, and engineering impact with verified technology stack pills and timeline rulers.
                </p>
              </div>

              <div className="p-7 rounded-3xl bg-zinc-900/50 border border-zinc-800/80 space-y-3.5">
                <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold text-white">Commercial Advisory &amp; Services</h3>
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                  Turn inbound interest into structured consulting contracts. List advisory packages with fixed or hourly pricing, deliverables matrices, and booking calls to action.
                </p>
              </div>

              <div className="p-7 rounded-3xl bg-zinc-900/50 border border-zinc-800/80 space-y-3.5">
                <div className="h-10 w-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
                  <Award className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold text-white">Verified Honors &amp; Speaking Timetable</h3>
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                  Display industry awards, patents, and technical certifications alongside your upcoming conference keynotes, workshops, and podcast sessions.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS SECTION */}
        <section id="how-it-works" className="py-16 sm:py-24 border-b border-zinc-800/60">
          <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="space-y-3 text-center sm:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-semibold text-sky-400">
                <Zap className="h-3.5 w-3.5" />
                <span>Effortless Workflow</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                From signup to custom multi-page portfolio in 3 steps
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-7 rounded-3xl bg-zinc-900/50 border border-zinc-800/80 space-y-4">
                <div className="text-2xl font-black text-sky-400 font-mono">01</div>
                <h3 className="text-lg font-bold text-white">Claim Your Own Subdomain</h3>
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                  Reserve your unique subdomain (e.g. <code className="text-sky-400">{subdomainHost(demoHandle)}</code>) with simple one-click registration and authentication.
                </p>
              </div>

              <div className="p-7 rounded-3xl bg-zinc-900/50 border border-zinc-800/80 space-y-4">
                <div className="text-2xl font-black text-sky-400 font-mono">02</div>
                <h3 className="text-lg font-bold text-white">Populate Your Career Story</h3>
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                  Use your private dashboard to write articles, log work milestones, list advisory packages, and record speaking events.
                </p>
              </div>

              <div className="p-7 rounded-3xl bg-zinc-900/50 border border-zinc-800/80 space-y-4">
                <div className="text-2xl font-black text-sky-400 font-mono">03</div>
                <h3 className="text-lg font-bold text-white">Choose Your Aesthetic &amp; Go Live</h3>
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                  Toggle in real-time between Terminal, Swiss, Aurora, Bento, Fancy, and Simple templates in the Theme Studio. Your entire portfolio updates instantly.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* BOTTOM CALL TO ACTION HERO */}
        <section className="py-20 sm:py-28 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-sky-500/10 rounded-full blur-[140px] pointer-events-none" />

          <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-6">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              Ready to build a portfolio you are genuinely proud of?
            </h2>
            <p className="text-base sm:text-lg text-zinc-300 font-light max-w-2xl mx-auto leading-relaxed">
              Join software architects, creative directors, consultants, and leaders who present their work with clarity and distinction.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                asChild
                className="w-full sm:w-auto h-12 px-8 rounded-xl bg-sky-500 hover:bg-sky-400 text-black font-bold text-sm shadow-xl shadow-sky-500/20"
              >
                <Link href="/register">
                  <span>Claim Your Free Portfolio</span>
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="w-full sm:w-auto h-12 px-8 rounded-xl border-zinc-700 bg-zinc-900/80 hover:bg-zinc-850 text-white font-semibold text-sm"
              >
                <Link href={`/${demoHandle}`}>
                  <span>View Sample Portfolio (@{demoHandle})</span>
                  <ExternalLink className="h-4 w-4 ml-2 text-sky-400" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* PROFESSIONAL FOOTER */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-10 px-4 sm:px-6 lg:px-8 text-xs text-zinc-400">
        <div className="w-full max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400 font-extrabold text-xs">
              P
            </div>
            <span className="font-bold text-zinc-200">PortfoliooSite</span>
            <span>— The Multi-Page Personal Brand Engine</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="#features" className="hover:text-zinc-200 transition-colors">
              Features
            </Link>
            <Link href="#templates" className="hover:text-zinc-200 transition-colors">
              Templates
            </Link>
            <Link href={`/${demoHandle}`} className="hover:text-zinc-200 transition-colors">
              Live Demo
            </Link>
            <Link href="/login" className="hover:text-zinc-200 transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
