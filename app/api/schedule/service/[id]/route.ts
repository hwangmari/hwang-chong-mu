// GET    /api/schedule/service/[id] — 서비스 + 페이즈 + 태스크 전체 로딩
// PATCH  /api/schedule/service/[id] — 서비스 필드 업데이트 (owner 또는 본인 소속)
// DELETE /api/schedule/service/[id] — 서비스 삭제

import { NextResponse } from "next/server";
import { getScheduleAdminClient } from "@/lib/schedule-admin";
import {
  assertServiceMutation,
  requireScheduleSession,
} from "@/lib/schedule-route-guard";

type Phase = {
  id: string;
  name: string;
  color: string;
  is_completed: boolean | null;
  is_hidden: boolean | null;
  member_id: string | null;
  member_name: string | null;
  member_color: string | null;
  board_id: string;
};

type Task = {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  memo: string | null;
  is_completed: boolean | null;
  service_id: string;
};

async function loadServiceContext(serviceId: string) {
  const admin = getScheduleAdminClient();
  const { data: service } = await admin
    .from("schedule_boards")
    .select("id, title, description, workspace_id, member_id, member_name, member_color, created_at")
    .eq("id", serviceId)
    .maybeSingle();
  return { admin, service };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const guard = await requireScheduleSession();
  if (!guard.ok) return guard.response;

  const { admin, service } = await loadServiceContext(id);
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

  const { data: phases } = await admin
    .from("schedule_services")
    .select("*")
    .eq("board_id", id)
    .order("created_at", { ascending: true });

  const phaseList = (phases ?? []) as Phase[];
  const phaseIds = phaseList.map((p) => p.id);

  let tasks: Task[] = [];
  if (phaseIds.length > 0) {
    const { data } = await admin
      .from("schedule_tasks")
      .select("*")
      .in("service_id", phaseIds)
      .order("start_date", { ascending: true });
    tasks = (data ?? []) as Task[];
  }

  return NextResponse.json({
    service,
    phases: phaseList.map((p) => ({
      id: p.id,
      phaseName: p.name,
      color: p.color,
      isCompleted: p.is_completed ?? false,
      isHidden: p.is_hidden ?? false,
      memberId: p.member_id ?? undefined,
      memberName: p.member_name ?? undefined,
      memberColor: p.member_color ?? undefined,
      tasks: tasks
        .filter((t) => t.service_id === p.id)
        .map((t) => ({
          id: t.id,
          title: t.title,
          startDate: t.start_date,
          endDate: t.end_date,
          memo: t.memo ?? "",
          isCompleted: t.is_completed ?? false,
        })),
    })),
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const guard = await requireScheduleSession();
  if (!guard.ok) return guard.response;

  const { admin, service } = await loadServiceContext(id);
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
  const updates: Record<string, unknown> = {};
  if (typeof body?.title === "string") updates.title = body.title;
  if (typeof body?.description === "string")
    updates.description = body.description;
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ service });
  }

  const { data, error } = await admin
    .from("schedule_boards")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) {
    console.error("[schedule/service/update]", error);
    return NextResponse.json(
      { error: "업데이트에 실패했습니다." },
      { status: 500 },
    );
  }

  return NextResponse.json({ service: data });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const guard = await requireScheduleSession();
  if (!guard.ok) return guard.response;

  const { admin, service } = await loadServiceContext(id);
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

  const { error } = await admin.from("schedule_boards").delete().eq("id", id);
  if (error) {
    console.error("[schedule/service/delete]", error);
    return NextResponse.json({ error: "삭제에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
