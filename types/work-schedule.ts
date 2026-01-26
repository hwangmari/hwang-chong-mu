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

export type TaskPhase = {
  id: string;
  title: string;
  startDate: Date; // DB의 start_date를 Date 객체로 변환
  endDate: Date; // DB의 end_date를 Date 객체로 변환
};

export type ServiceSchedule = {
  id: string;
  serviceName: string; // DB의 name
  color: string;
  tasks: TaskPhase[];
};
