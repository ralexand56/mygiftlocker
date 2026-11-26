/**
 * Language addresses for public pages: /es/size-charts shows /size-charts in Spanish, etc.
 * The page is served from its normal route; a request header tells i18n/request.ts the language.
 * /en/… and language-prefixed private pages (/es/locker) redirect to the plain address.
 */
import { NextResponse, type NextRequest } from "next/server";
import { LOCALE_COOKIE } from "./i18n/cookie";
import { isPublicPath, LOCALE_HEADER } from "./lib/site";

const PREFIXED = /^\/(en|es|fr|pt|ru)(\/.*)?$/;

export function proxy(request: NextRequest) {
  const match = request.nextUrl.pathname.match(PREFIXED);
  if (!match) return NextResponse.next();
  const locale = match[1]!;
  let path = match[2] || "/";
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);

  const url = request.nextUrl.clone();
  url.pathname = path;
  const headers = new Headers(request.headers);
  headers.set(LOCALE_HEADER, locale);
  const response =
    locale === "en" || !isPublicPath(path) ? NextResponse.redirect(url, 308) : NextResponse.rewrite(url, { request: { headers } });

  // First visit: remember the language from the address, so other pages match it.
  if (!request.cookies.has(LOCALE_COOKIE)) {
    response.cookies.set(LOCALE_COOKIE, locale, { path: "/", maxAge: 31536000, sameSite: "lax" });
  }
  return response;
}

export const config = { matcher: ["/(en|es|fr|pt|ru)", "/(en|es|fr|pt|ru)/:path*"] };
