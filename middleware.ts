import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/schedule")) {
    const authToken = request.cookies.get("auth_token");

    if (!authToken) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/schedule/:path*"], // schedule 뒤에 오는 모든 하위 경로 포함
};
