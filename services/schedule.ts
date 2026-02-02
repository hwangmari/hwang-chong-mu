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
  startDate: task.start_date ? new Date(task.start_date) : new Date(),
  endDate: task.end_date ? new Date(task.end_date) : new Date(),
  memo: task.memo || "",
  isCompleted: task.is_completed || false,
});

const mapServiceFromDB = (svc: any, tasks: any[] = []): ServiceSchedule => ({
  id: svc.id,
  serviceName: svc.name,
  color: svc.color,
  isCompleted: svc.is_completed || false,
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
  const dbUpdates: any = {};
  if (updates.serviceName) dbUpdates.name = updates.serviceName;
  if (updates.color) dbUpdates.color = updates.color;
  if (updates.isCompleted !== undefined)
    dbUpdates.is_completed = updates.isCompleted;

  const { data, error } = await supabase
    .from("schedule_services")
    .update(dbUpdates)
    .eq("id", id)
    // ⬇️ 중요: 업데이트된 서비스 정보를 가져올 때, 연관된 tasks도 함께 가져옵니다.
    // 이렇게 해야 프론트엔드에서 tasks가 빈 배열로 덮어씌워지는 것을 막을 수 있습니다.
    .select(
      `
      *,
      tasks:schedule_tasks(*)
    `,
    )
    .single();

  if (error) {
    console.error("업데이트 실패:", error);
    throw error;
  }

  // data.tasks가 존재하므로 함께 매핑하여 반환
  return mapServiceFromDB(data, data.tasks || []);
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

    // 1. 날짜 처리: 어떤 형식이 들어와도 안전하게 변환
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
    if (updates.isCompleted !== undefined)
      dbUpdates.is_completed = updates.isCompleted;

    // 💡 전송 직전의 깨끗한 데이터를 확인 (중요!)
    console.log("Final DB Payload:", JSON.parse(JSON.stringify(dbUpdates)));

    const { data, error } = await supabase
      .from("schedule_tasks")
      .update(dbUpdates)
      .eq("id", taskId)
      .select()
      .single();

    if (error) {
      // Supabase 에러 객체를 문자열로 강제 변환하여 출력
      console.error("Supabase Error String:", JSON.stringify(error, null, 2));
      throw error;
    }

    return mapTaskFromDB(data);
  } catch (err: any) {
    console.error("UpdateTask 전역 캐치 에러:", err.message);
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
