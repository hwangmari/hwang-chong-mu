// 업무 캘린더 클라이언트 서비스 레이어.
// 모든 접근은 /api/schedule/* 서버 라우트를 경유한다.
// 응답 매퍼는 그대로 유지해 기존 타입을 깨지 않는다.

import {
  SchedulePhase,
  TaskPhase,
  ScheduleUser,
  SchedulePart,
  ScheduleServiceData,
  ScheduleStore,
  MemberWorkload,
  ScheduleIssue,
  IssueSeverity,
  IssueStatus,
} from "@/types/work-schedule";

// ─────────────────────────────────────────────────
// fetch 래퍼
// ─────────────────────────────────────────────────
async function api<T>(url: string, init?: RequestInit): Promise<T> {
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

// ─────────────────────────────────────────────────
// 매퍼 (서버 페이로드 → 앱 도메인)
// ─────────────────────────────────────────────────
const mapTaskFromDB = (task: any): TaskPhase => ({
  id: task.id,
  title: task.title,
  startDate: new Date(task.startDate ?? task.start_date),
  endDate: new Date(task.endDate ?? task.end_date),
  memo: task.memo || "",
  isCompleted: task.isCompleted ?? task.is_completed ?? false,
});

const mapPhaseFromDB = (svc: any, tasks: any[] = []): SchedulePhase => ({
  id: svc.id,
  phaseName: svc.phaseName ?? svc.name,
  color: svc.color,
  isCompleted: svc.isCompleted ?? svc.is_completed ?? false,
  isHidden: svc.isHidden ?? svc.is_hidden ?? false,
  tasks: (svc.tasks ?? tasks).map(mapTaskFromDB),
  memberId: svc.memberId ?? svc.member_id ?? undefined,
  memberName: svc.memberName ?? svc.member_name ?? undefined,
  memberColor: svc.memberColor ?? svc.member_color ?? undefined,
});

const mapUserFromPayload = (row: any): ScheduleUser => ({
  id: row.id,
  name: row.name,
  password: "",
  personalPartId: row.personalPartId ?? row.personal_workspace_id ?? "",
});

const mapPartFromPayload = (row: any): SchedulePart => ({
  id: row.id,
  name: row.name,
  type: row.type,
  password: "",
  ownerUserId: row.ownerUserId ?? row.owner_user_id ?? undefined,
  memberIds: row.memberIds ?? row.member_ids ?? [],
  inviteCode: row.inviteCode ?? row.invite_code ?? undefined,
});

const ACTIVE_USER_KEY = "hwang-schedule-active-user";
function readClientUserId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACTIVE_USER_KEY);
}

// ─────────────────────────────────────────────────
// 계정/워크스페이스 입장
// ─────────────────────────────────────────────────
export const fetchScheduleStore = async (
  userId?: string | null,
): Promise<ScheduleStore> => {
  const effectiveUserId = userId ?? readClientUserId();
  if (!effectiveUserId) return { users: [], parts: [] };
  const data = await api<{
    user: { id: string; name: string; personalWorkspaceId: string | null };
    parts: Array<{
      id: string;
      name: string;
      type: "personal" | "shared";
      ownerUserId: string | null;
      memberIds: string[];
      inviteCode: string | null;
    }>;
  }>(`/api/schedule/store?userId=${encodeURIComponent(effectiveUserId)}`);

  return {
    users: [
      {
        id: data.user.id,
        name: data.user.name,
        password: "",
        personalPartId: data.user.personalWorkspaceId ?? "",
      },
    ],
    parts: data.parts.map(mapPartFromPayload),
  };
};

export const createScheduleUser = async (
  name: string,
  password: string,
): Promise<{ user: ScheduleUser; part: SchedulePart }> => {
  const { user } = await api<{
    user: { id: string; name: string; personalWorkspaceId: string | null };
  }>("/api/schedule/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, password }),
  });

  return {
    user: {
      id: user.id,
      name: user.name,
      password: "",
      personalPartId: user.personalWorkspaceId ?? "",
    },
    // 생성된 개인 워크스페이스의 세부 정보는 hub reload 시 채워진다.
    part: {
      id: user.personalWorkspaceId ?? "",
      name: `${name}의 캘린더`,
      type: "personal",
      password: "",
      ownerUserId: user.id,
      memberIds: [user.id],
    },
  };
};

export const loginScheduleUser = async (
  name: string,
  password: string,
): Promise<ScheduleUser> => {
  const { user } = await api<{
    user: { id: string; name: string; personalWorkspaceId: string | null };
  }>("/api/schedule/auth/login", {
    method: "POST",
    body: JSON.stringify({ name, password }),
  });
  return {
    id: user.id,
    name: user.name,
    password: "",
    personalPartId: user.personalWorkspaceId ?? "",
  };
};

