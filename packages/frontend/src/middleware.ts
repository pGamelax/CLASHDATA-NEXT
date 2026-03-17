import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicRoutes = ["/", "/sign-in", "/sign-up"];

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
    const url = request.nextUrl.clone();
    url.pathname = "/organizations";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (!isPublicRoute && !isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.search = `?callbackUrl=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
