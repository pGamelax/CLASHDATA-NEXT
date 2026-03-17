import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicRoutes = ["/", "/sign-in", "/sign-up"];

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.clashdata.pro";

function getAppUrl(request: NextRequest): string {
  if (process.env.APP_URL) return process.env.APP_URL;
  const host =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    "clashdata.pro";
  const proto = request.headers.get("x-forwarded-proto") || "https";
  return `${proto}://${host}`;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublicRoute = publicRoutes.includes(pathname);
  const isProtectedRoute = !isPublicRoute;

  // Fast path: no cookies at all → not authenticated
  const cookieHeader = request.headers.get("cookie") || "";
  if (isProtectedRoute && !cookieHeader) {
    const appUrl = getAppUrl(request);
    return NextResponse.redirect(
      new URL(`/sign-in?callbackUrl=${encodeURIComponent(pathname)}`, appUrl)
    );
  }

  let isAuthenticated = false;

  try {
    const response = await fetch(`${API_URL}/auth/get-session`, {
      method: "GET",
      headers: {
        Cookie: cookieHeader,
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const session = await response.json();
      isAuthenticated = !!(session?.user || session?.data?.user);
    }
  } catch {
    // Backend unreachable: allow through to avoid locking out users
    isAuthenticated = isPublicRoute ? false : true;
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
