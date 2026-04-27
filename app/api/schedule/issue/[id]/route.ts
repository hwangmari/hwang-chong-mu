// PATCH /api/schedule/issue/[id] — 이슈 업데이트
// DELETE /api/schedule/issue/[id] — 이슈 삭제
// board → workspace 체인을 확인해 세션과 일치해야 한다.

import { NextResponse } from "next/server";
import { getScheduleAdminClient } from "@/lib/schedule-admin";
import { requireScheduleSession } from "@/lib/schedule-route-guard";

async function loadIssueContext(issueId: string) {
  const admin = getScheduleAdminClient();
  const { data } = await admin
    .from("schedule_issues")
    .select("id, board_id, board:schedule_boards(workspace_id)")
    .eq("id", issueId)
    .maybeSingle();
  if (!data) return { admin, issue: null } as const;
  const board = Array.isArray(data.board) ? data.board[0] : data.board;
  return {
    admin,
    issue: data,
    workspaceId: (board as { workspace_id?: string } | null)?.workspace_id ?? null,
  } as const;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const guard = await requireScheduleSession();
  if (!guard.ok) return guard.response;

  const ctx = await loadIssueContext(id);
  if (!ctx.issue) {
    return NextResponse.json(
      { error: "이슈를 찾을 수 없습니다." },
      { status: 404 },
    );
  }
  if (ctx.workspaceId !== guard.session.workspaceId) {
    return NextResponse.json(
      { error: "다른 워크스페이스의 이슈입니다." },
      { status: 403 },
    );
  }

  const body = await req.json().catch(() => null);
  const updates: Record<string, unknown> = {};
  if (typeof body?.title === "string") updates.title = body.title;
  if (typeof body?.description === "string")
    updates.description = body.description;
  if (typeof body?.severity === "string") updates.severity = body.severity;
  if (typeof body?.status === "string") {
    updates.status = body.status;
    updates.resolved_at =
      body.status === "resolved" ? new Date().toISOString() : null;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ issue: ctx.issue });
  }

  const { data, error } = await ctx.admin
    .from("schedule_issues")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) {
    console.error("[schedule/issue/update]", error);
    return NextResponse.json(
      { error: "업데이트 실패" },
      { status: 500 },
    );
  }

  return NextResponse.json({ issue: data });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const guard = await requireScheduleSession();
  if (!guard.ok) return guard.response;

  const ctx = await loadIssueContext(id);
  if (!ctx.issue) {
    return NextResponse.json(
      { error: "이슈를 찾을 수 없습니다." },
      { status: 404 },
    );
  }
  if (ctx.workspaceId !== guard.session.workspaceId) {
    return NextResponse.json(
      { error: "다른 워크스페이스의 이슈입니다." },
      { status: 403 },
    );
  }

  const { error } = await ctx.admin
    .from("schedule_issues")
    .delete()
    .eq("id", id);
  if (error) {
    console.error("[schedule/issue/delete]", error);
    return NextResponse.json({ error: "삭제 실패" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
