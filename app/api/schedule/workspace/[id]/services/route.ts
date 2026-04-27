// GET  /api/schedule/workspace/[id]/services — 워크스페이스에 속한 서비스(board) 목록
// POST /api/schedule/workspace/[id]/services — 서비스 생성 (세션 멤버만)

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

  const { data, error } = await getScheduleAdminClient()
    .from("schedule_boards")
    .select("*")
    .eq("workspace_id", id)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[schedule/services/list]", error);
    return NextResponse.json({ error: "목록 조회에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json({
    services: (data ?? []).map((b) => ({
      id: b.id,
      title: b.title,
      description: b.description,
      partId: b.workspace_id,
      createdAt: b.created_at,
    })),
  });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const guard = await requireScheduleSession();
  if (!guard.ok) return guard.response;
  const mismatch = assertWorkspaceMatch(guard.session, id);
  if (mismatch) return mismatch;

  const body = await req.json().catch(() => null);
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const description =
    typeof body?.description === "string" ? body.description : "";
  if (!title) {
    return NextResponse.json(
      { error: "서비스 이름이 필요합니다." },
      { status: 400 },
    );
  }

  const { data, error } = await getScheduleAdminClient()
    .from("schedule_boards")
    .insert({ title, description, workspace_id: id })
    .select()
    .single();
  if (error) {
    console.error("[schedule/services/create]", error);
    return NextResponse.json(
      { error: "서비스 생성에 실패했습니다." },
      { status: 500 },
    );
  }

  return NextResponse.json({ service: data });
}
