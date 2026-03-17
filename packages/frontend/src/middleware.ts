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

  const cookieHeader = request.headers.get("cookie") || "";

  // Fast path: no cookies → not authenticated
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
      cache: "no-store",
    });

    const text = await response.text();
    console.log(`[middleware] ${pathname} | status=${response.status} | body=${text.slice(0, 200)}`);

    if (response.ok && text) {
      try {
        const session = JSON.parse(text);
        isAuthenticated = !!(session?.user?.id || session?.data?.user?.id);
      } catch {
        isAuthenticated = false;
      }
    }
  } catch (err) {
    console.error(`[middleware] get-session fetch failed:`, err);
    // Backend unreachable: let through to avoid locking out users
    isAuthenticated = true;
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
