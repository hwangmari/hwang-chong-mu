// POST /api/schedule/auth/register
// { name, password } → 새 사용자 + 개인 워크스페이스 생성.
// 비밀번호는 scrypt 해시로만 저장하고 평문은 보관하지 않는다.

import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { getScheduleAdminClient } from "@/lib/schedule-admin";
import { fetchUserByName } from "@/lib/schedule-auth-helpers";
import { hashSchedulePassword } from "@/lib/schedule-password";

function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID().replace(/-/g, "").slice(0, 8)}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    if (!name || !password) {
      return NextResponse.json(
        { error: "이름과 비밀번호를 입력해 주세요." },
        { status: 400 },
      );
    }

    const existing = await fetchUserByName(name);
    if (existing) {
      return NextResponse.json(
        { error: "이미 사용 중인 이름입니다. 로그인해 주세요." },
        { status: 409 },
      );
    }

    const admin = getScheduleAdminClient();
    const userId = createId("su");
    const workspaceId = createId("sw");
    const hash = await hashSchedulePassword(password);

    // users ↔ workspaces 간 순환 FK 회피: user 먼저 생성(개인 워크스페이스는 null),
    // workspace 생성 후 user.personal_workspace_id를 업데이트한다.
    const { error: uErr } = await admin.from("schedule_users").insert({
      id: userId,
      name,
      password_hash: hash,
      personal_workspace_id: null,
    });
    if (uErr) throw uErr;

    const { error: wsErr } = await admin
      .from("schedule_workspaces")
      .insert({
        id: workspaceId,
        name: `${name}의 캘린더`,
        type: "personal",
        password_hash: hash,
        owner_user_id: userId,
        member_ids: [userId],
      });
    if (wsErr) throw wsErr;

    const { error: linkErr } = await admin
      .from("schedule_users")
      .update({ personal_workspace_id: workspaceId })
      .eq("id", userId);
    if (linkErr) throw linkErr;

    const { error: memberErr } = await admin
      .from("schedule_workspace_members")
      .insert({
        workspace_id: workspaceId,
        user_id: userId,
        role: "owner",
      });
    if (memberErr) throw memberErr;

    return NextResponse.json({
      user: {
        id: userId,
        name,
        personalWorkspaceId: workspaceId,
      },
    });
  } catch (err) {
    console.error("[schedule/auth/register]", err);
    const message =
      err instanceof Error && err.message
        ? `계정 생성에 실패했습니다: ${err.message}`
        : "계정 생성에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
