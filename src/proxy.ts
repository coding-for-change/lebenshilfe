import { NextResponse, type NextRequest } from "next/server";
import { betterFetch } from "@better-fetch/fetch";
import { getSessionCookie } from "better-auth/cookies";

import { isAdmin } from "@/lib/roles";
import type { auth } from "@/lib/auth";

type Session = typeof auth.$Infer.Session;

// Routes that must stay reachable without the mandatory-2FA redirect: the
// auth/onboarding flows themselves, plus /2fa* (excluding it prevents a redirect
// loop, since an un-enrolled admin is sent *to* /2fa/setup). The strict CSP
// below still applies to these pages — only the 2FA gate skips them.
const TWO_FACTOR_EXEMPT_PREFIXES = [
  "/login",
  "/onboard",
  "/forgot-password",
  "/reset-password",
  "/2fa",
];

// Two app-wide systemic gates run on every rendered page:
//
// 1. Mandatory second-factor enrollment. better-auth's twoFactor plugin only
//    interrupts login for accounts that have *already* enrolled a second factor
//    — an admin/owner who has never set up 2FA receives a full, valid session on
//    password sign-in (the plugin's sign-in hook bails on `!user.twoFactorEnabled`).
//    So first-time enrollment can only be forced *after* the session exists.
//    Doing it here, in one place, means every page navigation for an un-enrolled
//    admin/owner lands on /2fa/setup instead of scattering the check across route
//    guards. This is a UX/navigation gate, not the authoritative boundary: the
//    Next.js proxy must not be the sole authz for Server Actions (a matcher change
//    can silently drop coverage), so requireAdmin/requireOwner keep the same
//    check server-side.
//
// 2. A strict, script-nonce CSP. Next.js reads the nonce from the request's
//    Content-Security-Policy header and stamps it onto its own bootstrap/inline
//    scripts, so `'unsafe-inline'` is no longer needed for scripts. (Nonce CSP
//    requires dynamic rendering — see `export const dynamic` in the root layout.)
//    Styles keep `'unsafe-inline'`: the UI uses inline style attributes, which a
//    nonce cannot cover, and style injection is far lower-risk than scripts.
export async function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV === "development";

  const csp = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    // Only the per-request nonce runs; scripts loaded by trusted scripts are
    // allowed via 'strict-dynamic' (this is how Google Maps loads). 'unsafe-eval'
    // is dev-only (React uses eval for debugging; not needed in production).
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https://*.googleapis.com https://*.gstatic.com https://*.google.com https://*.googleusercontent.com",
    "font-src 'self' https://fonts.gstatic.com",
    "frame-src https://*.google.com",
    "connect-src 'self' https://*.googleapis.com https://*.gstatic.com https://*.google.com data: blob:",
    "worker-src 'self' blob:",
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");

  // Mandatory-2FA gate. The matcher is broad (so CSP covers every page), so the
  // auth/2fa route exemption lives here rather than in the matcher. The DB-free
  // cookie check keeps un-authenticated navigations off the session endpoint.
  const { pathname } = request.nextUrl;
  const isTwoFactorExempt = TWO_FACTOR_EXEMPT_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (!isTwoFactorExempt && getSessionCookie(request)) {
    const { data: session } = await betterFetch<Session>(
      "/api/auth/get-session",
      {
        baseURL: request.nextUrl.origin,
        headers: { cookie: request.headers.get("cookie") ?? "" },
      },
    );

    if (session && isAdmin(session.user.role) && !session.user.twoFactorEnabled) {
      const redirect = NextResponse.redirect(new URL("/2fa/setup", request.url));
      redirect.headers.set("Content-Security-Policy", csp);
      return redirect;
    }
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    // All routes except API, Next static/image assets, favicon, and any path with
    // a file extension (public assets like the logos / login.webp — no HTML to
    // stamp a nonce on, and no reason to hit the session endpoint for them). Skip
    // link-prefetch requests: they don't render HTML that needs the nonce, and a
    // prefetch must not trigger the 2FA navigation redirect. Auth/onboarding/2fa
    // routes stay *included* here so CSP covers them; the 2FA gate exempts them
    // in code (see TWO_FACTOR_EXEMPT_PREFIXES).
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
