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

function withStudioHeaders(
  request: NextRequest,
  preview: { template: string; palette: string; font: string },
  proceed: (init?: Parameters<typeof NextResponse.next>[0]) => NextResponse
) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-preview-template", preview.template);
  requestHeaders.set("x-preview-palette", preview.palette);
  requestHeaders.set("x-preview-font", preview.font);
  requestHeaders.set("x-preview-studio", "1");
  return proceed({ request: { headers: requestHeaders } });
}

/**
 * Subdomain portfolios: `<handle>.<app domain>` serves the same portfolio as
 * `<app domain>/<handle>`. The app domain is taken from `NEXT_PUBLIC_APP_URL` (e.g. "https://example.com") and must
 * be set for this to work in production; `<handle>.localhost` always works for
 * local development. Hosts like `www` or the bare root domain are untouched.
 */
const NON_PORTFOLIO_SUBDOMAINS = new Set(["www", "app", "api"]);
const HANDLE_LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

function getConfiguredRootHost(): string | null {
  const value = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!value) return null;
  try {
    return new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function getSubdomainHandle(hostHeader: string | null): string | null {
  if (!hostHeader) return null;
  const host = hostHeader.split(":")[0].toLowerCase();
  const roots = ["localhost"];
  const configured = getConfiguredRootHost();
  if (configured) roots.push(configured);
  for (const root of roots) {
    if (!host.endsWith(`.${root}`)) continue;
    const label = host.slice(0, -(root.length + 1));
    // Only a single label counts (a.b.example.com is not a portfolio).
    if (label.includes(".") || !HANDLE_LABEL.test(label) || NON_PORTFOLIO_SUBDOMAINS.has(label)) return null;
    return label;
  }
  return null;
}

export async function proxy(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  let pathname = request.nextUrl.pathname;

  const subdomainHandle = getSubdomainHandle(request.headers.get("host"));
  const originalUrl = request.nextUrl.clone();
  if (subdomainHandle) {
    // Accounts live on the root domain (session cookies are host-bound).
    if (pathname.startsWith("/dashboard") || pathname === "/login" || pathname === "/register") {
      const rootUrl = request.nextUrl.clone();
      rootUrl.host = request.headers.get("host")!.replace(`${subdomainHandle}.`, "");
      return NextResponse.redirect(rootUrl);
    }
    // Links inside a portfolio may already include "/<handle>"; don't double it.
    const alreadyPrefixed = pathname === `/${subdomainHandle}` || pathname.startsWith(`/${subdomainHandle}/`);
    if (!alreadyPrefixed) pathname = `/${subdomainHandle}${pathname === "/" ? "" : pathname}`;
  }
  // On a subdomain, pass requests through as a rewrite to the handle's path.
  const proceed = (init?: Parameters<typeof NextResponse.next>[0]) => {
    if (!subdomainHandle) return NextResponse.next(init);
    const target = originalUrl.clone();
    target.pathname = pathname;
    return NextResponse.rewrite(target, init);
  };
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
      const response = withStudioHeaders(request, preview, proceed);
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
    if (preview) return withStudioHeaders(request, preview, proceed);
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
    const response = proceed({
      request: { headers: requestHeaders },
    });
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
    return proceed({
      request: { headers: requestHeaders },
    });
  }

  return proceed();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
