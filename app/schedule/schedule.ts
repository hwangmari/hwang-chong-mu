/* eslint-disable @typescript-eslint/no-explicit-any */
// services/schedule.ts
import { supabase } from "@/lib/supabase";
import { ServiceSchedule, TaskPhase } from "@/types/work-schedule";

// --- [변환 헬퍼] DB 데이터 -> 프론트엔드 타입 변환 ---
const mapTaskFromDB = (task: any): TaskPhase => ({
  id: task.id,
  title: task.title,
  // DB 컬럼(start_date)이 제대로 매핑되었는지 확인!
  startDate: new Date(task.start_date),
  endDate: new Date(task.end_date),
});

const mapServiceFromDB = (svc: any, tasks: any[] = []): ServiceSchedule => ({
  id: svc.id,
  serviceName: svc.name,
  color: svc.color,
  tasks: tasks.map(mapTaskFromDB),
});

// --- 1. 서비스(프로젝트) 관련 API ---

// 전체 서비스 목록 조회
export const fetchServices = async () => {
  const { data, error } = await supabase
    .from("schedule_services")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  // 목록 조회 시엔 task 정보는 일단 비워둠 (상세 조회에서 가져옴)
  return data.map((svc) => mapServiceFromDB(svc, []));
};

// 특정 서비스 상세 조회 (Tasks 포함)
export const fetchServiceById = async (id: string) => {
  // 1. 서비스 정보 조회
  const { data: svc, error: svcError } = await supabase
    .from("schedule_services")
    .select("*")
    .eq("id", id)
    .single();

  if (svcError) throw svcError;

  // 2. 해당 서비스의 태스크 조회
  const { data: tasks, error: taskError } = await supabase
    .from("schedule_tasks")
    .select("*")
    .eq("service_id", id)
    .order("start_date", { ascending: true });

  if (taskError) throw taskError;

  return mapServiceFromDB(svc, tasks || []);
};

// 서비스 생성
export const createService = async (
  name: string,
  description: string,
  color: string,
) => {
  const { data, error } = await supabase
    .from("schedule_services")
    .insert({ name, description, color })
    .select()
    .single();

  if (error) throw error;
  return mapServiceFromDB(data);
};

// 서비스 수정 (이름, 색상 등)
export const updateService = async (
  id: string,
  updates: { name?: string; color?: string; description?: string },
) => {
  const { data, error } = await supabase
    .from("schedule_services")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return mapServiceFromDB(data);
};

// 서비스 삭제
export const deleteService = async (id: string) => {
  const { error } = await supabase
    .from("schedule_services")
    .delete()
    .eq("id", id);
  if (error) throw error;
};

// --- 2. 업무(Task) 관련 API ---

// 업무 생성
export const createTask = async (
  serviceId: string,
  task: { title: string; startDate: Date; endDate: Date },
) => {
  const { data, error } = await supabase
    .from("schedule_tasks")
    .insert({
      service_id: serviceId,
      title: task.title,
      start_date: task.startDate.toISOString(), // Date -> String 변환
      end_date: task.endDate.toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return mapTaskFromDB(data);
};

// 업무 수정
export const updateTask = async (
  taskId: string,
  updates: { title?: string; startDate?: Date; endDate?: Date },
) => {
  // DB 컬럼명에 맞게 변환
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dbUpdates: any = {};
  if (updates.title) dbUpdates.title = updates.title;
  if (updates.startDate) dbUpdates.start_date = updates.startDate.toISOString();
  if (updates.endDate) dbUpdates.end_date = updates.endDate.toISOString();

  const { data, error } = await supabase
    .from("schedule_tasks")
    .update(dbUpdates)
    .eq("id", taskId)
    .select()
    .single();

  if (error) throw error;
  return mapTaskFromDB(data);
};

// 업무 삭제
export const deleteTask = async (taskId: string) => {
  const { error } = await supabase
    .from("schedule_tasks")
    .delete()
    .eq("id", taskId);
  if (error) throw error;
};
