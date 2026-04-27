// POST /api/schedule/service/[id]/phases
// 서비스 내부에 페이즈(schedule_services row)를 생성. member_* 컬럼 선택적 지정.

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
  const { data: service } = await admin
    .from("schedule_boards")
    .select("id, workspace_id, member_id")
    .eq("id", id)
    .maybeSingle();
  if (!service) {
    return NextResponse.json(
      { error: "서비스를 찾을 수 없습니다." },
      { status: 404 },
    );
  }
  const check = assertServiceMutation(guard.session, {
    id: service.id,
    workspaceId: service.workspace_id,
    memberId: service.member_id,
  });
  if (check) return check;

  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name : "새 단계";
  const description =
    typeof body?.description === "string" ? body.description : "";
  const color = typeof body?.color === "string" ? body.color : "#3b82f6";
  const memberId =
    typeof body?.memberId === "string" ? body.memberId : null;
  const memberName =
    typeof body?.memberName === "string" ? body.memberName : null;
  const memberColor =
    typeof body?.memberColor === "string" ? body.memberColor : null;

  const { data, error } = await admin
    .from("schedule_services")
    .insert({
      board_id: id,
      name,
      description,
      color,
      member_id: memberId,
      member_name: memberName,
      member_color: memberColor,
    })
    .select()
    .single();
  if (error) {
    console.error("[schedule/phase/create]", error);
    return NextResponse.json(
      { error: "단계 생성에 실패했습니다." },
      { status: 500 },
    );
  }

  return NextResponse.json({ phase: data });
}
