/**
 * LinkedIn data-export parsing. Pure and browser-safe: it runs client-side so
 * the (potentially huge) export ZIP never has to be uploaded; only the
 * structured items the user confirms are sent to the server.
 */

export type ImportedProfile = {
  name: string;
  headline: string;
  bio: string;
  location: string;
};

export type ImportedExperience = {
  key: string;
  company: string;
  role: string;
  location: string;
  startDate: string;
  endDate: string; // "YYYY-MM" | "YYYY" | "Present"
  isCurrent: boolean;
  description: string;
};

export type ImportedAchievement = {
  key: string;
  title: string;
  issuer: string;
  issueDate: string;
  credentialUrl: string;
};

export type ImportedProject = {
  key: string;
  title: string;
  summary: string;
  url: string;
  timeline: string;
};

export type LinkedInImport = {
  profile: ImportedProfile | null;
  experiences: ImportedExperience[];
  achievements: ImportedAchievement[];
  projects: ImportedProject[];
  skills: string[];
};

// ---------------------------------------------------------------- CSV

/** RFC-4180 CSV parser (quotes, escaped quotes, embedded newlines, BOM). */
export function parseCsv(input: string): string[][] {
  const text = input.replace(/^﻿/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

/** Parse a CSV into header-keyed records (header names are lower-cased). */
export function parseCsvRecords(input: string): Record<string, string>[] {
  const rows = parseCsv(input);
  // Some LinkedIn files start with a "Notes:" preamble; find the real header.
  const headerIdx = rows.findIndex((r) => r.length > 1);
  if (headerIdx === -1) return [];
  const headers = rows[headerIdx].map((h) => h.trim().toLowerCase());
  return rows.slice(headerIdx + 1).map((r) => {
    const rec: Record<string, string> = {};
    headers.forEach((h, i) => {
      rec[h] = (r[i] ?? "").trim();
    });
    return rec;
  });
}

// -------------------------------------------------------------- Dates

const MONTHS = [
  "jan", "feb", "mar", "apr", "may", "jun",
  "jul", "aug", "sep", "oct", "nov", "dec",
];

/** "Jan 2021" | "January 2021" | "1 Jan 2021" | "2021" | "2021-01" -> "2021-01" | "2021" | "". */
export function normalizeDate(raw: string): string {
  const s = raw.trim();
  if (!s) return "";
  const iso = s.match(/^(\d{4})-(\d{1,2})/);
  if (iso) return `${iso[1]}-${iso[2].padStart(2, "0")}`;
  const monthYear = s.match(/([A-Za-z]{3,})\.?,?\s+(\d{4})$/);
  if (monthYear) {
    const m = MONTHS.indexOf(monthYear[1].slice(0, 3).toLowerCase());
    if (m !== -1) return `${monthYear[2]}-${String(m + 1).padStart(2, "0")}`;
  }
  const year = s.match(/(\d{4})$/);
  return year ? year[1] : "";
}

// ------------------------------------------------------------ Mapping

const clean = (s: string | undefined) => (s ?? "").replace(/\r/g, "").trim();

export function makeKey(...parts: string[]) {
  return parts.map((p) => p.toLowerCase().replace(/\s+/g, " ").trim()).join("|");
}

function mapProfile(rows: Record<string, string>[]): ImportedProfile | null {
  const r = rows[0];
  if (!r) return null;
  const name = [r["first name"], r["last name"]].filter(Boolean).join(" ").trim();
  const profile: ImportedProfile = {
    name,
    headline: clean(r["headline"]),
    bio: clean(r["summary"]),
    location: clean(r["geo location"]) || clean(r["address"]),
  };
  return profile.name || profile.headline || profile.bio || profile.location ? profile : null;
}

function mapExperiences(rows: Record<string, string>[]): ImportedExperience[] {
  const out: ImportedExperience[] = [];
  for (const r of rows) {
    const company = clean(r["company name"]);
    const role = clean(r["title"]);
    const startDate = normalizeDate(r["started on"] ?? "");
    if (!company || !role || !startDate) continue;
    const end = normalizeDate(r["finished on"] ?? "");
    out.push({
      key: makeKey(company, role, startDate),
      company,
      role,
      location: clean(r["location"]),
      startDate,
      endDate: end || "Present",
      isCurrent: !end,
      description: clean(r["description"]),
    });
  }
  // Newest first, current roles on top.
  return out.sort((a, b) => {
    if (a.isCurrent !== b.isCurrent) return a.isCurrent ? -1 : 1;
    return b.startDate.localeCompare(a.startDate);
  });
}

function mapAchievements(rows: Record<string, string>[]): ImportedAchievement[] {
  const out: ImportedAchievement[] = [];
  for (const r of rows) {
    const title = clean(r["name"]);
    if (!title) continue;
    const issuer = clean(r["authority"]) || "LinkedIn";
    out.push({
      key: makeKey(title, issuer),
      title,
      issuer,
      issueDate: normalizeDate(r["started on"] ?? ""),
      credentialUrl: /^https?:\/\//i.test(clean(r["url"])) ? clean(r["url"]) : "",
    });
  }
  return out.sort((a, b) => b.issueDate.localeCompare(a.issueDate));
}

function mapProjects(rows: Record<string, string>[]): ImportedProject[] {
  const out: ImportedProject[] = [];
  for (const r of rows) {
    const title = clean(r["title"]);
    if (!title) continue;
    const start = normalizeDate(r["started on"] ?? "");
    const end = normalizeDate(r["finished on"] ?? "");
    out.push({
      key: makeKey(title),
      title,
      summary: clean(r["description"]),
      url: /^https?:\/\//i.test(clean(r["url"])) ? clean(r["url"]) : "",
      timeline: start ? (end && end !== start ? `${start} – ${end}` : start) : "",
    });
  }
  return out;
}

/** Build a normalized import from a map of file basename (lower-case) -> CSV text. */
export function buildImport(files: Record<string, string>): LinkedInImport {
  const rec = (name: string) => (files[name] ? parseCsvRecords(files[name]) : []);
  const skills = rec("skills.csv")
    .map((r) => clean(r["name"]))
    .filter(Boolean);
  return {
    profile: mapProfile(rec("profile.csv")),
    experiences: mapExperiences(rec("positions.csv")),
    achievements: mapAchievements(rec("certifications.csv")),
    projects: mapProjects(rec("projects.csv")),
    skills: Array.from(new Set(skills)),
  };
}

export const LINKEDIN_CSV_NAMES = [
  "profile.csv",
  "positions.csv",
  "certifications.csv",
  "projects.csv",
  "skills.csv",
] as const;

// ---------------------------------------------------------------- ZIP

/**
 * Minimal ZIP reader (stored + deflate) using the browser's native
 * DecompressionStream, so no dependency is needed. Only entries whose
 * basename is in `wanted` are inflated.
 */
export async function readZipCsvs(
  buffer: ArrayBuffer,
  wanted: readonly string[] = LINKEDIN_CSV_NAMES,
): Promise<Record<string, string>> {
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  // Locate End Of Central Directory record (scan backwards).
  let eocd = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 22 - 65535); i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd === -1) throw new Error("This doesn't look like a valid ZIP file.");

  const count = view.getUint16(eocd + 10, true);
  let p = view.getUint32(eocd + 16, true);
  const decoder = new TextDecoder("utf-8");
  const result: Record<string, string> = {};

  for (let n = 0; n < count; n++) {
    if (view.getUint32(p, true) !== 0x02014b50) break;
    const method = view.getUint16(p + 10, true);
    const compSize = view.getUint32(p + 20, true);
    const nameLen = view.getUint16(p + 28, true);
    const extraLen = view.getUint16(p + 30, true);
    const commentLen = view.getUint16(p + 32, true);
    const localOffset = view.getUint32(p + 42, true);
    const name = decoder.decode(bytes.subarray(p + 46, p + 46 + nameLen));
    p += 46 + nameLen + extraLen + commentLen;

    const base = name.split("/").pop()!.toLowerCase();
    if (!wanted.includes(base) || result[base] !== undefined) continue;

    const lNameLen = view.getUint16(localOffset + 26, true);
    const lExtraLen = view.getUint16(localOffset + 28, true);
    const start = localOffset + 30 + lNameLen + lExtraLen;
    const data = bytes.subarray(start, start + compSize);

    if (method === 0) {
      result[base] = decoder.decode(data);
    } else if (method === 8) {
      const stream = new Blob([data as BlobPart])
        .stream()
        .pipeThrough(new DecompressionStream("deflate-raw"));
      result[base] = decoder.decode(await new Response(stream).arrayBuffer());
    }
  }
  return result;
}

/** Accepts a ZIP and/or loose CSV files; returns csv-name -> text. */
export async function readLinkedInFiles(files: File[]): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  for (const file of files) {
    const lower = file.name.toLowerCase();
    if (lower.endsWith(".zip")) {
      Object.assign(out, await readZipCsvs(await file.arrayBuffer()));
    } else if (lower.endsWith(".csv")) {
      const base = lower.split("/").pop()!;
      if ((LINKEDIN_CSV_NAMES as readonly string[]).includes(base)) {
        out[base] = await file.text();
      }
    }
  }
  return out;
}
