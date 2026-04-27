// GET /api/schedule/workspace/[id]/members
// 세션 일치 시 해당 워크스페이스 멤버(유저 정보 포함) 반환.

import { NextResponse } from "next/server";
import { getScheduleAdminClient } from "@/lib/schedule-admin";
import {
  assertWorkspaceMatch,
  requireScheduleSession,
} from "@/lib/schedule-route-guard";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const guard = await requireScheduleSession();
  if (!guard.ok) return guard.response;
  const mismatch = assertWorkspaceMatch(guard.session, id);
  if (mismatch) return mismatch;

  const admin = getScheduleAdminClient();

  // 신규 멤버 테이블 우선, 없으면 레거시 member_ids 배열로 폴백
  const { data: memberRows } = await admin
    .from("schedule_workspace_members")
    .select("user_id, role, joined_at")
    .eq("workspace_id", id);

  let memberIds = (memberRows ?? []).map(
    (row: { user_id: string }) => row.user_id,
  );
  if (memberIds.length === 0) {
    const { data: ws } = await admin
      .from("schedule_workspaces")
      .select("member_ids")
      .eq("id", id)
      .maybeSingle();
    memberIds = (ws?.member_ids ?? []) as string[];
  }

  if (memberIds.length === 0) {
    return NextResponse.json({ members: [] });
  }

  const { data: users } = await admin
    .from("schedule_users")
    .select("id, name, personal_workspace_id")
    .in("id", memberIds);

  const rolesById = new Map<string, string>();
  (memberRows ?? []).forEach((r: { user_id: string; role: string }) =>
    rolesById.set(r.user_id, r.role),
  );

  return NextResponse.json({
    members: (users ?? []).map((u) => ({
      id: u.id,
      name: u.name,
      personalPartId: u.personal_workspace_id,
      role: rolesById.get(u.id) ?? "member",
    })),
  });
}
