import type { Metadata } from "next";
import { getPortfolioData } from "@/lib/portfolio-data";
import { getPaletteConfig, FONTS, FontFamily, TemplateId } from "@/lib/templates";
import TemplateNavbar from "@/components/templates/nav/template-navbar";
import TemplateFooter from "@/components/templates/nav/template-footer";
import { TemplatePreviewBanner } from "@/components/templates/nav/template-preview-banner";
import { StudioPreviewBridge } from "@/components/templates/nav/studio-preview-bridge";
import React from "react";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const p = await getPortfolioData(handle);
  const home = p.settings?.seoTitle || [p.name, p.headline].filter(Boolean).join(" — ");
  // Sub-pages set a short title ("Projects"); the template appends the owner's name.
  return { title: { default: home, template: `%s | ${p.name}` } };
}

export default async function PortfolioLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const portfolio = await getPortfolioData(handle);

  const paletteConfig = getPaletteConfig(portfolio.settings?.colorPalette);
  const fontKey = (portfolio.settings?.fontFamily || "sans") as FontFamily;
  const fontClass = FONTS[fontKey]?.className || "font-sans";

  return (
    <div
      data-portfolio-root
      className={`min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between overflow-x-clip ${fontClass}`}
      style={
        {
          // globals.css derives --theme-accent from this (deepened in light mode).
          "--theme-accent-base": paletteConfig.accentHex,
          "--theme-accent-glow": paletteConfig.glowRgba,
          "--theme-primary": paletteConfig.primaryHex,
        } as React.CSSProperties
      }
    >
      {/* Template Preview Switcher Banner (when in preview mode) */}
      {portfolio.isPreview && (
        <TemplatePreviewBanner
          activeTemplate={portfolio.settings?.templateId as TemplateId}
          handle={handle}
        />
      )}

      {portfolio.isStudioPreview && <StudioPreviewBridge />}

      {/* Template-Specific Navbar */}
      <TemplateNavbar portfolio={portfolio} handle={handle} />

      {/* Main Portfolio Content */}
      <main className="flex-1 w-full flex flex-col">
        {children}
      </main>

      {/* Template-Specific Footer */}
      <TemplateFooter portfolio={portfolio} handle={handle} />
    </div>
  );
}
