/* eslint-disable @typescript-eslint/no-explicit-any */
// services/schedule.ts

import { supabase } from "@/lib/supabase";
import { ServiceSchedule, TaskPhase } from "@/types/work-schedule";
import { format } from "date-fns";

// =========================================================
// 🛠️ 데이터 매핑 헬퍼 함수
// =========================================================
const mapTaskFromDB = (task: any): TaskPhase => ({
  id: task.id,
  title: task.title,
  startDate: new Date(task.start_date),
  endDate: new Date(task.end_date),
  memo: task.memo || "",
  isCompleted: task.is_completed ?? false,
});
const mapServiceFromDB = (svc: any, tasks: any[] = []): ServiceSchedule => ({
  id: svc.id,
  serviceName: svc.name,
  color: svc.color,
  isCompleted: svc.is_completed ?? false,
  isHidden: svc.is_hidden ?? false,
  tasks: tasks.map(mapTaskFromDB),
});

// =========================================================
// 📋 보드 (Board) 관련 API
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
export const getBoardData = async (boardId: string) => {
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
    .eq("id", boardId)
    .single();

  if (error) throw error;
  if (!data) throw new Error("데이터를 찾을 수 없습니다.");

  // services가 없을 경우를 대비해 빈 배열([]) 처리
  const servicesWithTasks = (data.services || []).map((svc: any) => {
    return mapServiceFromDB(svc, svc.tasks || []);
  });

  return {
    board: data,
    services: servicesWithTasks,
  };
};

// ... fetchBoards, updateBoard, deleteBoard 등은 기존과 동일 ...
export const fetchBoards = async () => {
  const { data, error } = await supabase
    .from("schedule_boards")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
};

export const updateBoard = async (boardId: string, updates: any) => {
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

// =========================================================
// 🚀 서비스 (Project) 관련 API
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

// ✨ [핵심 수정] 프로젝트 업데이트 시 태스크 유실 방지
export const updateService = async (id: string, updates: any) => {
  try {
    const dbUpdates: any = {};

    if (updates.serviceName) dbUpdates.name = updates.serviceName;
    if (updates.color) dbUpdates.color = updates.color;

    const completedVal = updates.isCompleted ?? updates.is_completed;
    if (completedVal !== undefined) {
      dbUpdates.is_completed = completedVal;
    }

    const hiddenVal = updates.isHidden ?? updates.is_hidden;
    if (hiddenVal !== undefined) {
      dbUpdates.is_hidden = hiddenVal;
    }

    // 💡 [디버깅] 로그 확인
    console.log("Service DB Update Payload:", dbUpdates);

    // 업데이트할 내용이 없는 경우 에러 방지 (선택 사항)
    if (Object.keys(dbUpdates).length === 0) {
      console.warn("업데이트할 데이터가 없습니다.");
      return; // 혹은 현재 상태 리턴
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

    return mapServiceFromDB(data, data.tasks || []);
  } catch (err: any) {
    console.error("updateService 내부 에러:", err.message);
    throw err;
  }
};
export const deleteService = async (id: string) => {
  const { error } = await supabase
    .from("schedule_services")
    .delete()
    .eq("id", id);
  if (error) throw error;
};

// =========================================================
// ✅ 업무 (Task) 관련 API
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

// ✨ [핵심 수정] 날짜 변환 로직 안전성 강화
export const updateTask = async (taskId: string, updates: any) => {
  try {
    const dbUpdates: any = {};

    if (updates.title) dbUpdates.title = updates.title;

    // 날짜 처리 (기존 로직 유지)
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

    // ✨ [수정] 완료 상태 처리 강화 (입력 키 호환성 확보)
    const completedVal = updates.isCompleted ?? updates.is_completed;
    if (completedVal !== undefined) {
      dbUpdates.is_completed = completedVal;
    }

    // 💡 [디버깅] Payload 확인
    console.log("Task DB Payload:", dbUpdates);

    // 업데이트 객체가 비어있으면 Supabase가 400 에러를 뱉을 수 있음
    if (Object.keys(dbUpdates).length === 0) {
      console.warn("Task 업데이트 데이터가 비어있습니다.");
      // 에러를 던지지 않고 무시하거나, 현재 데이터를 다시 fetch해서 리턴
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
