import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/register"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths and static assets
  if (PUBLIC_PATHS.includes(pathname) || pathname === "/") {
    return NextResponse.next();
  }

  // Require auth cookie for all other paths
  if (!request.cookies.has("auth_token")) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/((?!_next/static|_next/image|favicon.ico).*)",
};