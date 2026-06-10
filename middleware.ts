import { NextRequest, NextResponse } from "next/server";

/**
 * Lightweight middleware – only guards API routes.
 *
 * Page-level auth is handled server-side in app/(app)/layout.tsx via
 * auth() from lib/auth.ts (same NextAuth instance that signed the JWT).
 * Using a separate Edge NextAuth instance here caused JWT key-derivation
 * mismatches that invalidated sessions on every hard reload.
 */
export function middleware(req: NextRequest) {
  const { nextUrl } = req;

  const isApiRoute = nextUrl.pathname.startsWith("/api");
  const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth");
  const isSignupApiRoute =
    nextUrl.pathname === "/api/users" && req.method === "POST";
  const isCronApiRoute = nextUrl.pathname.startsWith("/api/cron");

  // Protect API routes – but allow auth, signup, and cron endpoints
  if (isApiRoute) {
    if (isApiAuthRoute || isSignupApiRoute || isCronApiRoute) {
      return NextResponse.next();
    }

    // Check for session cookie (any of the NextAuth v5 cookie names)
    const sessionCookie =
      req.cookies.get("__Secure-authjs.session-token") ??
      req.cookies.get("authjs.session-token") ??
      req.cookies.get("next-auth.session-token") ??
      req.cookies.get("__Secure-next-auth.session-token");

    if (!sessionCookie) {
      return new NextResponse(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
