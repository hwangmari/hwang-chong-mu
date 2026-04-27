// GET /api/schedule/workspace/[id]
// 현재 세션의 워크스페이스 데이터를 가져온다. 세션 workspaceId와 경로 id가 일치해야 하며,
// 서비스·태스크까지 한 번에 묶어서 반환한다.

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

  const { data: workspace, error: wsErr } = await admin
    .from("schedule_workspaces")
    .select(
      "id, name, type, owner_user_id, invite_code, invite_code_expires_at, invite_code_single_use, created_at",
    )
    .eq("id", id)
    .maybeSingle();
  if (wsErr || !workspace) {
    return NextResponse.json(
      { error: "워크스페이스를 찾을 수 없습니다." },
      { status: 404 },
    );
  }

  const [{ data: services }, { data: members }] = await Promise.all([
    admin
      .from("schedule_boards")
      .select("*, tasks:schedule_tasks(*)")
      .eq("workspace_id", id)
      .order("created_at", { ascending: false }),
    admin
      .from("schedule_workspace_members")
      .select("user_id, role, joined_at")
      .eq("workspace_id", id),
  ]);

  return NextResponse.json({
    workspace,
    services: services ?? [],
    members: members ?? [],
  });
}
