// 클라이언트에서 서버 라우트를 호출하는 얇은 래퍼.
// 쿠키 기반 세션을 사용하므로 모든 호출에 `credentials: "same-origin"`을 명시.

export type ScheduleRole = "owner" | "member";

export interface ScheduleAuthMeResponse {
  session: {
    workspaceId: string;
    userId: string;
    role: ScheduleRole;
    userName: string;
    workspaceName: string;
    workspaceType: "personal" | "shared";
    exp: number;
  } | null;
}

async function jsonRequest<T>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(url, {
    ...init,
    credentials: "same-origin",
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const payload = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(payload?.error ?? "요청이 실패했습니다.");
  }
  return payload as T;
}

export function loginScheduleUserApi(name: string, password: string) {
  return jsonRequest<{
    user: { id: string; name: string; personalWorkspaceId: string | null };
  }>("/api/schedule/auth/login", {
    method: "POST",
    body: JSON.stringify({ name, password }),
  });
}

// 워크스페이스에 들어가면 통합 계정의 "내 서비스"에 업무 캘린더를 자동 연결한다.
// 방(room)들이 linkRoomToAccount로 자동 등록되는 것과 같은 방식이고,
// 비밀번호는 보내지 않는다(비로그인이면 서버가 401 → 조용히 무시).
function linkScheduleToAccount(
  session: Exclude<ScheduleAuthMeResponse["session"], null>,
) {
  if (!session.workspaceId) return;
  void fetch("/api/auth/links", {
    method: "POST",
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      service: "schedule",
      resourceRef: {
        workspaceId: session.workspaceId,
        userId: session.userId,
      },
      label: session.workspaceName || "업무 캘린더",
    }),
  }).catch(() => {});
}

export async function enterWorkspaceApi(
  userId: string,
  workspaceId: string,
  password: string,
) {
  const result = await jsonRequest<{
    session: Exclude<ScheduleAuthMeResponse["session"], null>;
  }>("/api/schedule/auth/enter", {
    method: "POST",
    body: JSON.stringify({ userId, workspaceId, password }),
  });
  linkScheduleToAccount(result.session);
  return result;
}

export async function joinWorkspaceApi(userId: string, inviteCode: string) {
  const result = await jsonRequest<{
    session: Exclude<ScheduleAuthMeResponse["session"], null>;
  }>("/api/schedule/auth/join", {
    method: "POST",
    body: JSON.stringify({ userId, inviteCode }),
  });
  linkScheduleToAccount(result.session);
  return result;
}

export function leaveWorkspaceApi() {
  return jsonRequest<{ ok: true }>("/api/schedule/auth/leave", {
    method: "POST",
  });
}

export function fetchScheduleSessionApi() {
  return jsonRequest<ScheduleAuthMeResponse>("/api/schedule/auth/me");
}

export function fetchWorkspaceDataApi(workspaceId: string) {
  return jsonRequest<{
    workspace: {
      id: string;
      name: string;
      type: "personal" | "shared";
      owner_user_id: string | null;
      invite_code: string | null;
      invite_code_expires_at: string | null;
      invite_code_single_use: boolean | null;
      created_at: string;
    };
    services: unknown[];
    members: Array<{ user_id: string; role: ScheduleRole; joined_at: string }>;
  }>(`/api/schedule/workspace/${encodeURIComponent(workspaceId)}`);
}

export function removeWorkspaceMemberApi(
  workspaceId: string,
  userId: string,
) {
  return jsonRequest<{ ok: true }>(
    `/api/schedule/workspace/${encodeURIComponent(workspaceId)}/members/${encodeURIComponent(userId)}`,
    { method: "DELETE" },
  );
}
