import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { getSessionKey } from "@/lib/session-secret";
import { isBlockedDemoAccount } from "@/lib/demo-account";

const VALID_TEMPLATES = [
  "developer_terminal",
  "minimal_swiss",
  "aurora_studio",
  "bento_grid",
  "fancy_creative",
  "simple_professional",
];

const VALID_PALETTES = ["slate", "emerald", "neon", "terracotta", "ocean"];
const VALID_FONTS = ["sans", "serif", "mono"];
const STUDIO_COOKIE = "pb_studio_preview";
const PREVIEW_COOKIE = "pb_preview_template";

/**
 * Theme Studio preview: `?studio=1&template=…&palette=…&font=…` renders the
 * portfolio with unsaved theme settings. The choice is remembered in a cookie
 * that is only honoured for iframe loads (Sec-Fetch-Dest: iframe), so it never
 * leaks into the owner's normal browsing tabs.
 */
function parseStudioPreview(value: string | null | undefined) {
  if (!value) return null;
  const [template, palette, font] = value.split(".");
  if (!VALID_TEMPLATES.includes(template) || !VALID_PALETTES.includes(palette) || !VALID_FONTS.includes(font)) {
    return null;
  }
  return { template, palette, font };
}

function withStudioHeaders(request: NextRequest, preview: { template: string; palette: string; font: string }) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-preview-template", preview.template);
  requestHeaders.set("x-preview-palette", preview.palette);
  requestHeaders.set("x-preview-font", preview.font);
  requestHeaders.set("x-preview-studio", "1");
  return NextResponse.next({ request: { headers: requestHeaders } });
}

/**
 * Per-user subdomains: `sabit.<ROOT_DOMAIN>` serves `<ROOT_DOMAIN>/sabit`.
 * ROOT_DOMAIN is the bare host the app lives on, including the port when it
 * has one (e.g. "mydomain.com" or "localhost:3000"). Unset = feature off.
 */
const RESERVED_SUBDOMAINS = new Set(["www", "app", "api", "admin", "dashboard", "mail", "static", "assets"]);

function getProfileSubdomain(hostHeader: string | null): { handle: string; rootHost: string } | null {
  const rootHost = process.env.ROOT_DOMAIN?.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const host = hostHeader?.trim().toLowerCase();
  if (!rootHost || !host || !host.endsWith(`.${rootHost}`)) return null;
  const handle = host.slice(0, -(rootHost.length + 1));
  // Exactly one label, a valid handle, and not a name we keep for the platform.
  if (!/^[a-z0-9][a-z0-9-]*$/.test(handle) || RESERVED_SUBDOMAINS.has(handle)) return null;
  return { handle, rootHost };
}

