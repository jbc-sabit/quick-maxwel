import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { db } from "@/db";
import { achievements, experiences, projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { makeKey } from "@/lib/linkedin/parse";
import { LinkedinIcon as Linkedin } from "@/components/icons";
import { ImportWizard } from "./import-wizard";

export default async function ImportPage() {
  const user = await requireAuth();

  const [exps, achs, projs] = await Promise.all([
    db.select().from(experiences).where(eq(experiences.userId, user.id)),
    db.select().from(achievements).where(eq(achievements.userId, user.id)),
    db.select().from(projects).where(eq(projects.userId, user.id)),
  ]);

  return (
    <div className="w-full max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-50 flex items-center gap-2.5">
          <Linkedin className="h-7 w-7 text-sky-400" />
          <span>Import from LinkedIn</span>
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Fill your portfolio in under a minute using the data LinkedIn already has on you.
        </p>
      </div>

      <ImportWizard
        current={{
          headline: user.headline ?? "",
          bio: user.bio ?? "",
          location: user.location ?? "",
        }}
        existing={{
          experiences: exps.map((e) => makeKey(e.company, e.role, e.startDate)),
          achievements: achs.map((a) => makeKey(a.title, a.issuer)),
          projects: projs.map((p) => makeKey(p.title)),
        }}
      />
    </div>
  );
}

export const metadata: Metadata = { title: "Import from LinkedIn" };
