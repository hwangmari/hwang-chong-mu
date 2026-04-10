export type DbPhase = {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  color: string;
  created_at: string;
};

export type DbTask = {
  id: string;
  service_id: string;
  title: string;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  created_at: string;
};
export interface TaskPhase {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  memo: string;
  isCompleted: boolean;
}

export type SchedulePhase = {
  id: string;
  phaseName: string;
  color: string;
  tasks: TaskPhase[];
  isCompleted: boolean;
  isHidden: boolean;
  memberId?: string;
  memberName?: string;
  memberColor?: string;
};

// ── 파트/서비스 관련 타입 ──

export type ScheduleUser = {
  id: string;
  name: string;
  password: string;
  personalPartId: string;
};

export type SchedulePart = {
  id: string;
  name: string;
  type: "personal" | "shared";
  password: string;
  ownerUserId?: string;
  memberIds: string[];
  inviteCode?: string;
};

export type ScheduleServiceData = {
  id: string;
  title: string;
  description: string | null;
  partId?: string | null;
  createdAt?: string;
};

export type ScheduleStore = {
  users: ScheduleUser[];
  parts: SchedulePart[];
};

// ── 이슈 트래킹 ──

export type IssueSeverity = "blocker" | "warning" | "normal";
export type IssueStatus = "open" | "in_progress" | "resolved";

export type MemberWorkload = {
  user: ScheduleUser;
  services: {
    serviceId: string;
    serviceTitle: string;
    phases: {
      phaseId: string;
      phaseName: string;
      color: string;
      totalTasks: number;
      activeTasks: number;
      completedTasks: number;
    }[];
  }[];
  totalTasks: number;
  activeTasks: number;
  completedTasks: number;
};

export type ScheduleIssue = {
  id: string;
  serviceId: string;
  title: string;
  description: string;
  severity: IssueSeverity;
  status: IssueStatus;
  createdAt: string;
  resolvedAt: string | null;
};
