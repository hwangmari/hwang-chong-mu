// PATCH  /api/schedule/task/[id] — 태스크 필드 업데이트
// DELETE /api/schedule/task/[id] — 태스크 삭제
// 상위 체인(phase → board → workspace) 확인 후 권한 판단.

import { NextResponse } from "next/server";
import { getScheduleAdminClient } from "@/lib/schedule-admin";
import {
  assertServiceMutation,
  requireScheduleSession,
} from "@/lib/schedule-route-guard";

async function loadTaskContext(taskId: string) {
  const admin = getScheduleAdminClient();
  const { data } = await admin
    .from("schedule_tasks")
    .select(
      "id, service_id, phase:schedule_services(id, board_id, board:schedule_boards(id, workspace_id, member_id))",
    )
    .eq("id", taskId)
    .maybeSingle();
  if (!data) return { admin, task: null } as const;
  const phase = Array.isArray(data.phase) ? data.phase[0] : data.phase;
  const board = phase
    ? Array.isArray(phase.board)
      ? phase.board[0]
      : phase.board
    : null;
  return {
    admin,
    task: data,
    board: board as
      | { id: string; workspace_id: string; member_id: string | null }
      | null,
  } as const;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const guard = await requireScheduleSession();
  if (!guard.ok) return guard.response;

  const ctx = await loadTaskContext(id);
  if (!ctx.task || !ctx.board) {
    return NextResponse.json(
      { error: "태스크를 찾을 수 없습니다." },
      { status: 404 },
    );
  }
  const check = assertServiceMutation(guard.session, {
    id: ctx.board.id,
    workspaceId: ctx.board.workspace_id,
    memberId: ctx.board.member_id,
  });
  if (check) return check;

  const body = await req.json().catch(() => null);
  const updates: Record<string, unknown> = {};
  if (typeof body?.title === "string") updates.title = body.title;
  if (typeof body?.memo === "string") updates.memo = body.memo;
  if (typeof body?.startDate === "string")
    updates.start_date = body.startDate;
  if (typeof body?.endDate === "string") updates.end_date = body.endDate;
  if (typeof body?.isCompleted === "boolean")
    updates.is_completed = body.isCompleted;
  if (typeof body?.is_completed === "boolean")
    updates.is_completed = body.is_completed;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ task: ctx.task });
  }

  const { data, error } = await ctx.admin
    .from("schedule_tasks")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) {
    console.error("[schedule/task/update]", error);
    return NextResponse.json(
      { error: "태스크 업데이트에 실패했습니다." },
      { status: 500 },
    );
  }

  return NextResponse.json({ task: data });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const guard = await requireScheduleSession();
  if (!guard.ok) return guard.response;

  const ctx = await loadTaskContext(id);
  if (!ctx.task || !ctx.board) {
    return NextResponse.json(
      { error: "태스크를 찾을 수 없습니다." },
      { status: 404 },
    );
  }
  const check = assertServiceMutation(guard.session, {
    id: ctx.board.id,
    workspaceId: ctx.board.workspace_id,
    memberId: ctx.board.member_id,
  });
  if (check) return check;

  const { error } = await ctx.admin
    .from("schedule_tasks")
    .delete()
    .eq("id", id);
  if (error) {
    console.error("[schedule/task/delete]", error);
    return NextResponse.json({ error: "삭제에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
