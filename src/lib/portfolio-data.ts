import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { cache } from "react";
import { TEMPLATES, PALETTES, FONTS, TEMPLATE_SIGNATURE_STYLES, TemplateId, ColorPalette, FontFamily } from "./templates";


async function loadPortfolioData(handle: string, explicitTemplate?: string) {
  const cleanHandle = handle.toLowerCase().trim();

  const user = await db.query.users.findFirst({
    where: eq(users.handle, cleanHandle),
    with: {
      settings: true,
      articles: {
        where: (articles, { eq }) => eq(articles.isPublished, true),
        orderBy: (articles, { desc }) => [desc(articles.publishedAt)],
      },
      experiences: {
        orderBy: (experiences, { asc }) => [asc(experiences.orderIndex)],
      },
      achievements: {
        orderBy: (achievements, { asc }) => [asc(achievements.orderIndex)],
      },
      services: {
        orderBy: (services, { asc }) => [asc(services.orderIndex)],
      },
      projects: {
        orderBy: (projects, { asc }) => [asc(projects.orderIndex)],
      },
      events: {
        orderBy: (events, { asc }) => [asc(events.orderIndex)],
      },
    },
  });

  if (!user) {
    notFound();
  }

  // Determine if a template preview is active (public template browsing or Theme Studio)
  let previewTemplate = explicitTemplate;
  let previewPalette: string | undefined;
  let previewFont: string | undefined;
  let isStudioPreview = false;
  try {
    const headerList = await headers();
    previewTemplate ||= headerList.get("x-preview-template") || undefined;
    previewPalette = headerList.get("x-preview-palette") || undefined;
    previewFont = headerList.get("x-preview-font") || undefined;
    isStudioPreview = headerList.get("x-preview-studio") === "1";
  } catch {
    // In non-request contexts
  }
  const isPreview = Boolean(previewTemplate && previewTemplate in TEMPLATES);
  const activeTemplateId = isPreview
    ? (previewTemplate as TemplateId)
    : ((user.settings?.templateId as TemplateId) || "simple_professional");

  const signature = TEMPLATE_SIGNATURE_STYLES[activeTemplateId] || {
    palette: "slate",
    font: "sans",
  };

  return {
    ...user,
    // The Theme Studio renders its own controls, so it hides the public preview banner.
    isPreview: isPreview && !isStudioPreview,
    isStudioPreview: isPreview && isStudioPreview,
    previewTemplate: isPreview ? activeTemplateId : undefined,
    settings: {
      ...(user.settings || {
        id: "default-settings",
        userId: user.id,
        primaryColor: "#0f172a",
        accentColor: "#38bdf8",
        createdAt: new Date(),
        updatedAt: new Date(),
        seoTitle: null,
        seoDescription: null,
      }),
      templateId: activeTemplateId,
      // Studio previews use the chosen (unsaved) palette/font; public template
      // previews show each template's signature look.
      colorPalette:
        isPreview && previewPalette && previewPalette in PALETTES
          ? (previewPalette as ColorPalette)
          : isPreview
            ? signature.palette
            : (user.settings?.colorPalette || signature.palette),
      fontFamily:
        isPreview && previewFont && previewFont in FONTS
          ? (previewFont as FontFamily)
          : isPreview
            ? signature.font
            : (user.settings?.fontFamily || signature.font),
    },
  };
}

/** Request-scoped: metadata and page render share one query. */
export const getPortfolioData = cache(loadPortfolioData);

export type PortfolioUser = Awaited<ReturnType<typeof loadPortfolioData>>;
