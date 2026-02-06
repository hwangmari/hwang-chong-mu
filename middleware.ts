/** middleware.ts */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/schedule")) {
    const authToken = request.cookies.get("auth_token");

    /** 3. 입장권이 없다면 -> 로그인 페이지로 강제 이동 */
    if (!authToken) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  /** 4. 문제 없으면 통과 */
  return NextResponse.next();
}

/** 미들웨어가 적용될 경로 설정 */
export const config = {
  matcher: ["/schedule/:path*"], // schedule 뒤에 오는 모든 하위 경로 포함
};
