// DELETE /api/schedule/workspace/[id]/members/[userId]
// 소유자 전용: 멤버 제거. 소유자는 본인을 제거할 수 없다.
// 레거시 member_ids 배열에도 남아 있을 수 있으므로 같이 정리한다.

import { NextResponse } from "next/server";
import { getScheduleAdminClient } from "@/lib/schedule-admin";
import {
  assertOwner,
  assertWorkspaceMatch,
  requireScheduleSession,
} from "@/lib/schedule-route-guard";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; userId: string }> },
) {
  const { id, userId } = await params;
  const guard = await requireScheduleSession();
  if (!guard.ok) return guard.response;
  const { session } = guard;

  const mismatch = assertWorkspaceMatch(session, id);
  if (mismatch) return mismatch;
  const ownerCheck = assertOwner(session);
  if (ownerCheck) return ownerCheck;

  if (userId === session.userId) {
    return NextResponse.json(
      { error: "소유자 본인은 제거할 수 없습니다." },
      { status: 400 },
    );
  }

  const admin = getScheduleAdminClient();

  const { data: workspace } = await admin
    .from("schedule_workspaces")
    .select("id, owner_user_id, member_ids")
    .eq("id", id)
    .maybeSingle();
  if (!workspace) {
    return NextResponse.json(
      { error: "워크스페이스를 찾을 수 없습니다." },
      { status: 404 },
    );
  }
  if (workspace.owner_user_id === userId) {
    return NextResponse.json(
      { error: "소유자를 제거할 수 없습니다." },
      { status: 400 },
    );
  }

  const { error: deleteErr } = await admin
    .from("schedule_workspace_members")
    .delete()
    .eq("workspace_id", id)
    .eq("user_id", userId);
  if (deleteErr) {
    console.error("[schedule/member/remove]", deleteErr);
    return NextResponse.json(
      { error: "멤버 제거에 실패했습니다." },
      { status: 500 },
    );
  }

  // 레거시 member_ids 배열도 함께 정리
  const nextMemberIds = (workspace.member_ids ?? []).filter(
    (mid: string) => mid !== userId,
  );
  if (nextMemberIds.length !== (workspace.member_ids ?? []).length) {
    await admin
      .from("schedule_workspaces")
      .update({ member_ids: nextMemberIds })
      .eq("id", id);
  }

  return NextResponse.json({ ok: true });
}
