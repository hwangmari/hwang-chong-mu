// PATCH  /api/schedule/phase/[id] — 페이즈 필드 업데이트
// DELETE /api/schedule/phase/[id] — 페이즈 삭제
// schedule_services → schedule_boards 체인 권한 검증.

import { NextResponse } from "next/server";
import { getScheduleAdminClient } from "@/lib/schedule-admin";
import {
  assertServiceMutation,
  requireScheduleSession,
} from "@/lib/schedule-route-guard";

async function loadPhaseContext(phaseId: string) {
  const admin = getScheduleAdminClient();
  const { data } = await admin
    .from("schedule_services")
    .select(
      "id, board_id, board:schedule_boards(id, workspace_id, member_id)",
    )
    .eq("id", phaseId)
    .maybeSingle();
  if (!data) return { admin, phase: null } as const;
  const board = Array.isArray(data.board) ? data.board[0] : data.board;
  return {
    admin,
    phase: data,
    board: board as
      | { id: string; workspace_id: string; member_id: string | null }
      | undefined,
  } as const;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const guard = await requireScheduleSession();
  if (!guard.ok) return guard.response;

  const ctx = await loadPhaseContext(id);
  if (!ctx.phase || !ctx.board) {
    return NextResponse.json(
      { error: "단계를 찾을 수 없습니다." },
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
  if (typeof body?.phaseName === "string") updates.name = body.phaseName;
  if (typeof body?.color === "string") updates.color = body.color;
  if (typeof body?.isCompleted === "boolean")
    updates.is_completed = body.isCompleted;
  if (typeof body?.is_completed === "boolean")
    updates.is_completed = body.is_completed;
  if (typeof body?.isHidden === "boolean") updates.is_hidden = body.isHidden;
  if (typeof body?.is_hidden === "boolean") updates.is_hidden = body.is_hidden;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ phase: ctx.phase });
  }

  const { data, error } = await ctx.admin
    .from("schedule_services")
    .update(updates)
    .eq("id", id)
    .select(`*, tasks:schedule_tasks(*)`)
    .single();
  if (error) {
    console.error("[schedule/phase/update]", error);
    return NextResponse.json(
      { error: "단계 업데이트에 실패했습니다." },
      { status: 500 },
    );
  }

  return NextResponse.json({ phase: data });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const guard = await requireScheduleSession();
  if (!guard.ok) return guard.response;

  const ctx = await loadPhaseContext(id);
  if (!ctx.phase || !ctx.board) {
    return NextResponse.json(
      { error: "단계를 찾을 수 없습니다." },
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
    .from("schedule_services")
    .delete()
    .eq("id", id);
  if (error) {
    console.error("[schedule/phase/delete]", error);
    return NextResponse.json(
      { error: "단계 삭제에 실패했습니다." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
