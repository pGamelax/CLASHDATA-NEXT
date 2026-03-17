import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicRoutes = ["/", "/sign-in", "/sign-up"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublicRoute = publicRoutes.includes(pathname);
  const isProtectedRoute = !isPublicRoute;

  let isAuthenticatedUser = false;

  if (isProtectedRoute || pathname === "/sign-in" || pathname === "/sign-up") {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      const sessionUrl = `${apiUrl}/auth/get-session`;
      
      const response = await fetch(sessionUrl, {
        method: "GET",
        headers: {
          Cookie: request.headers.get("cookie") || "",
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (response.ok) {
        const session = await response.json();
        if (session && (session.user || session.data?.user)) {
          isAuthenticatedUser = true;
        }
      }
    } catch (error) {
      isAuthenticatedUser = false;
    }
  }

  if (isProtectedRoute && !isAuthenticatedUser) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  if ((pathname === "/sign-in" || pathname === "/sign-up") && isAuthenticatedUser) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [

    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
