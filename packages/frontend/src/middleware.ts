import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicRoutes = ["/", "/sign-in", "/sign-up"];
const APP_URL = process.env.APP_URL || "https://clashdata.pro";

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
  const isAuthenticated = hasSessionCookie(request);

  if ((pathname === "/sign-in" || pathname === "/sign-up") && isAuthenticated) {
    return NextResponse.redirect(`${APP_URL}/organizations`);
  }

  if (!isPublicRoute && !isAuthenticated) {
    return NextResponse.redirect(
      `${APP_URL}/sign-in?callbackUrl=${encodeURIComponent(pathname)}`
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
