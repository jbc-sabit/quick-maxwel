"use client";

import { useState } from "react";
import { BrandMark } from "@/components/brand-mark";
import Link from "next/link";
import { LinkedinIcon as Linkedin } from "@/components/icons";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/actions/auth";
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  Award,
  Sparkles,
  Calendar,
  Mail,
  Palette,
  User,
  ExternalLink,
  LogOut,
  Menu,
  X,
  Copy,
  Check,
  FolderKanban,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { subdomainHost } from "@/lib/site";

interface DashboardShellProps {
  user: {
    id: string;
    name: string;
    handle: string;
    avatarUrl?: string | null;
  };
  children: React.ReactNode;
}

export function DashboardShell({ user, children }: DashboardShellProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const navItems = [
    { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { label: "Articles", href: "/dashboard/articles", icon: FileText },
    { label: "Experience", href: "/dashboard/experience", icon: Briefcase },
    { label: "Projects", href: "/dashboard/projects", icon: FolderKanban },
    { label: "Achievements", href: "/dashboard/achievements", icon: Award },
    { label: "Services", href: "/dashboard/services", icon: Sparkles },
    { label: "Events", href: "/dashboard/events", icon: Calendar },
    { label: "Inquiries", href: "/dashboard/inbox", icon: Mail },
    { label: "Theme Studio", href: "/dashboard/theme", icon: Palette },
    { label: "Import", href: "/dashboard/import", icon: Linkedin },
    { label: "Profile", href: "/dashboard/profile", icon: User },
  ];

  const handleCopyLink = () => {
    const url = `${window.location.origin}/${user.handle}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col md:flex-row">
      {/* DESKTOP SIDEBAR (hidden on mobile) */}
      <aside className="hidden md:flex w-64 border-r border-zinc-800/80 bg-zinc-900/40 flex-col shrink-0 sticky top-0 h-screen overflow-y-auto">
        {/* Brand Header */}
        <div className="h-16 px-6 border-b border-zinc-800/80 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <BrandMark className="h-8 w-8 shadow-md shadow-sky-500/20 rounded-lg" />
            <span className="font-bold tracking-tight text-base text-zinc-100">
              Portfolioo<span className="text-sky-400">Site</span>
            </span>
          </Link>
        </div>

        {/* User Profile Widget */}
        <div className="p-4 border-b border-zinc-800/80 bg-zinc-950/40 space-y-3">
          <div className="flex items-center gap-3">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="h-10 w-10 rounded-xl object-cover border border-zinc-700 shadow-sm shrink-0"
              />
            ) : (
              <div className="h-10 w-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-300 font-bold text-sm border border-zinc-700 shrink-0">
                {user.name.charAt(0)}
              </div>
            )}
            <div className="overflow-hidden min-w-0">
              <div className="font-semibold text-sm text-zinc-100 truncate">{user.name}</div>
              <div className="text-xs text-sky-400 font-mono truncate">{subdomainHost(user.handle)}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <a
              href={`/${user.handle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 text-xs text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 py-1.5 px-2 rounded-lg transition-colors font-medium"
            >
              <span>View Portfolio</span>
              <ExternalLink className="h-3 w-3" />
            </a>

            <button
              type="button"
              onClick={handleCopyLink}
              title="Copy public URL"
              className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-750 text-zinc-400 hover:text-white border border-zinc-700/80 transition-colors"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-sky-400" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                  isActive
                    ? "bg-sky-500/10 text-sky-400 border border-sky-500/20 font-semibold"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-sky-400" : "text-zinc-400"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sign Out Button */}
        <div className="p-4 border-t border-zinc-800/80">
          <form action={logoutAction}>
            <button
              type="submit"
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </form>
        </div>
      </aside>

      {/* MOBILE TOPBAR & DRAWER (hidden on desktop) */}
      <div className="md:hidden sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-xl">
        <div className="h-16 px-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <BrandMark className="h-8 w-8 shadow-md shadow-sky-500/20 rounded-lg" />
            <span className="font-bold text-sm text-zinc-100">
              Portfolioo<span className="text-sky-400">Site</span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <a
              href={`/${user.handle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 rounded-lg text-xs font-mono font-semibold bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center gap-1"
            >
              <span>{subdomainHost(user.handle)}</span>
              <ExternalLink className="h-3 w-3" />
            </a>

            <ThemeToggle className="h-9 w-9 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white" />
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-zinc-400 hover:text-white border border-zinc-800 bg-zinc-900"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="border-t border-zinc-800 bg-zinc-950/98 backdrop-blur-2xl px-4 py-4 space-y-4 max-h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between">
              <div>
                <div className="font-semibold text-xs text-white">{user.name}</div>
                <div className="text-[11px] text-zinc-400 font-mono">{subdomainHost(user.handle)}</div>
              </div>
              <button
                type="button"
                onClick={handleCopyLink}
                className="text-xs px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-300 font-medium border border-zinc-700 flex items-center gap-1"
              >
                {copied ? <Check className="h-3 w-3 text-sky-400" /> : <Copy className="h-3 w-3" />}
                <span>{copied ? "Copied" : "Copy URL"}</span>
              </button>
            </div>

            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${
                      isActive
                        ? "bg-sky-500/10 text-sky-400 font-semibold"
                        : "text-zinc-300 hover:text-white hover:bg-zinc-900"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="pt-2 border-t border-zinc-800">
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* MAIN DASHBOARD CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 bg-zinc-950">
        {/* Desktop Header with Aligned Max-Width Container */}
        <header className="hidden md:flex h-16 border-b border-zinc-800/80 px-6 lg:px-8 items-center bg-zinc-950/70 backdrop-blur sticky top-0 z-30">
          <div className="w-full max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Console
              </span>
              <span className="text-zinc-600">/</span>
              <span className="text-xs font-bold text-zinc-200 capitalize">
                {pathname === "/dashboard"
                  ? "Overview"
                  : pathname.replace("/dashboard/", "").replace("/", " • ")}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle className="h-8 w-8 rounded-lg border border-zinc-700 bg-zinc-800/60 text-zinc-300 hover:text-white hover:bg-zinc-800" iconClassName="h-3.5 w-3.5" />
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs">
                <span className="h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
                <span className="text-zinc-400">Your subdomain:</span>
                <a
                  href={`/${user.handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono font-bold text-sky-400 hover:underline flex items-center gap-1"
                >
                  <span>{subdomainHost(user.handle)}</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className="h-8 px-3 rounded-lg border-zinc-700 bg-zinc-800/60 hover:bg-zinc-800 text-xs font-semibold text-zinc-200"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 mr-1 text-sky-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 mr-1" />
                    <span>Copy Link</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content Body Wrapped in Centered max-w-6xl Container */}
        <div className="p-4 sm:p-6 lg:p-8 flex-1 w-full">
          <div className="w-full max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
