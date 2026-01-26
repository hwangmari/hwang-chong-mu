/* eslint-disable @typescript-eslint/no-explicit-any */
// services/schedule.ts
import { supabase } from "@/lib/supabase";
import { ServiceSchedule, TaskPhase } from "@/types/work-schedule";

// ... mapTaskFromDB, mapServiceFromDB 헬퍼 함수는 기존 유지 ...

const mapTaskFromDB = (task: any): TaskPhase => ({
  id: task.id,
  title: task.title,
  startDate: new Date(task.start_date),
  endDate: new Date(task.end_date),
});

const mapServiceFromDB = (svc: any, tasks: any[] = []): ServiceSchedule => ({
  id: svc.id,
  serviceName: svc.name,
  color: svc.color,
  tasks: tasks.map(mapTaskFromDB),
});

// =========================================================
// 1. 보드 (Board) 관련 API - [NEW]
// =========================================================

// 보드 생성 (create/page.tsx 에서 사용)
export const createBoard = async (title: string, description: string) => {
  const { data, error } = await supabase
    .from("schedule_boards")
    .insert({ title, description }) // user_id는 DB default 사용
    .select()
    .single();

  if (error) throw error;
  return data; // { id, title, ... }
};

// 보드 조회 + 하위 서비스 + 하위 태스크 모두 가져오기 ([id]/page.tsx 에서 사용)
export const fetchBoardWithData = async (boardId: string) => {
  // 1. 보드 정보
  const { data: board, error: boardError } = await supabase
    .from("schedule_boards")
    .select("*")
    .eq("id", boardId)
    .single();
  if (boardError) throw boardError;

  // 2. 이 보드에 속한 모든 서비스 조회
  const { data: services, error: svcError } = await supabase
    .from("schedule_services")
    .select("*")
    .eq("board_id", boardId)
    .order("created_at", { ascending: true });
  if (svcError) throw svcError;

  // 3. 이 보드에 속한 모든 태스크 조회 (한 번에 가져와서 JS로 분배)
  // (서비스 ID 목록 추출)
  const serviceIds = services.map((s) => s.id);
  let allTasks: any[] = [];

  if (serviceIds.length > 0) {
    const { data: tasks, error: taskError } = await supabase
      .from("schedule_tasks")
      .select("*")
      .in("service_id", serviceIds)
      .order("start_date", { ascending: true });
    if (taskError) throw taskError;
    allTasks = tasks;
  }

  // 4. 데이터 조립
  const servicesWithTasks = services.map((svc) => {
    const myTasks = allTasks.filter((t) => t.service_id === svc.id);
    return mapServiceFromDB(svc, myTasks);
  });

  return {
    board, // { id, title, description }
    services: servicesWithTasks, // ServiceSchedule[]
  };
};

// =========================================================
// 2. 서비스 (Project) 관련 API - [수정]
// =========================================================

// 서비스 생성 시 boardId가 필수!
export const createService = async (
  boardId: string, // 👈 추가됨
  name: string,
  description: string,
  color: string,
) => {
  const { data, error } = await supabase
    .from("schedule_services")
    .insert({
      board_id: boardId, // 👈 연결
      name,
      description,
      color,
    })
    .select()
    .single();

  if (error) throw error;
  return mapServiceFromDB(data);
};

// ... updateService, deleteService, Task 관련 API는 기존과 동일 ...
// (복붙해서 사용하시면 됩니다)

export const updateService = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from("schedule_services")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return mapServiceFromDB(data);
};

export const deleteService = async (id: string) => {
  const { error } = await supabase
    .from("schedule_services")
    .delete()
    .eq("id", id);
  if (error) throw error;
};

export const createTask = async (serviceId: string, task: any) => {
  const { data, error } = await supabase
    .from("schedule_tasks")
    .insert({
      service_id: serviceId,
      title: task.title,
      start_date: task.startDate.toISOString(),
      end_date: task.endDate.toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  return mapTaskFromDB(data);
};

export const updateTask = async (taskId: string, updates: any) => {
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

export const deleteTask = async (taskId: string) => {
  const { error } = await supabase
    .from("schedule_tasks")
    .delete()
    .eq("id", taskId);
  if (error) throw error;
};

export const fetchBoards = async () => {
  const { data, error } = await supabase
    .from("schedule_boards")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data; // { id, title, description, ... } []
};
