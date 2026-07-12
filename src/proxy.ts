import { NextResponse, type NextRequest } from "next/server";
import { betterFetch } from "@better-fetch/fetch";
import { getSessionCookie } from "better-auth/cookies";

import { isAdmin } from "@/lib/roles";
import type { auth } from "@/lib/auth";

type Session = typeof auth.$Infer.Session;

// Single systemic gate for mandatory second-factor enrollment.
//
// better-auth's twoFactor plugin only interrupts login for accounts that have
// *already* enrolled a second factor — an admin/owner who has never set up 2FA
// receives a full, valid session on password sign-in (see the plugin's sign-in
// hook: it bails on `!user.twoFactorEnabled`). So first-time enrollment can only
// be forced *after* the session exists. Doing it here, in one place, means every
// page navigation for an un-enrolled admin/owner lands on /2fa/setup instead of
// scattering the check across individual route guards.
//
// This is a UX/navigation gate, not the authoritative boundary: Next.js proxy
// must not be the sole authz for Server Actions (a matcher change can silently
// drop coverage), so requireAdmin/requireOwner keep the same check server-side.
export async function proxy(request: NextRequest) {
  // Optimistic, DB-free check: no session cookie means there is nothing to
  // enforce — let the page-level guards handle the login redirect.
  if (!getSessionCookie(request)) {
    return NextResponse.next();
  }

  const { data: session } = await betterFetch<Session>(
    "/api/auth/get-session",
    {
      baseURL: request.nextUrl.origin,
      headers: { cookie: request.headers.get("cookie") ?? "" },
    },
  );

  if (session && isAdmin(session.user.role) && !session.user.twoFactorEnabled) {
    return NextResponse.redirect(new URL("/2fa/setup", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Every route except: API handlers, Next internals, static assets (any path
    // with a file extension), and the auth/onboarding/2fa flows themselves —
    // those must stay reachable so an un-enrolled admin can actually complete
    // setup, and excluding /2fa* prevents a redirect loop.
    "/((?!api|_next/static|_next/image|favicon.ico|login|onboard|forgot-password|reset-password|2fa|.*\\..*).*)",
  ],
};
