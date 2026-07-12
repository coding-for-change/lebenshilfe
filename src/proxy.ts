import { NextRequest, NextResponse } from "next/server";

// Per-request nonce for a strict, script-nonce CSP. Next.js reads the nonce from
// the request's Content-Security-Policy header and stamps it onto its own
// bootstrap/inline scripts, so `'unsafe-inline'` is no longer needed for scripts.
// (Nonce CSP requires dynamic rendering — see `export const dynamic` in the root
// layout.) Styles keep `'unsafe-inline'`: the UI uses inline style attributes,
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
    // All routes except API, Next static/image assets, and favicon; skip
    // link-prefetch requests (they don't render HTML that needs the nonce).
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