export const createSharedPart = async (
  partName: string,
  partPassword: string,
  ownerName: string,
  ownerPassword: string,
): Promise<{ user: ScheduleUser; part: SchedulePart }> => {
  // 1) 소유자 사용자 등록 (이미 존재하면 register가 409 리턴 → 로그인 플로우 유도)
  const registered = await api<{
    user: { id: string; name: string; personalWorkspaceId: string | null };
  }>("/api/schedule/auth/register", {
    method: "POST",
    body: JSON.stringify({ name: ownerName, password: ownerPassword }),
  });

  // 2) 공유 워크스페이스 생성
  const { workspace } = await api<{ workspace: any }>(
    "/api/schedule/workspace",
    {
      method: "POST",
      body: JSON.stringify({
        ownerUserId: registered.user.id,
        name: partName,
        password: partPassword,
      }),
    },
  );

  return {
    user: mapUserFromPayload(registered.user),
    part: mapPartFromPayload(workspace),
  };
};

export const joinSharedPart = async (
  inviteCode: string,
  userName: string,
  userPassword: string,
): Promise<{ user: ScheduleUser; part: SchedulePart }> => {
  // 새 계정 등록 후 auth/join 으로 세션 발급 + 멤버 추가
  const registered = await api<{
    user: { id: string; name: string; personalWorkspaceId: string | null };
  }>("/api/schedule/auth/register", {
    method: "POST",
    body: JSON.stringify({ name: userName, password: userPassword }),
  });

  const { session } = await api<{
    session: {
      workspaceId: string;
      workspaceName: string;
      workspaceType: "personal" | "shared";
    };
  }>("/api/schedule/auth/join", {
    method: "POST",
    body: JSON.stringify({
      userId: registered.user.id,
      inviteCode,
    }),
  });

  return {
    user: mapUserFromPayload(registered.user),
    part: {
      id: session.workspaceId,
      name: session.workspaceName,
      type: session.workspaceType,
      password: "",
      ownerUserId: undefined,
      memberIds: [registered.user.id],
      inviteCode,
    },
  };
};

// ─────────────────────────────────────────────────
// 서비스(보드) CRUD
// ─────────────────────────────────────────────────
export const fetchPartServices = async (
  partId: string,
): Promise<ScheduleServiceData[]> => {
  const { services } = await api<{
    services: ScheduleServiceData[];
  }>(`/api/schedule/workspace/${encodeURIComponent(partId)}/services`);
  return services;
};

export const createServiceInPart = async (
  partId: string,
  title: string,
  description: string,
): Promise<ScheduleServiceData> => {
  const { service } = await api<{ service: any }>(
    `/api/schedule/workspace/${encodeURIComponent(partId)}/services`,
    {
      method: "POST",
      body: JSON.stringify({ title, description }),
    },
  );
  return {
    id: service.id,
    title: service.title,
    description: service.description,
    partId: service.workspace_id,
    createdAt: service.created_at,
  };
};

export const updateService = async (serviceId: string, updates: any) => {
  const { service } = await api<{ service: any }>(
    `/api/schedule/service/${encodeURIComponent(serviceId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(updates),
    },
  );
  return service;
};

export const deleteService = async (serviceId: string) => {
  await api(`/api/schedule/service/${encodeURIComponent(serviceId)}`, {
    method: "DELETE",
  });
};

export const fetchServiceWithData = async (serviceId: string) => {
  const data = await api<{
    service: any;
    phases: any[];
  }>(`/api/schedule/service/${encodeURIComponent(serviceId)}`);
  return {
    service: data.service,
    phases: data.phases.map((p) => mapPhaseFromDB(p)),
  };
};

// 기존 getServiceData는 fetchServiceWithData와 동일하게 동작하도록 래핑
export const getServiceData = fetchServiceWithData;

// ─────────────────────────────────────────────────
// 페이즈 CRUD
// ─────────────────────────────────────────────────
export const createPhase = async (
  serviceId: string,
  name: string,
  description: string,
  color: string,
) => {
  const { phase } = await api<{ phase: any }>(
    `/api/schedule/service/${encodeURIComponent(serviceId)}/phases`,
    {
      method: "POST",
      body: JSON.stringify({ name, description, color }),
    },
  );
  return mapPhaseFromDB(phase);
};

export const createPhaseWithMember = async (
  serviceId: string,
  name: string,
  description: string,
  color: string,
  memberId: string,
  memberName: string,
  memberColor: string,
) => {
  const { phase } = await api<{ phase: any }>(
    `/api/schedule/service/${encodeURIComponent(serviceId)}/phases`,
    {
      method: "POST",
      body: JSON.stringify({
        name,
        description,
        color,
        memberId,
        memberName,
        memberColor,
      }),
    },
  );
  return mapPhaseFromDB(phase);
};

export const updatePhase = async (id: string, updates: any) => {
  const patch: Record<string, unknown> = {};
  if (updates.phaseName !== undefined) patch.phaseName = updates.phaseName;
  if (updates.color !== undefined) patch.color = updates.color;
  const completedVal = updates.isCompleted ?? updates.is_completed;
  if (completedVal !== undefined) patch.isCompleted = completedVal;
  const hiddenVal = updates.isHidden ?? updates.is_hidden;
  if (hiddenVal !== undefined) patch.isHidden = hiddenVal;
  if (Object.keys(patch).length === 0) return;

  const { phase } = await api<{ phase: any }>(
    `/api/schedule/phase/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      body: JSON.stringify(patch),
    },
  );
  return mapPhaseFromDB(phase, phase.tasks ?? []);
};