export async function proxy(request: NextRequest) {
  let { pathname } = request.nextUrl;
  const { searchParams } = request.nextUrl;
  const sessionCookie = request.cookies.get("pb_session")?.value;

  // Handle exiting preview mode
  if (searchParams.get("exit_preview") === "true") {
    const cleanUrl = new URL(request.url);
    cleanUrl.searchParams.delete("exit_preview");
    cleanUrl.searchParams.delete("template");
    const response = NextResponse.redirect(cleanUrl);
    response.cookies.delete(PREVIEW_COOKIE);
    return response;
  }

  // Subdomain -> profile. `/foo` on sabit.<root> is served from `/sabit/foo`.
  let rewriteTarget: URL | null = null;
  const subdomain = getProfileSubdomain(request.headers.get("host"));
  if (subdomain) {
    const { handle, rootHost } = subdomain;
    // Sign-in and the dashboard live on the main domain only.
    if (/^\/(dashboard|login|register)(\/|$)/.test(pathname)) {
      const url = new URL(request.url);
      return NextResponse.redirect(`${url.protocol}//${rootHost}${url.pathname}${url.search}`);
    }
    // Real files (logo.svg, robots.txt, ...) are served as they are.
    if (!/\.[a-z0-9]+$/i.test(pathname)) {
      if (pathname === `/${handle}` || pathname.startsWith(`/${handle}/`)) {
        // Links generated as /<handle>/... get the clean subdomain URL.
        const url = new URL(request.url);
        url.pathname = pathname.slice(handle.length + 1) || "/";
        return NextResponse.redirect(url, 308);
      }
      pathname = `/${handle}${pathname === "/" ? "" : pathname}`;
      rewriteTarget = new URL(request.url);
      rewriteTarget.pathname = pathname;
    }
  }
  const next = (headers?: Headers) => {
    const init = headers ? { request: { headers } } : undefined;
    return rewriteTarget ? NextResponse.rewrite(rewriteTarget, init) : NextResponse.next(init);
  };

  let isAuthenticated = false;
  // A session for the public demo account is invalid in production; clear it
  // so /login and /dashboard don't bounce between each other.
  let clearDemoSession = false;
  if (sessionCookie) {
    try {
      const { payload } = await jwtVerify(sessionCookie, getSessionKey(), { algorithms: ["HS256"] });
      if (isBlockedDemoAccount(typeof payload.email === "string" ? payload.email : null)) {
        clearDemoSession = true;
      } else {
        isAuthenticated = true;
      }
    } catch {
      isAuthenticated = false;
    }
  }
  const withSessionCleanup = (response: NextResponse) => {
    if (clearDemoSession) response.cookies.delete("pb_session");
    return response;
  };

  // Protected dashboard routes
  if (pathname.startsWith("/dashboard")) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return withSessionCleanup(NextResponse.redirect(loginUrl));
    }
    return NextResponse.next();
  }

  // Auth pages (login/register) - redirect to dashboard if already logged in
  if (pathname === "/login" || pathname === "/register") {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return withSessionCleanup(NextResponse.next());
  }

  // Theme Studio live preview (embedded in the dashboard)
  if (searchParams.get("studio") === "1") {
    const preview = parseStudioPreview(
      `${searchParams.get("template")}.${searchParams.get("palette")}.${searchParams.get("font")}`
    );
    if (preview) {
      const response = withStudioHeaders(request, preview);
      response.cookies.set(STUDIO_COOKIE, `${preview.template}.${preview.palette}.${preview.font}`, {
        path: "/",
        sameSite: "lax",
        maxAge: 60 * 60 * 12,
      });
      return response;
    }
  }
  if (request.headers.get("sec-fetch-dest") === "iframe" && !pathname.startsWith("/dashboard")) {
    const preview = parseStudioPreview(request.cookies.get(STUDIO_COOKIE)?.value);
    if (preview) return withStudioHeaders(request, preview);
  }

  // Template preview (`?template=<id>`, used by the public template gallery).
  // It is tied to the single profile it was started on (the cookie stores
  // "<handle>:<template>"), so previewing one profile never changes how any
  // other profile renders. It ends with the browser session or via exit_preview.
  const profileHandle = pathname.split("/")[1]?.toLowerCase() || "";
  const templateParam = searchParams.get("template");
  if (profileHandle && templateParam && VALID_TEMPLATES.includes(templateParam)) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-preview-template", templateParam);
    const response = next(requestHeaders);
    response.cookies.set(PREVIEW_COOKIE, `${profileHandle}:${templateParam}`, {
      path: "/",
      sameSite: "lax",
    });
    return response;
  }

  // Forward an existing preview only to the profile it belongs to.
  const [previewHandle, previewTemplate] = (request.cookies.get(PREVIEW_COOKIE)?.value ?? "").split(":");
  if (
    profileHandle &&
    previewHandle === profileHandle &&
    VALID_TEMPLATES.includes(previewTemplate) &&
    !pathname.startsWith("/dashboard")
  ) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-preview-template", previewTemplate);
    return next(requestHeaders);
  }

  return next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
