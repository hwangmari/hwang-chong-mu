/* eslint-disable @typescript-eslint/no-explicit-any */
// services/schedule.ts
import { supabase } from "@/lib/supabase";
import { ServiceSchedule, TaskPhase } from "@/types/work-schedule";
import { format } from "date-fns";

// 1. Task 매핑 함수: DB의 is_completed를 TaskPhase의 isCompleted로 연결
const mapTaskFromDB = (task: any): TaskPhase => ({
  id: task.id,
  title: task.title,
  startDate: new Date(task.start_date),
  endDate: new Date(task.end_date),
  memo: task.memo || "",
  isCompleted: task.is_completed || false,
});

// 2. Service 매핑 함수: DB의 is_completed를 ServiceSchedule의 isCompleted로 연결
const mapServiceFromDB = (svc: any, tasks: any[] = []): ServiceSchedule => ({
  id: svc.id,
  serviceName: svc.name,
  color: svc.color,
  isCompleted: svc.is_completed || false,
  tasks: tasks.map(mapTaskFromDB),
});

// =========================================================
// 보드 (Board) 관련 API
// =========================================================

export const createBoard = async (title: string, description: string) => {
  const { data, error } = await supabase
    .from("schedule_boards")
    .insert({ title, description })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const fetchBoardWithData = async (boardId: string) => {
  const { data: board, error: boardError } = await supabase
    .from("schedule_boards")
    .select("*")
    .eq("id", boardId)
    .single();
  if (boardError) throw boardError;

  const { data: services, error: svcError } = await supabase
    .from("schedule_services")
    .select("*")
    .eq("board_id", boardId)
    .order("created_at", { ascending: true });
  if (svcError) throw svcError;

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

  const servicesWithTasks = services.map((svc) => {
    const myTasks = allTasks.filter((t) => t.service_id === svc.id);
    return mapServiceFromDB(svc, myTasks);
  });

  return { board, services: servicesWithTasks };
};

// =========================================================
// 서비스 (Project) 관련 API
// =========================================================

export const createService = async (
  boardId: string,
  name: string,
  description: string,
  color: string,
) => {
  const { data, error } = await supabase
    .from("schedule_services")
    .insert({ board_id: boardId, name, description, color })
    .select()
    .single();

  if (error) throw error;
  return mapServiceFromDB(data);
};

// 프로젝트 완료 체크 시 호출됨 (is_completed 데이터를 updates에 담아 보냄)
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

// =========================================================
// 업무 (Task) 관련 API
// =========================================================

export const createTask = async (serviceId: string, task: any) => {
  const { data, error } = await supabase
    .from("schedule_tasks")
    .insert({
      service_id: serviceId,
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
  const dbUpdates: any = {};
  if (updates.title) dbUpdates.title = updates.title;
  if (updates.startDate)
    dbUpdates.start_date = format(updates.startDate, "yyyy-MM-dd");
  if (updates.endDate)
    dbUpdates.end_date = format(updates.endDate, "yyyy-MM-dd");
  if (updates.memo !== undefined) dbUpdates.memo = updates.memo;

  // ✨ 완료 여부 업데이트 로직 추가
  if (updates.isCompleted !== undefined)
    dbUpdates.is_completed = updates.isCompleted;

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

// =========================================================
// 보드 목록 관리
// =========================================================

export const fetchBoards = async () => {
  const { data, error } = await supabase
    .from("schedule_boards")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
};

export const updateBoard = async (
  boardId: string,
  updates: { title?: string; description?: string },
) => {
  const { data, error } = await supabase
    .from("schedule_boards")
    .update(updates)
    .eq("id", boardId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteBoard = async (boardId: string) => {
  const { error } = await supabase
    .from("schedule_boards")
    .delete()
    .eq("id", boardId);
  if (error) throw error;
};
