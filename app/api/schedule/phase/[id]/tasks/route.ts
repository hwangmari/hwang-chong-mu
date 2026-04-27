// POST /api/schedule/phase/[id]/tasks
// 페이즈 내부에 태스크를 생성. schedule_services → schedule_boards 체인 검증.

import { NextResponse } from "next/server";
import { getScheduleAdminClient } from "@/lib/schedule-admin";
import {
  assertServiceMutation,
  requireScheduleSession,
} from "@/lib/schedule-route-guard";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const guard = await requireScheduleSession();
  if (!guard.ok) return guard.response;

  const admin = getScheduleAdminClient();
  const { data: phase } = await admin
    .from("schedule_services")
    .select(
      "id, board_id, board:schedule_boards(id, workspace_id, member_id)",
    )
    .eq("id", id)
    .maybeSingle();
  if (!phase) {
    return NextResponse.json(
      { error: "단계를 찾을 수 없습니다." },
      { status: 404 },
    );
  }
  const board = Array.isArray(phase.board) ? phase.board[0] : phase.board;
  if (!board) {
    return NextResponse.json(
      { error: "상위 서비스를 찾을 수 없습니다." },
      { status: 500 },
    );
  }
  const check = assertServiceMutation(guard.session, {
    id: board.id,
    workspaceId: board.workspace_id,
    memberId: board.member_id,
  });
  if (check) return check;

  const body = await req.json().catch(() => null);
  const title = typeof body?.title === "string" ? body.title : "";
  const startDate =
    typeof body?.startDate === "string" ? body.startDate : null;
  const endDate = typeof body?.endDate === "string" ? body.endDate : null;
  const memo = typeof body?.memo === "string" ? body.memo : "";
  if (!title || !startDate || !endDate) {
    return NextResponse.json(
      { error: "필수 값이 비어있습니다." },
      { status: 400 },
    );
  }

  const { data, error } = await admin
    .from("schedule_tasks")
    .insert({
      service_id: id,
      title,
      start_date: startDate,
      end_date: endDate,
      memo,
      is_completed: false,
    })
    .select()
    .single();
  if (error) {
    console.error("[schedule/task/create]", error);
    return NextResponse.json(
      { error: "태스크 생성에 실패했습니다." },
      { status: 500 },
    );
  }

  return NextResponse.json({ task: data });
}
