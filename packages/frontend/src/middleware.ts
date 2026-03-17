import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicRoutes = ["/", "/sign-in", "/sign-up"];
const APP_URL = process.env.APP_URL || "https://clashdata.pro";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.clashdata.pro";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublicRoute = publicRoutes.includes(pathname);
  const isProtectedRoute = !isPublicRoute;

  let isAuthenticated = false;

  try {
    const response = await fetch(`${API_URL}/auth/get-session`, {
      method: "GET",
      headers: {
        Cookie: request.headers.get("cookie") || "",
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (response.ok) {
      const session = await response.json();
      isAuthenticated = !!(session?.user?.id || session?.data?.user?.id);
    }
  } catch {
    isAuthenticated = false;
  }

  if (isProtectedRoute && !isAuthenticated) {
    return NextResponse.redirect(
      `${APP_URL}/sign-in?callbackUrl=${encodeURIComponent(pathname)}`
    );
  }

  if ((pathname === "/sign-in" || pathname === "/sign-up") && isAuthenticated) {
    return NextResponse.redirect(`${APP_URL}/organizations`);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
