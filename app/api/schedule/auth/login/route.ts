// POST /api/schedule/auth/login
// { name, password } → 사용자 식별. 워크스페이스 세션은 발급하지 않는다.
// 클라이언트는 결과의 userId를 기억했다가 /enter 또는 /join 호출에 넘겨 사용.

import { NextResponse } from "next/server";
import {
  fetchUserByName,
  verifyUserPassword,
} from "@/lib/schedule-auth-helpers";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    if (!name || !password) {
      return NextResponse.json(
        { error: "이름과 비밀번호를 입력해 주세요." },
        { status: 400 },
      );
    }

    const user = await fetchUserByName(name);
    if (!user) {
      return NextResponse.json(
        { error: "존재하지 않는 이름입니다." },
        { status: 401 },
      );
    }

    const ok = await verifyUserPassword(user, password);
    if (!ok) {
      return NextResponse.json(
        { error: "비밀번호가 일치하지 않습니다." },
        { status: 401 },
      );
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        personalWorkspaceId: user.personal_workspace_id,
      },
    });
  } catch (err) {
    console.error("[schedule/auth/login]", err);
    return NextResponse.json({ error: "로그인에 실패했습니다." }, { status: 500 });
  }
}
