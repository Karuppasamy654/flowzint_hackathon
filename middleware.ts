import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { nextUrl } = req;

  const isApiRoute = nextUrl.pathname.startsWith("/api");
  const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth");
  const isSignupApiRoute =
    nextUrl.pathname === "/api/users" && req.method === "POST";
  const isCronApiRoute = nextUrl.pathname.startsWith("/api/cron");

  // Page-level routes
  const isPublicPageRoute =
    nextUrl.pathname === "/" ||
    nextUrl.pathname === "/login" ||
    nextUrl.pathname === "/welcome" ||
    nextUrl.pathname.startsWith("/signup");

  if (!isLoggedIn) {
    if (isApiRoute) {
      // Allow public API routes
      if (isApiAuthRoute || isSignupApiRoute || isCronApiRoute) {
        return;
      }
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Redirect unauthenticated users trying to access app screens
    if (!isPublicPageRoute) {
      return Response.redirect(new URL("/login", nextUrl));
    }
  }

  return;
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
