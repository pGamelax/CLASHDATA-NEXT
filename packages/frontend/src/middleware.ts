import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicRoutes = ["/", "/sign-in", "/sign-up"];

// Use internal Docker URL for server-to-server calls (avoids going through Traefik)
// Set INTERNAL_API_URL in Dokploy env to the internal container URL, e.g.:
// http://clashdata-backend-xxxxx:3003
// If not set, falls back to cookie-only check.
const INTERNAL_API_URL = process.env.INTERNAL_API_URL;

function getAppUrl(request: NextRequest): string {
  if (process.env.APP_URL) return process.env.APP_URL;
  const host =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    "clashdata.pro";
  const proto = request.headers.get("x-forwarded-proto") || "https";
  return `${proto}://${host}`;
}

function hasSessionCookie(request: NextRequest): boolean {
  const cookies = request.headers.get("cookie") || "";
  return (
    cookies.includes("better-auth.session_token") ||
    cookies.includes("__Secure-better-auth.session_token")
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublicRoute = publicRoutes.includes(pathname);
  const isProtectedRoute = !isPublicRoute;

  const cookieHeader = request.headers.get("cookie") || "";

  let isAuthenticated = false;

  if (INTERNAL_API_URL) {
    // Full session validation via internal Docker network
    try {
      const response = await fetch(`${INTERNAL_API_URL}/auth/get-session`, {
        method: "GET",
        headers: {
          Cookie: cookieHeader,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      if (response.ok) {
        const session = await response.json();
        isAuthenticated = !!(session?.user?.id || session?.data?.user?.id);
      } else {
        // Backend error: fall back to cookie check
        isAuthenticated = hasSessionCookie(request);
      }
    } catch {
      // Network error: fall back to cookie check
      isAuthenticated = hasSessionCookie(request);
    }
  } else {
    // No internal URL configured: trust cookie presence
    isAuthenticated = hasSessionCookie(request);
  }

  const appUrl = getAppUrl(request);

  if (isProtectedRoute && !isAuthenticated) {
    return NextResponse.redirect(
      new URL(`/sign-in?callbackUrl=${encodeURIComponent(pathname)}`, appUrl)
    );
  }

  if ((pathname === "/sign-in" || pathname === "/sign-up") && isAuthenticated) {
    return NextResponse.redirect(new URL("/", appUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
