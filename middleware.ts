import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Pure pass-through middleware.
 *
 * Auth is enforced at two points that are both more reliable than the Edge:
 *   • Page routes  → app/(app)/layout.tsx calls auth() (Node.js runtime, same
 *                    NextAuth instance that signed the JWT)
 *   • API routes   → each route handler calls auth() before touching data
 *
 * A cookie-name–based check here was blocking /api/chats, /api/notifications
 * etc. with 401s because NextAuth v5's cookie name varies with NEXTAUTH_URL
 * and the Edge middleware was checking the wrong name.
 */
export function middleware(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
