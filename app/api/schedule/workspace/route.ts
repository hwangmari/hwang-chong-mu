// POST /api/schedule/workspace
// { ownerUserId, name, password, type?: "shared" } → 공유 워크스페이스 생성.
// 생성 직후 소유자 세션 쿠키 발급은 별도 /enter 호출로 처리한다.

import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { getScheduleAdminClient } from "@/lib/schedule-admin";
import { fetchUser } from "@/lib/schedule-auth-helpers";
import { hashSchedulePassword } from "@/lib/schedule-password";

function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID().replace(/-/g, "").slice(0, 8)}`;
}

function generateInviteCode() {
  return crypto.randomBytes(8).toString("base64url").toUpperCase();
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const ownerUserId =
      typeof body?.ownerUserId === "string" ? body.ownerUserId : "";
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    const type: "shared" = "shared";
    if (!ownerUserId || !name || !password) {
      return NextResponse.json(
        { error: "필수 값이 비어있습니다." },
        { status: 400 },
      );
    }

    const owner = await fetchUser(ownerUserId);
    if (!owner) {
      return NextResponse.json(
        { error: "존재하지 않는 사용자입니다." },
        { status: 404 },
      );
    }

    const admin = getScheduleAdminClient();
    const workspaceId = createId("sw");
    const inviteCode = generateInviteCode();
    const hash = await hashSchedulePassword(password);

    const { data, error } = await admin
      .from("schedule_workspaces")
      .insert({
        id: workspaceId,
        name,
        type,
        password_hash: hash,
        owner_user_id: ownerUserId,
        member_ids: [ownerUserId],
        invite_code: inviteCode,
      })
      .select()
      .single();
    if (error) throw error;

    await admin.from("schedule_workspace_members").insert({
      workspace_id: workspaceId,
      user_id: ownerUserId,
      role: "owner",
    });

    return NextResponse.json({ workspace: data });
  } catch (err) {
    console.error("[schedule/workspace/create]", err);
    return NextResponse.json(
      { error: "워크스페이스 생성에 실패했습니다." },
      { status: 500 },
    );
  }
}
