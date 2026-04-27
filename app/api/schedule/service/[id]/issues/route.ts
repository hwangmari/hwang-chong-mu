// GET  /api/schedule/service/[id]/issues — 서비스 내 이슈 목록
// POST /api/schedule/service/[id]/issues — 이슈 생성

import { NextResponse } from "next/server";
import { getScheduleAdminClient } from "@/lib/schedule-admin";
import { requireScheduleSession } from "@/lib/schedule-route-guard";

async function loadServiceWorkspace(serviceId: string) {
  const { data } = await getScheduleAdminClient()
    .from("schedule_boards")
    .select("id, workspace_id")
    .eq("id", serviceId)
    .maybeSingle();
  return data as { id: string; workspace_id: string } | null;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const guard = await requireScheduleSession();
  if (!guard.ok) return guard.response;

  const service = await loadServiceWorkspace(id);
  if (!service) {
    return NextResponse.json(
      { error: "서비스를 찾을 수 없습니다." },
      { status: 404 },
    );
  }
  if (service.workspace_id !== guard.session.workspaceId) {
    return NextResponse.json(
      { error: "다른 워크스페이스의 서비스입니다." },
      { status: 403 },
    );
  }

  const { data, error } = await getScheduleAdminClient()
    .from("schedule_issues")
    .select("*")
    .eq("board_id", id)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[schedule/issues/list]", error);
    return NextResponse.json({ error: "조회 실패" }, { status: 500 });
  }

  return NextResponse.json({ issues: data ?? [] });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const guard = await requireScheduleSession();
  if (!guard.ok) return guard.response;

  const service = await loadServiceWorkspace(id);
  if (!service) {
    return NextResponse.json(
      { error: "서비스를 찾을 수 없습니다." },
      { status: 404 },
    );
  }
  if (service.workspace_id !== guard.session.workspaceId) {
    return NextResponse.json(
      { error: "다른 워크스페이스의 서비스입니다." },
      { status: 403 },
    );
  }

  const body = await req.json().catch(() => null);
  const title = typeof body?.title === "string" ? body.title : "";
  if (!title) {
    return NextResponse.json(
      { error: "이슈 제목이 필요합니다." },
      { status: 400 },
    );
  }
  const description =
    typeof body?.description === "string" ? body.description : "";
  const severity =
    typeof body?.severity === "string" ? body.severity : "normal";

  const { data, error } = await getScheduleAdminClient()
    .from("schedule_issues")
    .insert({ board_id: id, title, description, severity, status: "open" })
    .select()
    .single();
  if (error) {
    console.error("[schedule/issues/create]", error);
    return NextResponse.json({ error: "생성 실패" }, { status: 500 });
  }

  return NextResponse.json({ issue: data });
}
