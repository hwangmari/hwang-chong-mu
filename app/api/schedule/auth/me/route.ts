// GET /api/schedule/auth/me
// 쿠키 기반 세션 복원. 워크스페이스·사용자 이름까지 내려줘서 클라이언트 헤더에서 바로 활용.

import { NextResponse } from "next/server";
import {
  fetchUser,
  fetchWorkspace,
} from "@/lib/schedule-auth-helpers";
import { readScheduleSession } from "@/lib/schedule-session";

export async function GET() {
  const session = await readScheduleSession();
  if (!session) {
    return NextResponse.json({ session: null });
  }

  const [user, workspace] = await Promise.all([
    fetchUser(session.userId),
    fetchWorkspace(session.workspaceId),
  ]);

  // 쿠키는 유효하지만 DB에서 사용자/워크스페이스가 사라진 경우
  if (!user || !workspace) {
    return NextResponse.json({ session: null });
  }

  return NextResponse.json({
    session: {
      workspaceId: session.workspaceId,
      userId: session.userId,
      role: session.role,
      userName: user.name,
      workspaceName: workspace.name,
      workspaceType: workspace.type,
      exp: session.exp,
    },
  });
}
