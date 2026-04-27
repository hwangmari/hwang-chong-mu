// GET /api/schedule/store?userId=...
// Hub 진입 시 사용자가 접근 가능한 워크스페이스 목록만 반환.
// 전체 사용자·워크스페이스를 노출했던 기존 fetchScheduleStore를 대체한다.

import { NextResponse } from "next/server";
import { getScheduleAdminClient } from "@/lib/schedule-admin";
import { fetchUser } from "@/lib/schedule-auth-helpers";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) {
    return NextResponse.json(
      { error: "userId 쿼리 파라미터가 필요합니다." },
      { status: 400 },
    );
  }

  const user = await fetchUser(userId);
  if (!user) {
    return NextResponse.json(
      { error: "존재하지 않는 사용자입니다." },
      { status: 404 },
    );
  }

  const admin = getScheduleAdminClient();

  // 1) 새 멤버 테이블로 연결된 워크스페이스 id
  const { data: memberRows } = await admin
    .from("schedule_workspace_members")
    .select("workspace_id")
    .eq("user_id", userId);

  const memberIds = new Set(
    (memberRows ?? []).map((row: { workspace_id: string }) => row.workspace_id),
  );

  // 2) 레거시: member_ids 배열에 포함된 워크스페이스 + owner_user_id 본인
  const { data: legacyMaybe } = await admin
    .from("schedule_workspaces")
    .select(
      "id, name, type, owner_user_id, member_ids, invite_code, created_at",
    );
  const legacy = legacyMaybe ?? [];
  for (const row of legacy) {
    const mids: string[] = row.member_ids ?? [];
    if (row.owner_user_id === userId || mids.includes(userId)) {
      memberIds.add(row.id);
    }
  }

  const parts = legacy
    .filter((row) => memberIds.has(row.id))
    .map((row) => ({
      id: row.id,
      name: row.name,
      type: row.type,
      ownerUserId: row.owner_user_id ?? null,
      memberIds: row.member_ids ?? [],
      inviteCode: row.invite_code ?? null,
    }));

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      personalWorkspaceId: user.personal_workspace_id,
    },
    parts,
  });
}
