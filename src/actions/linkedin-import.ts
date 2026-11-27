"use server";

import { db } from "@/db";
import { achievements, experiences, projects, users } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { makeKey } from "@/lib/linkedin/parse";
import { eq, max } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const text = (n: number) => z.string().trim().max(n);
const url = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === "" || /^https?:\/\/\S+$/i.test(v));

const payloadSchema = z.object({
  profile: z
    .object({
      headline: text(200).optional(),
      bio: text(5000).optional(),
      location: text(200).optional(),
    })
    .nullable(),
  experiences: z
    .array(
      z.object({
        company: text(200).min(1),
        role: text(200).min(1),
        location: text(200),
        startDate: text(20).min(2),
        endDate: text(20),
        isCurrent: z.boolean(),
        description: text(5000),
      }),
    )
    .max(100),
  achievements: z
    .array(
      z.object({
        title: text(300).min(1),
        issuer: text(300).min(1),
        issueDate: text(20),
        credentialUrl: url,
      }),
    )
    .max(100),
  projects: z
    .array(
      z.object({
        title: text(200).min(2),
        summary: text(2000),
        url,
        timeline: text(60),
      }),
    )
    .max(100),
});

export type LinkedInImportPayload = z.input<typeof payloadSchema>;

export type LinkedInImportResult =
  | {
      success: true;
      counts: {
        profile: boolean;
        experiences: number;
        achievements: number;
        projects: number;
        skipped: number;
      };
    }
  | { success: false; error: string };

function slugify(title: string) {
  return (
    title
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "project"
  );
}

export async function importLinkedInAction(
  payload: LinkedInImportPayload,
): Promise<LinkedInImportResult> {
  const user = await requireAuth();

  const parsed = payloadSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, error: "Some imported items were invalid. Please re-upload your export." };
  }
  const data = parsed.data;
  let skipped = 0;

  try {
    const counts = await db.transaction(async (tx) => {
      // Profile: only fields the user chose to apply (client omits the rest).
      let profileUpdated = false;
      if (data.profile) {
        const set: Partial<typeof users.$inferInsert> = {};
        if (data.profile.headline) set.headline = data.profile.headline;
        if (data.profile.bio) set.bio = data.profile.bio;
        if (data.profile.location) set.location = data.profile.location;
        if (Object.keys(set).length > 0) {
          await tx.update(users).set({ ...set, updatedAt: new Date() }).where(eq(users.id, user.id));
          profileUpdated = true;
        }
      }

      // Experiences — dedupe against existing rows.
      const existingExp = await tx.select().from(experiences).where(eq(experiences.userId, user.id));
      const expKeys = new Set(existingExp.map((e) => makeKey(e.company, e.role, e.startDate)));
      const [{ maxOrder: expMax }] = await tx
        .select({ maxOrder: max(experiences.orderIndex) })
        .from(experiences)
        .where(eq(experiences.userId, user.id));
      const newExp = data.experiences.filter((e) => {
        const k = makeKey(e.company, e.role, e.startDate);
        if (expKeys.has(k)) {
          skipped++;
          return false;
        }
        expKeys.add(k);
        return true;
      });
      if (newExp.length) {
        await tx.insert(experiences).values(
          newExp.map((e, i) => ({
            userId: user.id,
            company: e.company,
            role: e.role,
            location: e.location || null,
            startDate: e.startDate,
            endDate: e.isCurrent ? "Present" : e.endDate || null,
            isCurrent: e.isCurrent,
            description: e.description || null,
            orderIndex: (expMax ?? 0) + 1 + i,
          })),
        );
      }

      // Achievements (certifications)
      const existingAch = await tx.select().from(achievements).where(eq(achievements.userId, user.id));
      const achKeys = new Set(existingAch.map((a) => makeKey(a.title, a.issuer)));
      const [{ maxOrder: achMax }] = await tx
        .select({ maxOrder: max(achievements.orderIndex) })
        .from(achievements)
        .where(eq(achievements.userId, user.id));
      const newAch = data.achievements.filter((a) => {
        const k = makeKey(a.title, a.issuer);
        if (achKeys.has(k)) {
          skipped++;
          return false;
        }
        achKeys.add(k);
        return true;
      });
      if (newAch.length) {
        await tx.insert(achievements).values(
          newAch.map((a, i) => ({
            userId: user.id,
            title: a.title,
            issuer: a.issuer,
            issueDate: a.issueDate || null,
            credentialUrl: a.credentialUrl || null,
            orderIndex: (achMax ?? 0) + 1 + i,
          })),
        );
      }

      // Projects — slugs must be unique per user.
      const existingProj = await tx.select().from(projects).where(eq(projects.userId, user.id));
      const projTitles = new Set(existingProj.map((p) => makeKey(p.title)));
      const slugs = new Set(existingProj.map((p) => p.slug));
      const [{ maxOrder: projMax }] = await tx
        .select({ maxOrder: max(projects.orderIndex) })
        .from(projects)
        .where(eq(projects.userId, user.id));
      const newProj = data.projects.filter((p) => {
        const k = makeKey(p.title);
        if (projTitles.has(k)) {
          skipped++;
          return false;
        }
        projTitles.add(k);
        return true;
      });
      if (newProj.length) {
        await tx.insert(projects).values(
          newProj.map((p, i) => {
            const base = slugify(p.title);
            let slug = base;
            for (let n = 2; slugs.has(slug); n++) slug = `${base}-${n}`;
            slugs.add(slug);
            return {
              userId: user.id,
              title: p.title,
              slug,
              summary: p.summary.length >= 10 ? p.summary : `${p.title} — imported from LinkedIn.`,
              timeline: p.timeline || null,
              liveUrl: p.url || null,
              orderIndex: (projMax ?? 0) + 1 + i,
            };
          }),
        );
      }

      return {
        profile: profileUpdated,
        experiences: newExp.length,
        achievements: newAch.length,
        projects: newProj.length,
      };
    });

    for (const path of [
      "/dashboard",
      "/dashboard/profile",
      "/dashboard/experience",
      "/dashboard/achievements",
      "/dashboard/projects",
      `/${user.handle}`,
      `/${user.handle}/experience`,
      `/${user.handle}/achievements`,
      `/${user.handle}/projects`,
    ]) {
      revalidatePath(path);
    }

    return { success: true, counts: { ...counts, skipped } };
  } catch (err) {
    console.error("LinkedIn import failed", err);
    return { success: false, error: "Import failed. Nothing was saved — please try again." };
  }
}
