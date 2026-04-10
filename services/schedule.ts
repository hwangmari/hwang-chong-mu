
import { supabase } from "@/lib/supabase";
import {
  SchedulePhase,
  TaskPhase,
  ScheduleUser,
  SchedulePart,
  ScheduleServiceData,
  ScheduleStore,
} from "@/types/work-schedule";
import { format } from "date-fns";

const mapTaskFromDB = (task: any): TaskPhase => ({
  id: task.id,
  title: task.title,
  startDate: new Date(task.start_date),
  endDate: new Date(task.end_date),
  memo: task.memo || "",
  isCompleted: task.is_completed ?? false,
});
const mapPhaseFromDB = (svc: any, tasks: any[] = []): SchedulePhase => ({
  id: svc.id,
  phaseName: svc.name,
  color: svc.color,
  isCompleted: svc.is_completed ?? false,
  isHidden: svc.is_hidden ?? false,
  tasks: tasks.map(mapTaskFromDB),
  memberId: svc.member_id ?? undefined,
  memberName: svc.member_name ?? undefined,
  memberColor: svc.member_color ?? undefined,
});

// ── ID 생성 유틸 ──
function createId(prefix: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID().replace(/-/g, "").slice(0, 8)}`;
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function generateInviteCode() {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

// ── 파트 매퍼 ──
const mapUserFromDB = (row: any): ScheduleUser => ({
  id: row.id,
  name: row.name,
  password: row.password,
  personalPartId: row.personal_workspace_id,
});

const mapPartFromDB = (row: any): SchedulePart => ({
  id: row.id,
  name: row.name,
  type: row.type,
  password: row.password,
  ownerUserId: row.owner_user_id ?? undefined,
  memberIds: row.member_ids ?? [],
  inviteCode: row.invite_code ?? undefined,
});

// ── 스토어 조회 ──

export const fetchScheduleStore = async (): Promise<ScheduleStore> => {
  const { data: users, error: uErr } = await supabase
    .from("schedule_users")
    .select("*");
  if (uErr) throw uErr;

  const { data: parts, error: wErr } = await supabase
    .from("schedule_workspaces")
    .select("*")
    .order("created_at", { ascending: false });
  if (wErr) throw wErr;

  return {
    users: (users || []).map(mapUserFromDB),
    parts: (parts || []).map(mapPartFromDB),
  };
};

export const createScheduleUser = async (
  name: string,
  password: string,
): Promise<{ user: ScheduleUser; part: SchedulePart }> => {
  // 이름 중복 체크
  const { data: existing } = await supabase
    .from("schedule_users")
    .select("id")
    .eq("name", name)
    .maybeSingle();
  if (existing) throw new Error("이미 사용 중인 이름입니다. 로그인해 주세요.");

  const userId = createId("su");
  const partId = createId("sw");

  const { data: ws, error: wsErr } = await supabase
    .from("schedule_workspaces")
    .insert({
      id: partId,
      name: `${name}의 캘린더`,
      type: "personal",
      password,
      owner_user_id: userId,
      member_ids: [userId],
    })
    .select()
    .single();
  if (wsErr) throw wsErr;

  const { data: user, error: uErr } = await supabase
    .from("schedule_users")
    .insert({
      id: userId,
      name,
      password,
      personal_workspace_id: partId,
    })
    .select()
    .single();
  if (uErr) throw uErr;

  return {
    user: mapUserFromDB(user),
    part: mapPartFromDB(ws),
  };
};

export const loginScheduleUser = async (
  name: string,
  password: string,
): Promise<ScheduleUser> => {
  const { data: user } = await supabase
    .from("schedule_users")
    .select("*")
    .eq("name", name)
    .maybeSingle();
  if (!user) throw new Error("존재하지 않는 이름입니다.");
  if (user.password !== password)
    throw new Error("비밀번호가 일치하지 않습니다.");
  return mapUserFromDB(user);
};

export const createSharedPart = async (
  partName: string,
  partPassword: string,
  ownerName: string,
  ownerPassword: string,
): Promise<{
  user: ScheduleUser;
  part: SchedulePart;
}> => {
  const { user } = await createScheduleUser(ownerName, ownerPassword);

  const roomId = createId("sw");
  const inviteCode = generateInviteCode();

  const { data: ws, error: wsErr } = await supabase
    .from("schedule_workspaces")
    .insert({
      id: roomId,
      name: partName,
      type: "shared",
      password: partPassword,
      owner_user_id: user.id,
      member_ids: [user.id],
      invite_code: inviteCode,
    })
    .select()
    .single();
  if (wsErr) throw wsErr;

  return { user, part: mapPartFromDB(ws) };
};

export const joinSharedPart = async (
  inviteCode: string,
  userName: string,
  userPassword: string,
): Promise<{
  user: ScheduleUser;
  part: SchedulePart;
}> => {
  const { data: ws, error: wsErr } = await supabase
    .from("schedule_workspaces")
    .select("*")
    .eq("invite_code", inviteCode)
    .single();
  if (wsErr || !ws) throw new Error("유효하지 않은 초대코드입니다.");

  const { user } = await createScheduleUser(userName, userPassword);

  const updatedMemberIds = [...(ws.member_ids || []), user.id];
  const { data: updatedWs, error: updateErr } = await supabase
    .from("schedule_workspaces")
    .update({ member_ids: updatedMemberIds })
    .eq("id", ws.id)
    .select()
    .single();
  if (updateErr) throw updateErr;

  return { user, part: mapPartFromDB(updatedWs) };
};

export const fetchPartServices = async (
  partId: string,
): Promise<ScheduleServiceData[]> => {
  const { data, error } = await supabase
    .from("schedule_boards")
    .select("*")
    .eq("workspace_id", partId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((b: any) => ({
    id: b.id,
    title: b.title,
    description: b.description,
    partId: b.workspace_id,
    createdAt: b.created_at,
  }));
};

export const createServiceInPart = async (
  partId: string,
  title: string,
  description: string,
) => {
  const { data, error } = await supabase
    .from("schedule_boards")
    .insert({ title, description, workspace_id: partId })
    .select()
    .single();
  if (error) throw error;
  return data;
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
  const { data, error } = await supabase
    .from("schedule_services")
    .insert({
      board_id: serviceId,
      name,
      description,
      color,
      member_id: memberId,
      member_name: memberName,
      member_color: memberColor,
    })
    .select()
    .single();
  if (error) throw error;
  return mapPhaseFromDB(data);
};

// 공용 캘린더: 모든 멤버의 개인 파트 일정을 합쳐서 조회
export const fetchSharedCalendarPhases = async (
  partId: string,
): Promise<SchedulePhase[]> => {
  const members = await fetchPartMembers(partId);
  if (members.length === 0) return [];

  const allPhases: SchedulePhase[] = [];

  for (const member of members) {
    if (!member.personalPartId) continue;

    const services = await fetchPartServices(member.personalPartId);

    for (const svc of services) {
      try {
        const { phases } = await fetchServiceWithData(svc.id);
        const tagged = phases.map((phase) => ({
          ...phase,
          memberId: member.id,
          memberName: member.name,
          memberColor: phase.color,
        }));
        allPhases.push(...tagged);
      } catch {
        // 서비스 로딩 실패 시 건너뜀
      }
    }
  }

  const sharedServices = await fetchPartServices(partId);
  for (const svc of sharedServices) {
    try {
      const { phases } = await fetchServiceWithData(svc.id);
      allPhases.push(...phases);
    } catch {
      // 무시
    }
  }

  return allPhases;
};

export const fetchPartMembers = async (
  partId: string,
): Promise<ScheduleUser[]> => {
  const { data: ws, error: wsErr } = await supabase
    .from("schedule_workspaces")
    .select("member_ids")
    .eq("id", partId)
    .single();
  if (wsErr || !ws) return [];

  const memberIds = ws.member_ids || [];
  if (memberIds.length === 0) return [];

  const { data: users, error: uErr } = await supabase
    .from("schedule_users")
    .select("*")
    .in("id", memberIds);
  if (uErr) return [];

  return (users || []).map(mapUserFromDB);
};


// 파트 캘린더: 파트 내 모든 서비스의 단계를 합산 조회
export type PartCalendarPhase = SchedulePhase & {
  serviceId: string;
  serviceTitle: string;
};

export const fetchPartAllPhases = async (
  partId: string,
): Promise<{ phases: PartCalendarPhase[]; services: ScheduleServiceData[] }> => {
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

export const createService = async (title: string, description: string) => {
  const { data, error } = await supabase
    .from("schedule_boards")
    .insert({ title, description })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const fetchServiceWithData = async (serviceId: string) => {
  const { data: service, error: svcError } = await supabase
    .from("schedule_boards")
    .select("*")
    .eq("id", serviceId)
    .single();
  if (svcError) throw svcError;

  const { data: phases, error: phaseError } = await supabase
    .from("schedule_services")
    .select("*")
    .eq("board_id", serviceId)
    .order("created_at", { ascending: true });
  if (phaseError) throw phaseError;

  const phaseIds = phases.map((s) => s.id);
  let allTasks: any[] = [];

  if (phaseIds.length > 0) {
    const { data: tasks, error: taskError } = await supabase
      .from("schedule_tasks")
      .select("*")
      .in("service_id", phaseIds)
      .order("start_date", { ascending: true });
    if (taskError) throw taskError;
    allTasks = tasks;
  }

  const phasesWithTasks = phases.map((p) => {
    const myTasks = allTasks.filter((t) => t.service_id === p.id);
    return mapPhaseFromDB(p, myTasks);
  });

  return { service, phases: phasesWithTasks };
};

export const getServiceData = async (serviceId: string) => {
  const { data, error } = await supabase
    .from("schedule_boards")
    .select(
      `
      *,
      services:schedule_services(
        *,
        tasks:schedule_tasks(*)
      )
    `,
    )
    .eq("id", serviceId)
    .single();

  if (error) throw error;
  if (!data) throw new Error("데이터를 찾을 수 없습니다.");

  const phasesWithTasks = (data.services || []).map((svc: any) => {
    return mapPhaseFromDB(svc, svc.tasks || []);
  });

  return {
    service: data,
    phases: phasesWithTasks,
  };
};

export const fetchServices = async () => {
  const { data, error } = await supabase
    .from("schedule_boards")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
};

export const updateService = async (serviceId: string, updates: any) => {
  const { data, error } = await supabase
    .from("schedule_boards")
    .update(updates)
    .eq("id", serviceId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteService = async (serviceId: string) => {
  const { error } = await supabase
    .from("schedule_boards")
    .delete()
    .eq("id", serviceId);
  if (error) throw error;
};


export const createPhase = async (
  serviceId: string,
  name: string,
  description: string,
  color: string,
) => {
  const { data, error } = await supabase
    .from("schedule_services")
    .insert({ board_id: serviceId, name, description, color })
    .select()
    .single();

  if (error) throw error;
  return mapPhaseFromDB(data);
};

export const updatePhase = async (id: string, updates: any) => {
  try {
    const dbUpdates: any = {};

    if (updates.phaseName) dbUpdates.name = updates.phaseName;
    if (updates.color) dbUpdates.color = updates.color;

    const completedVal = updates.isCompleted ?? updates.is_completed;
    if (completedVal !== undefined) {
      dbUpdates.is_completed = completedVal;
    }

    const hiddenVal = updates.isHidden ?? updates.is_hidden;
    if (hiddenVal !== undefined) {
      dbUpdates.is_hidden = hiddenVal;
    }

    console.log("Phase DB Update Payload:", dbUpdates);

    if (Object.keys(dbUpdates).length === 0) {
      console.warn("업데이트할 데이터가 없습니다.");
      return;
    }

    const { data, error } = await supabase
      .from("schedule_services")
      .update(dbUpdates)
      .eq("id", id)
      .select(`*, tasks:schedule_tasks(*)`)
      .single();

    if (error) {
      console.error("Supabase 상세 에러:", JSON.stringify(error, null, 2));
      throw error;
    }

    return mapPhaseFromDB(data, data.tasks || []);
  } catch (err: any) {
    console.error("updatePhase 내부 에러:", err.message);
    throw err;
  }
};

export const deletePhase = async (id: string) => {
  const { error } = await supabase
    .from("schedule_services")
    .delete()
    .eq("id", id);
  if (error) throw error;
};


export const createTask = async (phaseId: string, task: any) => {
  const { data, error } = await supabase
    .from("schedule_tasks")
    .insert({
      service_id: phaseId,
      title: task.title,
      start_date: task.startDate.toISOString(),
      end_date: task.endDate.toISOString(),
      memo: task.memo || "",
    })
    .select()
    .single();

  if (error) throw error;
  return mapTaskFromDB(data);
};

export const updateTask = async (taskId: string, updates: any) => {
  try {
    const dbUpdates: any = {};

    if (updates.title) dbUpdates.title = updates.title;

    const ensureISOString = (dateInput: any) => {
      if (!dateInput) return null;
      const date = new Date(dateInput);
      return !isNaN(date.getTime()) ? date.toISOString() : null;
    };

    if (updates.startDate) {
      const iso = ensureISOString(updates.startDate);
      if (iso) dbUpdates.start_date = iso;
    }
    if (updates.endDate) {
      const iso = ensureISOString(updates.endDate);
      if (iso) dbUpdates.end_date = iso;
    }
    if (updates.memo !== undefined) dbUpdates.memo = updates.memo;

    const completedVal = updates.isCompleted ?? updates.is_completed;
    if (completedVal !== undefined) {
      dbUpdates.is_completed = completedVal;
    }

    console.log("Task DB Payload:", dbUpdates);

    if (Object.keys(dbUpdates).length === 0) {
      console.warn("Task 업데이트 데이터가 비어있습니다.");
      return;
    }

    const { data, error } = await supabase
      .from("schedule_tasks")
      .update(dbUpdates)
      .eq("id", taskId)
      .select()
      .single();

    if (error) {
      console.error("Supabase Error String:", JSON.stringify(error, null, 2));
      throw error;
    }

    return mapTaskFromDB(data);
  } catch (err: any) {
    console.error("UpdateTask 에러:", err.message);
    throw err;
  }
};

export const deleteTask = async (taskId: string) => {
  const { error } = await supabase
    .from("schedule_tasks")
    .delete()
    .eq("id", taskId);
  if (error) throw error;
};

// ── 멤버 리소스 관리 ──

import type {
  MemberWorkload,
  ScheduleIssue,
  IssueSeverity,
  IssueStatus,
} from "@/types/work-schedule";

export const fetchMemberWorkloads = async (
  partId: string,
): Promise<MemberWorkload[]> => {
  const members = await fetchPartMembers(partId);
  const services = await fetchPartServices(partId);

  // 모든 서비스의 단계 데이터를 한번에 로딩
  const servicePhaseMap = new Map<string, { title: string; phases: SchedulePhase[] }>();
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

    // 1. 멤버의 개인 파트 서비스
    if (member.personalPartId) {
      // personalPartId의 서비스는 별도 로딩이 필요하지만,
      // 공용 파트 내 서비스에서 memberId로 매칭된 단계를 찾는다
    }

    // 2. 공용 파트 서비스에서 멤버가 할당된 단계 찾기
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

      memberServices.push({
        serviceId,
        serviceTitle: title,
        phases: phaseData,
      });
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

// ── 이슈 트래킹 ──

const mapIssueFromDB = (row: any): ScheduleIssue => ({
  id: row.id,
  serviceId: row.board_id,
  title: row.title,
  description: row.description || "",
  severity: row.severity || "normal",
  status: row.status || "open",
  createdAt: row.created_at,
  resolvedAt: row.resolved_at ?? null,
});

export const fetchServiceIssues = async (
  serviceId: string,
): Promise<ScheduleIssue[]> => {
  const { data, error } = await supabase
    .from("schedule_issues")
    .select("*")
    .eq("board_id", serviceId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(mapIssueFromDB);
};

export const fetchPartIssues = async (
  partId: string,
): Promise<ScheduleIssue[]> => {
  const services = await fetchPartServices(partId);
  const serviceIds = services.map((s) => s.id);
  if (serviceIds.length === 0) return [];

  const { data, error } = await supabase
    .from("schedule_issues")
    .select("*")
    .in("board_id", serviceIds)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(mapIssueFromDB);
};

export const createIssue = async (
  serviceId: string,
  title: string,
  description: string,
  severity: IssueSeverity,
): Promise<ScheduleIssue> => {
  const { data, error } = await supabase
    .from("schedule_issues")
    .insert({
      board_id: serviceId,
      title,
      description,
      severity,
      status: "open",
    })
    .select()
    .single();
  if (error) throw error;
  return mapIssueFromDB(data);
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
  const dbUpdates: any = {};
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.severity !== undefined) dbUpdates.severity = updates.severity;
  if (updates.status !== undefined) {
    dbUpdates.status = updates.status;
    if (updates.status === "resolved") {
      dbUpdates.resolved_at = new Date().toISOString();
    } else {
      dbUpdates.resolved_at = null;
    }
  }

  const { data, error } = await supabase
    .from("schedule_issues")
    .update(dbUpdates)
    .eq("id", issueId)
    .select()
    .single();
  if (error) throw error;
  return mapIssueFromDB(data);
};

export const deleteIssue = async (issueId: string) => {
  const { error } = await supabase
    .from("schedule_issues")
    .delete()
    .eq("id", issueId);
  if (error) throw error;
};