export const deletePhase = async (id: string) => {
  await api(`/api/schedule/phase/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
};

// ─────────────────────────────────────────────────
// 태스크 CRUD
// ─────────────────────────────────────────────────
export const createTask = async (phaseId: string, task: any) => {
  const startDate = task.startDate?.toISOString?.() ?? task.startDate;
  const endDate = task.endDate?.toISOString?.() ?? task.endDate;
  const { task: data } = await api<{ task: any }>(
    `/api/schedule/phase/${encodeURIComponent(phaseId)}/tasks`,
    {
      method: "POST",
      body: JSON.stringify({
        title: task.title,
        startDate,
        endDate,
        memo: task.memo ?? "",
      }),
    },
  );
  return mapTaskFromDB(data);
};

export const updateTask = async (taskId: string, updates: any) => {
  const patch: Record<string, unknown> = {};
  if (updates.title !== undefined) patch.title = updates.title;
  if (updates.memo !== undefined) patch.memo = updates.memo;
  if (updates.startDate !== undefined) {
    const iso = new Date(updates.startDate);
    if (!isNaN(iso.getTime())) patch.startDate = iso.toISOString();
  }
  if (updates.endDate !== undefined) {
    const iso = new Date(updates.endDate);
    if (!isNaN(iso.getTime())) patch.endDate = iso.toISOString();
  }
  const completedVal = updates.isCompleted ?? updates.is_completed;
  if (completedVal !== undefined) patch.isCompleted = completedVal;
  if (Object.keys(patch).length === 0) return;

  const { task } = await api<{ task: any }>(
    `/api/schedule/task/${encodeURIComponent(taskId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(patch),
    },
  );
  return mapTaskFromDB(task);
};

export const deleteTask = async (taskId: string) => {
  await api(`/api/schedule/task/${encodeURIComponent(taskId)}`, {
    method: "DELETE",
  });
};

// ─────────────────────────────────────────────────
// 공유 캘린더 / 멤버 / 워크로드
// ─────────────────────────────────────────────────
export const fetchSharedCalendarPhases = async (
  partId: string,
): Promise<SchedulePhase[]> => {
  const sharedServices = await fetchPartServices(partId);
  if (sharedServices.length === 0) return [];
  const allPhases: SchedulePhase[] = [];
  for (const svc of sharedServices) {
    try {
      const { phases } = await fetchServiceWithData(svc.id);
      allPhases.push(...phases);
    } catch {
      // 단일 서비스 로딩 실패는 무시
    }
  }
  return allPhases;
};

export const fetchPartMembers = async (
  partId: string,
): Promise<ScheduleUser[]> => {
  const { members } = await api<{
    members: Array<{
      id: string;
      name: string;
      personalPartId: string | null;
      role: string;
    }>;
  }>(`/api/schedule/workspace/${encodeURIComponent(partId)}/members`);

  return members.map((m) => ({
    id: m.id,
    name: m.name,
    password: "",
    personalPartId: m.personalPartId ?? "",
  }));
};

export const fetchMemberWorkloads = async (
  partId: string,
): Promise<MemberWorkload[]> => {
  const members = await fetchPartMembers(partId);
  const services = await fetchPartServices(partId);

  const servicePhaseMap = new Map<
    string,
    { title: string; phases: SchedulePhase[] }
  >();
  for (const svc of services) {
    try {
      const { phases } = await fetchServiceWithData(svc.id);
      servicePhaseMap.set(svc.id, { title: svc.title, phases });
    } catch {
      // 무시
    }
  }

  return members.map((member) => {
    const memberServices: MemberWorkload["services"] = [];
    let totalTasks = 0;
    let activeTasks = 0;
    let completedTasks = 0;

    for (const [serviceId, { title, phases }] of servicePhaseMap) {
      const memberPhases = phases.filter((p) => p.memberId === member.id);
      if (memberPhases.length === 0) continue;

      const phaseData = memberPhases.map((p) => {
        const total = p.tasks.length;
        const completed = p.tasks.filter((t) => t.isCompleted).length;
        const active = total - completed;
        totalTasks += total;
        activeTasks += active;
        completedTasks += completed;
        return {
          phaseId: p.id,
          phaseName: p.phaseName,
          color: p.color,
          totalTasks: total,
          activeTasks: active,
          completedTasks: completed,
        };
      });

      memberServices.push({ serviceId, serviceTitle: title, phases: phaseData });
    }

    return {
      user: member,
      services: memberServices,
      totalTasks,
      activeTasks,
      completedTasks,
    };
  });
};

// ─────────────────────────────────────────────────
// 이슈 트래킹
// ─────────────────────────────────────────────────
const mapIssueFromDB = (row: any): ScheduleIssue => ({
  id: row.id,
  serviceId: row.board_id ?? row.boardId,
  title: row.title,
  description: row.description || "",
  severity: row.severity || "normal",
  status: row.status || "open",
  createdAt: row.created_at ?? row.createdAt,
  resolvedAt: row.resolved_at ?? row.resolvedAt ?? null,
});

export const fetchServiceIssues = async (
  serviceId: string,
): Promise<ScheduleIssue[]> => {
  const { issues } = await api<{ issues: any[] }>(
    `/api/schedule/service/${encodeURIComponent(serviceId)}/issues`,
  );
  return issues.map(mapIssueFromDB);
};

export const fetchPartIssues = async (
  partId: string,
): Promise<ScheduleIssue[]> => {
  const services = await fetchPartServices(partId);
  if (services.length === 0) return [];
  const all: ScheduleIssue[] = [];
  for (const svc of services) {
    try {
      const list = await fetchServiceIssues(svc.id);
      all.push(...list);
    } catch {
      // 무시
    }
  }
  return all;
};

export const createIssue = async (
  serviceId: string,
  title: string,
  description: string,
  severity: IssueSeverity,
): Promise<ScheduleIssue> => {
  const { issue } = await api<{ issue: any }>(
    `/api/schedule/service/${encodeURIComponent(serviceId)}/issues`,
    {
      method: "POST",
      body: JSON.stringify({ title, description, severity }),
    },
  );
  return mapIssueFromDB(issue);
};

export const updateIssue = async (
  issueId: string,
  updates: {
    title?: string;
    description?: string;
    severity?: IssueSeverity;
    status?: IssueStatus;
  },
): Promise<ScheduleIssue> => {
  const { issue } = await api<{ issue: any }>(
    `/api/schedule/issue/${encodeURIComponent(issueId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(updates),
    },
  );
  return mapIssueFromDB(issue);
};

export const deleteIssue = async (issueId: string) => {
  await api(`/api/schedule/issue/${encodeURIComponent(issueId)}`, {
    method: "DELETE",
  });
};

// 파트 캘린더 뷰 전용 집계 타입
export type PartCalendarPhase = SchedulePhase & {
  serviceId: string;
  serviceTitle: string;
};

// 파트에 속한 모든 서비스의 페이즈를 합산해 반환한다.
export const fetchPartAllPhases = async (
  partId: string,
): Promise<{
  phases: PartCalendarPhase[];
  services: ScheduleServiceData[];
}> => {
  const services = await fetchPartServices(partId);
  const allPhases: PartCalendarPhase[] = [];

  for (const svc of services) {
    try {
      const { phases } = await fetchServiceWithData(svc.id);
      const tagged = phases.map((phase) => ({
        ...phase,
        serviceId: svc.id,
        serviceTitle: svc.title,
      }));
      allPhases.push(...tagged);
    } catch {
      // 서비스 로딩 실패 시 건너뜀
    }
  }

  return { phases: allPhases, services };
};

// 다른 파일에서 fetchServices 또는 그 외 supabase export에 의존하는 경우를 위한 호환 스텁.
export const fetchServices = async () => {
  throw new Error(
    "fetchServices는 더 이상 지원하지 않습니다. fetchPartServices를 사용하세요.",
  );
};

// 레거시: 워크스페이스 스코프 없이 서비스를 만드는 경로는 이제 지원하지 않는다.
// /schedule/create 등 구 경로가 참조하면 명확히 에러를 유도한다.
export const createService = async (
  _title: string,
  _description: string,
): Promise<{ id: string }> => {
  throw new Error(
    "서비스는 워크스페이스 안에서만 생성할 수 있습니다. 허브에서 파트를 먼저 선택하세요.",
  );
};
