import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicRoutes = ["/sign-in", "/sign-up"];

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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublicRoute = publicRoutes.includes(pathname);
  const isProtectedRoute = !isPublicRoute && pathname !== "/";

  const isAuthenticated = hasSessionCookie(request);
  const appUrl = getAppUrl(request);

  // Redirect authenticated users away from landing and auth pages
  if ((pathname === "/" || pathname === "/sign-in" || pathname === "/sign-up") && isAuthenticated) {
    return NextResponse.redirect(new URL("/organizations", appUrl));
  }

  if (isProtectedRoute && !isAuthenticated) {
    return NextResponse.redirect(
      new URL(`/sign-in?callbackUrl=${encodeURIComponent(pathname)}`, appUrl)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
