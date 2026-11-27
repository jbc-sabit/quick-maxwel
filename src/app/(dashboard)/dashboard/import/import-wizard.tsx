"use client";

import { useCallback, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Award,
  Briefcase,
  CheckCircle2,
  FolderKanban,
  Loader2,
  ShieldCheck,
  UploadCloud,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { importLinkedInAction, type LinkedInImportResult } from "@/actions/linkedin-import";
import { buildImport, readLinkedInFiles, type LinkedInImport } from "@/lib/linkedin/parse";

type Props = {
  current: { headline: string; bio: string; location: string };
  existing: { experiences: string[]; achievements: string[]; projects: string[] };
};

type Section = "experiences" | "achievements" | "projects";

export function ImportWizard({ current, existing }: Props) {
  const [data, setData] = useState<LinkedInImport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [selected, setSelected] = useState<Record<Section, Set<string>>>({
    experiences: new Set(),
    achievements: new Set(),
    projects: new Set(),
  });
  const [profilePick, setProfilePick] = useState({ headline: false, bio: false, location: false });
  const [result, setResult] = useState<Extract<LinkedInImportResult, { success: true }> | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const dupes = useMemo(
    () => ({
      experiences: new Set(existing.experiences),
      achievements: new Set(existing.achievements),
      projects: new Set(existing.projects),
    }),
    [existing],
  );

  const handleFiles = useCallback(
    async (fileList: FileList | File[]) => {
      setError(null);
      setParsing(true);
      try {
        const files = Array.from(fileList);
        if (files.length === 0) return;
        const csvs = await readLinkedInFiles(files);
        if (Object.keys(csvs).length === 0) {
          setError(
            "We couldn't find any LinkedIn data in that file. Upload the ZIP LinkedIn emailed you (or its Profile/Positions CSVs).",
          );
          return;
        }
        const parsed = buildImport(csvs);
        const total =
          parsed.experiences.length +
          parsed.achievements.length +
          parsed.projects.length +
          (parsed.profile ? 1 : 0);
        if (total === 0) {
          setError("That export doesn't contain any profile, positions, certifications or projects.");
          return;
        }
        setData(parsed);
        setSelected({
          experiences: new Set(parsed.experiences.map((e) => e.key).filter((k) => !dupes.experiences.has(k))),
          achievements: new Set(parsed.achievements.map((a) => a.key).filter((k) => !dupes.achievements.has(k))),
          projects: new Set(parsed.projects.map((p) => p.key).filter((k) => !dupes.projects.has(k))),
        });
        // Only pre-select profile fields that won't overwrite something the user already wrote.
        setProfilePick({
          headline: !!parsed.profile?.headline && !current.headline,
          bio: !!parsed.profile?.bio && !current.bio,
          location: !!parsed.profile?.location && !current.location,
        });
      } catch {
        setError("Couldn't read that file. Make sure it's the original ZIP from LinkedIn.");
      } finally {
        setParsing(false);
      }
    },
    [current, dupes],
  );

  const toggle = (section: Section, key: string) =>
    setSelected((prev) => {
      const next = new Set(prev[section]);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return { ...prev, [section]: next };
    });

  const toggleAll = (section: Section, keys: string[]) =>
    setSelected((prev) => {
      const allOn = keys.every((k) => prev[section].has(k));
      return { ...prev, [section]: new Set(allOn ? [] : keys) };
    });

  const selectedCount =
    selected.experiences.size +
    selected.achievements.size +
    selected.projects.size +
    Object.values(profilePick).filter(Boolean).length;

  const submit = () => {
    if (!data) return;
    setError(null);
    startTransition(async () => {
      const res = await importLinkedInAction({
        profile: data.profile
          ? {
              headline: profilePick.headline ? data.profile.headline : "",
              bio: profilePick.bio ? data.profile.bio : "",
              location: profilePick.location ? data.profile.location : "",
            }
          : null,
        experiences: data.experiences.filter((e) => selected.experiences.has(e.key)),
        achievements: data.achievements.filter((a) => selected.achievements.has(a.key)),
        projects: data.projects.filter((p) => selected.projects.has(p.key)),
      });
      if (res.success) setResult(res);
      else setError(res.error);
    });
  };

  // ------------------------------------------------------------ Done
  if (result) {
    const c = result.counts;
    return (
      <Card className="p-8 text-center space-y-5">
        <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto" />
        <div>
          <h2 className="text-xl font-bold text-zinc-50">Your portfolio is filled in</h2>
          <p className="text-sm text-zinc-400 mt-1">
            Imported {c.experiences} experience{c.experiences === 1 ? "" : "s"}, {c.achievements} certification
            {c.achievements === 1 ? "" : "s"} and {c.projects} project{c.projects === 1 ? "" : "s"}
            {c.profile ? ", and updated your profile" : ""}.
            {c.skipped > 0 && ` ${c.skipped} duplicate${c.skipped === 1 ? " was" : "s were"} skipped.`}
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild className="h-11 px-5 rounded-xl bg-sky-500 hover:bg-sky-400 text-black text-sm font-semibold">
            <Link href="/dashboard/experience">Review experience</Link>
          </Button>
          <Button asChild variant="outline" className="h-11 px-5 rounded-xl text-sm font-semibold">
            <Link href="/dashboard">Back to overview</Link>
          </Button>
        </div>
      </Card>
    );
  }

  // ---------------------------------------------------------- Upload
  if (!data) {
    return (
      <div className="space-y-6">
        <Card className="p-6 space-y-4">
          <h2 className="text-base font-bold text-zinc-50">1. Get your data from LinkedIn</h2>
          <ol className="list-decimal pl-5 space-y-1.5 text-sm text-zinc-400">
            <li>
              Open{" "}
              <a
                href="https://www.linkedin.com/mypreferences/d/download-my-data"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-400 hover:underline"
              >
                LinkedIn → Settings → Data privacy → Get a copy of your data
              </a>
              .
            </li>
            <li>
              Choose <strong className="text-zinc-200">&ldquo;Want something in particular?&rdquo;</strong> and tick{" "}
              <strong className="text-zinc-200">Profile, Positions, Certifications, Projects, Skills</strong>, then
              request the archive.
            </li>
            <li>LinkedIn emails you a ZIP (usually within ~10 minutes). Download it — no need to unzip.</li>
          </ol>
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="text-base font-bold text-zinc-50">2. Drop the ZIP here</h2>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              void handleFiles(e.dataTransfer.files);
            }}
            onClick={() => inputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
            className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-12 cursor-pointer transition-colors ${
              dragging ? "border-sky-400 bg-sky-500/10" : "border-zinc-700 hover:border-sky-500/60"
            }`}
          >
            {parsing ? (
              <Loader2 className="h-8 w-8 animate-spin text-sky-400" />
            ) : (
              <UploadCloud className="h-8 w-8 text-sky-400" />
            )}
            <p className="text-sm font-semibold text-zinc-200">
              {parsing ? "Reading your export…" : "Drag & drop your LinkedIn ZIP, or click to browse"}
            </p>
            <p className="text-xs text-zinc-500">You can also drop the individual CSV files.</p>
            <input
              ref={inputRef}
              type="file"
              accept=".zip,.csv"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && void handleFiles(e.target.files)}
            />
          </div>
          <p className="flex items-start gap-2 text-xs text-zinc-500">
            <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" />
            Your file is read in your browser. Only the items you confirm on the next screen are saved — nothing else
            leaves your device.
          </p>
          {error && <ErrorNote message={error} />}
        </Card>
      </div>
    );
  }

  // ---------------------------------------------------------- Review
  return (
    <div className="space-y-6">
      {data.profile && (
        <Card className="p-6 space-y-4">
          <SectionTitle icon={<User className="h-4 w-4" />} title="Profile" />
          {(["headline", "bio", "location"] as const).map((field) => {
            const value = data.profile![field];
            if (!value) return null;
            const overwrites = !!current[field];
            return (
              <label key={field} className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 accent-sky-500"
                  checked={profilePick[field]}
                  onChange={() => setProfilePick((p) => ({ ...p, [field]: !p[field] }))}
                />
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    {field}
                    {overwrites && <span className="ml-2 normal-case text-amber-400">replaces your current {field}</span>}
                  </p>
                  <p className="text-sm text-zinc-200 line-clamp-3 whitespace-pre-line">{value}</p>
                </div>
              </label>
            );
          })}
        </Card>
      )}

      <ReviewList
        title="Experience"
        icon={<Briefcase className="h-4 w-4" />}
        items={data.experiences.map((e) => ({
          key: e.key,
          title: e.role,
          subtitle: `${e.company}${e.location ? ` · ${e.location}` : ""}`,
          meta: `${e.startDate} – ${e.endDate}`,
          duplicate: dupes.experiences.has(e.key),
        }))}
        selected={selected.experiences}
        onToggle={(k) => toggle("experiences", k)}
        onToggleAll={(keys) => toggleAll("experiences", keys)}
      />
      <ReviewList
        title="Certifications"
        icon={<Award className="h-4 w-4" />}
        items={data.achievements.map((a) => ({
          key: a.key,
          title: a.title,
          subtitle: a.issuer,
          meta: a.issueDate,
          duplicate: dupes.achievements.has(a.key),
        }))}
        selected={selected.achievements}
        onToggle={(k) => toggle("achievements", k)}
        onToggleAll={(keys) => toggleAll("achievements", keys)}
      />
      <ReviewList
        title="Projects"
        icon={<FolderKanban className="h-4 w-4" />}
        items={data.projects.map((p) => ({
          key: p.key,
          title: p.title,
          subtitle: p.summary.slice(0, 100),
          meta: p.timeline,
          duplicate: dupes.projects.has(p.key),
        }))}
        selected={selected.projects}
        onToggle={(k) => toggle("projects", k)}
        onToggleAll={(keys) => toggleAll("projects", keys)}
      />

      {data.skills.length > 0 && (
        <p className="text-xs text-zinc-500">
          {data.skills.length} skills were found in your export. Skills aren&apos;t a separate section yet, so they
          aren&apos;t imported.
        </p>
      )}

      {error && <ErrorNote message={error} />}

      <div className="sticky bottom-4 flex items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-background/90 p-4 backdrop-blur">
        <Button variant="ghost" onClick={() => setData(null)} disabled={pending}>
          Start over
        </Button>
        <Button
          onClick={submit}
          disabled={pending || selectedCount === 0}
          className="h-11 px-6 rounded-xl bg-sky-500 hover:bg-sky-400 text-black text-sm font-semibold"
        >
          {pending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
          Import {selectedCount} item{selectedCount === 1 ? "" : "s"}
        </Button>
      </div>
    </div>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-zinc-200">
      <span className="text-sky-400">{icon}</span>
      {title}
    </h2>
  );
}

function ErrorNote({ message }: { message: string }) {
  return (
    <p className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
      {message}
    </p>
  );
}

type ReviewItem = { key: string; title: string; subtitle: string; meta: string; duplicate: boolean };

function ReviewList({
  title,
  icon,
  items,
  selected,
  onToggle,
  onToggleAll,
}: {
  title: string;
  icon: React.ReactNode;
  items: ReviewItem[];
  selected: Set<string>;
  onToggle: (key: string) => void;
  onToggleAll: (keys: string[]) => void;
}) {
  if (items.length === 0) return null;
  const selectable = items.filter((i) => !i.duplicate).map((i) => i.key);
  return (
    <Card className="p-6 space-y-3">
      <div className="flex items-center justify-between">
        <SectionTitle icon={icon} title={`${title} (${items.length})`} />
        {selectable.length > 0 && (
          <button
            type="button"
            onClick={() => onToggleAll(selectable)}
            className="text-xs font-semibold text-sky-400 hover:underline"
          >
            {selectable.every((k) => selected.has(k)) ? "Deselect all" : "Select all"}
          </button>
        )}
      </div>
      <ul className="divide-y divide-zinc-800">
        {items.map((item) => (
          <li key={item.key}>
            <label
              className={`flex items-start gap-3 py-3 ${item.duplicate ? "opacity-50" : "cursor-pointer"}`}
            >
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 accent-sky-500"
                disabled={item.duplicate}
                checked={selected.has(item.key)}
                onChange={() => onToggle(item.key)}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-zinc-100 truncate">{item.title}</p>
                {item.subtitle && <p className="text-xs text-zinc-400 truncate">{item.subtitle}</p>}
              </div>
              {item.duplicate ? (
                <Badge variant="secondary">Already added</Badge>
              ) : (
                item.meta && <span className="text-xs text-zinc-500 shrink-0">{item.meta}</span>
              )}
            </label>
          </li>
        ))}
      </ul>
    </Card>
  );
}
