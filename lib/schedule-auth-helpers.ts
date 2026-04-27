// 세션 발급 전 공통 검증 로직.
// - 평문 password 컬럼은 마이그레이션 과도기 중 허용: 최초 성공 인증 시 password_hash로 업그레이드한다.

import { getScheduleAdminClient } from "./schedule-admin";
import {
  hashSchedulePassword,
  verifySchedulePassword,
} from "./schedule-password";
import type { ScheduleRole } from "./schedule-session";

export interface ScheduleUserRow {
  id: string;
  name: string;
  password: string | null;
  password_hash: string | null;
  personal_workspace_id: string | null;
}

export interface ScheduleWorkspaceRow {
  id: string;
  name: string;
  type: "personal" | "shared";
  password: string | null;
  password_hash: string | null;
  owner_user_id: string | null;
  member_ids: string[] | null;
  invite_code: string | null;
  invite_code_expires_at: string | null;
  invite_code_single_use: boolean | null;
}

// ─────────────────────────────────────────────────
// 사용자 비밀번호 검증 + 레거시 해시 업그레이드
// ─────────────────────────────────────────────────
export async function verifyUserPassword(
  user: ScheduleUserRow,
  password: string,
): Promise<boolean> {
  if (user.password_hash) {
    return verifySchedulePassword(password, user.password_hash);
  }
  if (user.password && user.password === password) {
    const hash = await hashSchedulePassword(password);
    await getScheduleAdminClient()
      .from("schedule_users")
      .update({ password_hash: hash })
      .eq("id", user.id);
    return true;
  }
  return false;
}

// ─────────────────────────────────────────────────
// 워크스페이스 비밀번호 검증 + 업그레이드
// ─────────────────────────────────────────────────
export async function verifyWorkspacePassword(
  workspace: ScheduleWorkspaceRow,
  password: string,
): Promise<boolean> {
  if (workspace.password_hash) {
    return verifySchedulePassword(password, workspace.password_hash);
  }
  if (workspace.password && workspace.password === password) {
    const hash = await hashSchedulePassword(password);
    await getScheduleAdminClient()
      .from("schedule_workspaces")
      .update({ password_hash: hash })
      .eq("id", workspace.id);
    return true;
  }
  return false;
}

// ─────────────────────────────────────────────────
// 워크스페이스 멤버십 확인
// members 테이블 우선, 없으면 레거시 member_ids 배열 백필
// ─────────────────────────────────────────────────
export async function resolveRole(
  workspaceId: string,
  userId: string,
  workspace: ScheduleWorkspaceRow,
): Promise<ScheduleRole | null> {
  const admin = getScheduleAdminClient();
  const { data: memberRow } = await admin
    .from("schedule_workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .maybeSingle();
  if (memberRow?.role === "owner" || memberRow?.role === "member") {
    return memberRow.role;
  }

  const legacyMember = (workspace.member_ids ?? []).includes(userId);
  const isOwner = workspace.owner_user_id === userId;
  if (!legacyMember && !isOwner) return null;

  const role: ScheduleRole = isOwner ? "owner" : "member";
  await admin
    .from("schedule_workspace_members")
    .upsert(
      { workspace_id: workspaceId, user_id: userId, role },
      { onConflict: "workspace_id,user_id" },
    );
  return role;
}

// ─────────────────────────────────────────────────
// 멤버 추가 (초대코드 가입 시)
// ─────────────────────────────────────────────────
export async function addMember(
  workspaceId: string,
  userId: string,
  role: ScheduleRole,
  invitedBy?: string,
): Promise<void> {
  await getScheduleAdminClient()
    .from("schedule_workspace_members")
    .upsert(
      {
        workspace_id: workspaceId,
        user_id: userId,
        role,
        invited_by: invitedBy ?? null,
      },
      { onConflict: "workspace_id,user_id" },
    );
}

// ─────────────────────────────────────────────────
// 공용: 사용자/워크스페이스 조회 (404 구분용)
// ─────────────────────────────────────────────────
export async function fetchUser(
  userId: string,
): Promise<ScheduleUserRow | null> {
  const { data } = await getScheduleAdminClient()
    .from("schedule_users")
    .select(
      "id, name, password, password_hash, personal_workspace_id",
    )
    .eq("id", userId)
    .maybeSingle();
  return (data as ScheduleUserRow) ?? null;
}

export async function fetchUserByName(
  name: string,
): Promise<ScheduleUserRow | null> {
  const { data } = await getScheduleAdminClient()
    .from("schedule_users")
    .select(
      "id, name, password, password_hash, personal_workspace_id",
    )
    .eq("name", name)
    .maybeSingle();
  return (data as ScheduleUserRow) ?? null;
}

export async function fetchWorkspace(
  workspaceId: string,
): Promise<ScheduleWorkspaceRow | null> {
  const { data } = await getScheduleAdminClient()
    .from("schedule_workspaces")
    .select(
      "id, name, type, password, password_hash, owner_user_id, member_ids, invite_code, invite_code_expires_at, invite_code_single_use",
    )
    .eq("id", workspaceId)
    .maybeSingle();
  return (data as ScheduleWorkspaceRow) ?? null;
}

export async function fetchWorkspaceByInvite(
  inviteCode: string,
): Promise<ScheduleWorkspaceRow | null> {
  const { data } = await getScheduleAdminClient()
    .from("schedule_workspaces")
    .select(
      "id, name, type, password, password_hash, owner_user_id, member_ids, invite_code, invite_code_expires_at, invite_code_single_use",
    )
    .eq("invite_code", inviteCode)
    .maybeSingle();
  return (data as ScheduleWorkspaceRow) ?? null;
}
