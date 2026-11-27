import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { cookies } from "next/headers";
import { THEME_COOKIE, parseThemeMode } from "@/lib/theme-mode";
import { ThemeModeSync } from "@/components/theme-mode-sync";
import { SITE_NAME, siteUrl } from "@/lib/seo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: `${SITE_NAME} — Your portfolio on your own subdomain`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Build, customize and publish a multi-page personal portfolio on your own subdomain. Pick a template, import from LinkedIn, and go live in minutes.",
  applicationName: SITE_NAME,
  openGraph: { type: "website", siteName: SITE_NAME },
  twitter: { card: "summary" },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // The visitor's light/dark choice is a cookie, so the first paint is already correct.
  const mode = parseThemeMode((await cookies()).get(THEME_COOKIE)?.value);

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${mode} h-full antialiased`}
      style={{ colorScheme: mode }}
      // The toggle updates this class on the client between server renders.
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100">
        <ThemeModeSync />
        {children}
      </body>
    </html>
  );
}
