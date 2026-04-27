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

export function enterWorkspaceApi(
  userId: string,
  workspaceId: string,
  password: string,
) {
  return jsonRequest<{ session: Exclude<ScheduleAuthMeResponse["session"], null> }>(
    "/api/schedule/auth/enter",
    {
      method: "POST",
      body: JSON.stringify({ userId, workspaceId, password }),
    },
  );
}

export function joinWorkspaceApi(userId: string, inviteCode: string) {
  return jsonRequest<{ session: Exclude<ScheduleAuthMeResponse["session"], null> }>(
    "/api/schedule/auth/join",
    {
      method: "POST",
      body: JSON.stringify({ userId, inviteCode }),
    },
  );
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
