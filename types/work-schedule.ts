// types/database.ts (DB 스키마와 1:1 매칭)
export type DbService = {
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
  isCompleted: boolean; // ✨ unknown에서 boolean으로 변경
}

export type ServiceSchedule = {
  id: string;
  serviceName: string;
  color: string;
  tasks: TaskPhase[];
  isCompleted: boolean; // ✨ 프로젝트 완료 상태
};
