// POST /api/schedule/auth/join
// { userId, inviteCode } → 초대코드 유효성 검증 + 멤버로 추가 + 세션 발급.
// 초대코드 만료/1회성 옵션도 여기서 체크한다.

import { NextResponse } from "next/server";
import {
  addMember,
  fetchUser,
  fetchWorkspaceByInvite,
} from "@/lib/schedule-auth-helpers";
import {
  buildScheduleSessionCookieValue,
  signScheduleSession,
} from "@/lib/schedule-session";
import { getScheduleAdminClient } from "@/lib/schedule-admin";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const userId = typeof body?.userId === "string" ? body.userId : "";
    const inviteCode =
      typeof body?.inviteCode === "string" ? body.inviteCode.trim() : "";
    if (!userId || !inviteCode) {
      return NextResponse.json(
        { error: "필수 값이 비어있습니다." },
        { status: 400 },
      );
    }

    const [user, workspace] = await Promise.all([
      fetchUser(userId),
      fetchWorkspaceByInvite(inviteCode),
    ]);
    if (!user) {
      return NextResponse.json(
        { error: "존재하지 않는 사용자입니다." },
        { status: 404 },
      );
    }
    if (!workspace) {
      return NextResponse.json(
        { error: "유효하지 않은 초대코드입니다." },
        { status: 404 },
      );
    }

    if (
      workspace.invite_code_expires_at &&
      new Date(workspace.invite_code_expires_at).getTime() < Date.now()
    ) {
      return NextResponse.json(
        { error: "초대코드가 만료되었습니다." },
        { status: 410 },
      );
    }

    await addMember(workspace.id, user.id, "member", workspace.owner_user_id ?? undefined);

    // 1회성 초대코드면 즉시 무효화
    if (workspace.invite_code_single_use) {
      await getScheduleAdminClient()
        .from("schedule_workspaces")
        .update({ invite_code: null })
        .eq("id", workspace.id);
    }

    const token = signScheduleSession({
      workspaceId: workspace.id,
      userId: user.id,
      role: "member",
    });

    const res = NextResponse.json({
      session: {
        workspaceId: workspace.id,
        userId: user.id,
        role: "member" as const,
        workspaceName: workspace.name,
        workspaceType: workspace.type,
      },
    });
    res.cookies.set(buildScheduleSessionCookieValue(token));
    return res;
  } catch (err) {
    console.error("[schedule/auth/join]", err);
    return NextResponse.json({ error: "참여에 실패했습니다." }, { status: 500 });
  }
}
