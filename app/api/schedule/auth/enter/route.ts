// POST /api/schedule/auth/enter
// { userId, workspaceId, password } → 워크스페이스 비밀번호 검증 + 멤버십 확인 후
// 서명된 세션 쿠키(hws-session) 발급.

import { NextResponse } from "next/server";
import {
  fetchUser,
  fetchWorkspace,
  resolveRole,
  verifyWorkspacePassword,
} from "@/lib/schedule-auth-helpers";
import {
  buildScheduleSessionCookieValue,
  signScheduleSession,
} from "@/lib/schedule-session";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const userId = typeof body?.userId === "string" ? body.userId : "";
    const workspaceId =
      typeof body?.workspaceId === "string" ? body.workspaceId : "";
    const password = typeof body?.password === "string" ? body.password : "";
    if (!userId || !workspaceId || !password) {
      return NextResponse.json(
        { error: "필수 값이 비어있습니다." },
        { status: 400 },
      );
    }

    const [user, workspace] = await Promise.all([
      fetchUser(userId),
      fetchWorkspace(workspaceId),
    ]);
    if (!user) {
      return NextResponse.json(
        { error: "존재하지 않는 사용자입니다." },
        { status: 404 },
      );
    }
    if (!workspace) {
      return NextResponse.json(
        { error: "존재하지 않는 워크스페이스입니다." },
        { status: 404 },
      );
    }

    const role = await resolveRole(workspace.id, user.id, workspace);
    if (!role) {
      return NextResponse.json(
        { error: "해당 워크스페이스의 멤버가 아닙니다." },
        { status: 403 },
      );
    }

    const ok = await verifyWorkspacePassword(workspace, password);
    if (!ok) {
      return NextResponse.json(
        { error: "워크스페이스 비밀번호가 일치하지 않습니다." },
        { status: 401 },
      );
    }

    const token = signScheduleSession({
      workspaceId: workspace.id,
      userId: user.id,
      role,
    });

    const res = NextResponse.json({
      session: {
        workspaceId: workspace.id,
        userId: user.id,
        role,
        workspaceName: workspace.name,
        workspaceType: workspace.type,
      },
    });
    res.cookies.set(buildScheduleSessionCookieValue(token));
    return res;
  } catch (err) {
    console.error("[schedule/auth/enter]", err);
    return NextResponse.json(
      { error: "입장에 실패했습니다." },
      { status: 500 },
    );
  }
}
