import { ImageResponse } from "next/og";
import { ROOT_DOMAIN, subdomainHost } from "@/lib/site";
import { SITE_NAME, siteUrl, toDescription } from "@/lib/seo";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const SUPPORTED = ["image/png", "image/jpeg", "image/gif"];

/**
 * Satori can't load some remote images and a failed fetch would break the whole
 * card, so images are pre-fetched into data URLs and silently dropped on failure.
 */
export async function loadImage(url: string | null | undefined): Promise<string | null> {
  if (!url) return null;
  try {
    const abs = /^https?:\/\//i.test(url) ? url : `${siteUrl()}${url.startsWith("/") ? "" : "/"}${url}`;
    const res = await fetch(abs, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    const type = (res.headers.get("content-type") || "").split(";")[0].trim();
    if (!SUPPORTED.includes(type)) return null;
    const buf = await res.arrayBuffer();
    if (buf.byteLength > 3_000_000) return null;
    return `data:${type};base64,${Buffer.from(buf).toString("base64")}`;
  } catch {
    return null;
  }
}

type Card = {
  eyebrow: string;
  title: string;
  subtitle?: string | null;
  /** Bottom-left line, e.g. the owner's name. */
  byline?: string;
  /** Bottom-right line, e.g. `sarah.portfolioosite.dev`. */
  host: string;
  /** Large cover behind the text (projects, articles). */
  background?: string | null;
  /** Round portrait on the right (profile cards). */
  avatar?: string | null;
};

function fit(title: string) {
  const t = title.trim();
  const size = t.length > 70 ? 54 : t.length > 40 ? 66 : 80;
  return { text: t.length > 110 ? t.slice(0, 109) + "…" : t, size };
}

export function renderCard(card: Card) {
  const { text, size } = fit(card.title);
  const subtitle = toDescription(card.subtitle, 140);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: "linear-gradient(135deg, #09090b 0%, #0c1a2b 100%)",
          color: "#fafafa",
          fontFamily: "sans-serif",
        }}
      >
        {card.background ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={card.background}
            alt=""
            width={1200}
            height={630}
            style={{ position: "absolute", inset: 0, width: 1200, height: 630, objectFit: "cover" }}
          />
        ) : null}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            background: card.background
              ? "linear-gradient(90deg, rgba(9,9,11,0.97) 0%, rgba(9,9,11,0.9) 55%, rgba(9,9,11,0.75) 100%)"
              : "radial-gradient(circle at 85% 15%, rgba(56,189,248,0.22), rgba(9,9,11,0) 55%)",
          }}
        />

        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            height: "100%",
            padding: "64px 72px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div
              style={{
                display: "flex",
                padding: "8px 20px",
                borderRadius: 999,
                border: "2px solid rgba(56,189,248,0.5)",
                background: "rgba(56,189,248,0.12)",
                color: "#38bdf8",
                fontSize: 26,
                fontWeight: 700,
                letterSpacing: 2,
                textTransform: "uppercase",
              }}
            >
              {card.eyebrow}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 48 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 24, flex: 1 }}>
              <div style={{ display: "flex", fontSize: size, fontWeight: 800, lineHeight: 1.08, letterSpacing: -1.5 }}>
                {text}
              </div>
              {subtitle ? (
                <div style={{ display: "flex", fontSize: 32, color: "#a1a1aa", lineHeight: 1.35 }}>{subtitle}</div>
              ) : null}
            </div>
            {card.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={card.avatar}
                alt=""
                width={240}
                height={240}
                style={{ width: 240, height: 240, borderRadius: 120, objectFit: "cover", border: "6px solid #38bdf8" }}
              />
            ) : null}
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 28 }}>
            <div style={{ display: "flex", color: "#e4e4e7", fontWeight: 600 }}>{card.byline ?? SITE_NAME}</div>
            <div style={{ display: "flex", color: "#38bdf8", fontWeight: 700 }}>{card.host}</div>
          </div>
        </div>
      </div>
    ),
    OG_SIZE,
  );
}

/** Convenience: host line for a portfolio. */
export const portfolioHost = (handle: string) => subdomainHost(handle);
export { ROOT_DOMAIN };

/** Card for a portfolio section page (Projects, Experience, …). */
export async function renderSectionCard(handle: string, label: string, subtitle: (p: Awaited<ReturnType<typeof import("@/lib/portfolio-data").getPortfolioData>>) => string) {
  const { getPortfolioData } = await import("@/lib/portfolio-data");
  const p = await getPortfolioData(handle);
  return renderCard({
    eyebrow: p.name,
    title: label,
    subtitle: subtitle(p),
    byline: p.headline || p.name,
    host: portfolioHost(p.handle),
    avatar: await loadImage(p.avatarUrl),
  });
}
