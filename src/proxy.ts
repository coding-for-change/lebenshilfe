import { NextResponse, type NextRequest } from "next/server";

// This middleware does ONE thing: set a strict, per-request script-nonce CSP.
//
// It deliberately does NOT enforce mandatory-2FA enrollment. An earlier version
// fetched `/api/auth/get-session` here to redirect un-enrolled admins/owners to
// /2fa/setup, but in production `request.nextUrl.origin` is the public URL, so
// that was a hairpin HTTPS call back out through Caddy and into the app on every
// page. An intermittent TLS failure on it (ERR_SSL_WRONG_VERSION_NUMBER) threw
// unhandled → site-wide 500s. Middleware runs in the Edge runtime and cannot
// call better-auth in-process, so the only option available *here* is that
// unreliable self-fetch.
//
// Mandatory-2FA enrollment is instead enforced entirely in-process, on paths a
// privileged user cannot avoid:
//   • the root page (src/app/page.tsx) redirects any admin/owner to /admin, and
//   • the admin layout + requireAdmin()/requireOwner() (src/lib/auth-guards.ts)
//     redirect to /2fa/setup whenever !twoFactorEnabled.
// Those use `auth.api.getSession` — a direct in-process DB read, no network — so
// they cannot blip the way the fetch did (the only failure mode is the DB being
// down, which fails closed). Do NOT re-introduce a session fetch in this file.
//
// Nonce CSP requires dynamic rendering (see `export const dynamic` in the root
// layout). Styles keep 'unsafe-inline': the UI uses inline style attributes,
// which a nonce cannot cover, and style injection is far lower-risk than scripts.
export function proxy(request: NextRequest) {
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
    // stamp a nonce on). Skip link-prefetch requests: they don't render HTML that
    // needs the nonce.
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
