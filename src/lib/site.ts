/** Root domain every portfolio subdomain lives under, e.g. `alex.portfolioosite.dev`. */
export const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "portfolioosite.dev";

/** `alex` -> `alex.portfolioosite.dev` */
export function subdomainHost(handle: string) {
  return `${handle}.${ROOT_DOMAIN}`;
}
