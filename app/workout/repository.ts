"use client";

import { supabase } from "@/lib/supabase";
import type {
  ActivityRecord,
  GymExercise,
  GymRecord,
  RunningEnvironment,
  RunningInterval,
  RunningRecord,
  RunningType,
  WorkoutRoutine,
  WorkoutSession,
} from "./types";

// =========================
// Row → TS 매핑
// =========================
// 방 생성/입장 RPC(workout_room_create / workout_room_login)가 돌려주는 형태.
// 비밀번호는 서버 안에서만 확인하고 밖으로 내보내지 않는다.
type RoomRpcResult = {
  roomId?: string;
  roomName?: string;
};

type RunningRow = {
  id: string;
  room_id: string;
  date: string;
  run_type: string;
  environment: string | null;
  distance_km: number | string;
  duration_sec: number;
  avg_pace_sec: number | null;
  avg_heart_rate: number | null;
  avg_cadence: number | null;
  calories: number | null;
  intervals: RunningInterval[] | null;
  memo: string | null;
  created_at: string;
  updated_at: string;
};

type GymRow = {
  id: string;
  room_id: string;
  date: string;
  body_part: string | null;
  duration_min: number | null;
  calories: number | null;
  avg_heart_rate: number | null;
  exercises: GymExercise[] | null;
  memo: string | null;
  created_at: string;
  updated_at: string;
};

function mapRunning(row: RunningRow): RunningRecord {
  return {
    id: row.id,
    roomId: row.room_id,
    date: row.date,
    runType: row.run_type as RunningType,
    environment: (row.environment ?? "outdoor") as RunningEnvironment,
    distanceKm: Number(row.distance_km),
    durationSec: row.duration_sec,
    avgPaceSec: row.avg_pace_sec ?? undefined,
    avgHeartRate: row.avg_heart_rate ?? undefined,
    avgCadence: row.avg_cadence ?? undefined,
    calories: row.calories ?? undefined,
    intervals: row.intervals ?? undefined,
    memo: row.memo ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapGym(row: GymRow): GymRecord {
  return {
    id: row.id,
    roomId: row.room_id,
    date: row.date,
    bodyPart: (row.body_part ?? undefined) as GymRecord["bodyPart"],
    durationMin: row.duration_min ?? undefined,
    calories: row.calories ?? undefined,
    avgHeartRate: row.avg_heart_rate ?? undefined,
    exercises: row.exercises ?? [],
    memo: row.memo ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// =========================
// 방 생성 / 입장
// =========================
export async function createWorkoutRoom(
  name: string,
  password: string,
): Promise<WorkoutSession> {
  if (!name.trim() || !password.trim()) {
    throw new Error("방 이름과 비밀번호를 입력해 주세요.");
  }

  const { data, error } = await supabase.rpc("workout_room_create", {
    p_name: name.trim(),
    p_password: password.trim(),
  });

  if (error) {
    throw new Error("방 생성에 실패했어요.");
  }

  const result = (data ?? null) as RoomRpcResult | null;
  if (!result?.roomId) {
    throw new Error("방 생성에 실패했어요.");
  }

  return {
    roomId: result.roomId,
    roomName: result.roomName ?? name.trim(),
  };
}

export async function joinWorkoutRoom(
  roomName: string,
  password: string,
): Promise<WorkoutSession> {
  if (!roomName.trim() || !password.trim()) {
    throw new Error("방 이름과 비밀번호를 입력해 주세요.");
  }

  // 비밀번호 대조는 서버(workout_room_login)에서만 한다.
  // 방 이름이나 비밀번호가 틀리면 서버가 INVALID_ROOM 을 던진다.
  const { data, error } = await supabase.rpc("workout_room_login", {
    p_name: roomName.trim(),
    p_password: password.trim(),
  });

  if (error) {
    throw new Error("방 이름 또는 비밀번호가 맞지 않아요.");
  }

  const result = (data ?? null) as RoomRpcResult | null;
  if (!result?.roomId) {
    throw new Error("방 이름 또는 비밀번호가 맞지 않아요.");
  }

  return {
    roomId: result.roomId,
    roomName: result.roomName ?? roomName.trim(),
  };
}

// =========================
// 러닝 기록 CRUD
// =========================
export async function fetchRunningRecords(roomId: string): Promise<RunningRecord[]> {
  const { data, error } = await supabase
    .from("workout_running_records")
    .select("*")
    .eq("room_id", roomId)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return ((data || []) as RunningRow[]).map(mapRunning);
}

export async function upsertRunningRecord(
  record: Omit<RunningRecord, "createdAt" | "updatedAt"> & {
    createdAt?: string;
    updatedAt?: string;
  },
): Promise<RunningRecord> {
  const payload = {
    id: record.id,
    room_id: record.roomId,
    date: record.date,
    run_type: record.runType,
    environment: record.environment ?? "outdoor",
    distance_km: record.distanceKm,
    duration_sec: record.durationSec,
    avg_pace_sec: record.avgPaceSec ?? null,
    avg_heart_rate: record.avgHeartRate ?? null,
    avg_cadence: record.avgCadence ?? null,
    calories: record.calories ?? null,
    intervals: record.intervals ?? null,
    memo: record.memo ?? null,
  };

  const { data, error } = await supabase
    .from("workout_running_records")
    .upsert(payload, { onConflict: "id" })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "러닝 기록 저장에 실패했어요.");
  }
  return mapRunning(data as RunningRow);
}

export async function deleteRunningRecord(id: string) {
  const { error } = await supabase
    .from("workout_running_records")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
}

// =========================
// 헬스 기록 CRUD
// =========================
export async function fetchGymRecords(roomId: string): Promise<GymRecord[]> {
  const { data, error } = await supabase
    .from("workout_gym_records")
    .select("*")
    .eq("room_id", roomId)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return ((data || []) as GymRow[]).map(mapGym);
}

export async function upsertGymRecord(
  record: Omit<GymRecord, "createdAt" | "updatedAt"> & {
    createdAt?: string;
    updatedAt?: string;
  },
): Promise<GymRecord> {
  const payload = {
    id: record.id,
    room_id: record.roomId,
    date: record.date,
    body_part: record.bodyPart ?? null,
    duration_min: record.durationMin ?? null,
    calories: record.calories ?? null,
    avg_heart_rate: record.avgHeartRate ?? null,
    exercises: record.exercises,
    memo: record.memo ?? null,
  };

  const { data, error } = await supabase
    .from("workout_gym_records")
    .upsert(payload, { onConflict: "id" })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "헬스 기록 저장에 실패했어요.");
  }
  return mapGym(data as GymRow);
}

export async function deleteGymRecord(id: string) {
  const { error } = await supabase
    .from("workout_gym_records")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
}

// =========================
// 웨이트 루틴 CRUD
// =========================
type RoutineRow = {
  id: string;
  room_id: string;
  name: string;
  body_part: string | null;
  exercises: GymExercise[] | null;
  created_at: string;
  updated_at: string;
};

function mapRoutine(row: RoutineRow): WorkoutRoutine {
  return {
    id: row.id,
    roomId: row.room_id,
    name: row.name,
    bodyPart: (row.body_part ?? undefined) as WorkoutRoutine["bodyPart"],
    exercises: row.exercises ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchWorkoutRoutines(
  roomId: string,
): Promise<WorkoutRoutine[]> {
  const { data, error } = await supabase
    .from("workout_routines")
    .select("*")
    .eq("room_id", roomId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return ((data || []) as RoutineRow[]).map(mapRoutine);
}

export async function upsertWorkoutRoutine(
  routine: Omit<WorkoutRoutine, "createdAt" | "updatedAt"> & {
    createdAt?: string;
    updatedAt?: string;
  },
): Promise<WorkoutRoutine> {
  const payload = {
    id: routine.id,
    room_id: routine.roomId,
    name: routine.name,
    body_part: routine.bodyPart ?? null,
    exercises: routine.exercises,
  };

  const { data, error } = await supabase
    .from("workout_routines")
    .upsert(payload, { onConflict: "id" })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "루틴 저장에 실패했어요.");
  }
  return mapRoutine(data as RoutineRow);
}

export async function deleteWorkoutRoutine(id: string) {
  const { error } = await supabase
    .from("workout_routines")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
}

// =========================
// 활동 기록 CRUD (자전거·테니스·등산 등)
// =========================
type ActivityRow = {
  id: string;
  room_id: string;
  date: string;
  activity_name: string;
  duration_min: number | null;
  calories: number | null;
  avg_heart_rate: number | null;
  memo: string | null;
  created_at: string;
  updated_at: string;
};

function mapActivity(row: ActivityRow): ActivityRecord {
  return {
    id: row.id,
    roomId: row.room_id,
    date: row.date,
    activityName: row.activity_name,
    durationMin: row.duration_min ?? undefined,
    calories: row.calories ?? undefined,
    avgHeartRate: row.avg_heart_rate ?? undefined,
    memo: row.memo ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchActivityRecords(
  roomId: string,
): Promise<ActivityRecord[]> {
  const { data, error } = await supabase
    .from("workout_activity_records")
    .select("*")
    .eq("room_id", roomId)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return ((data || []) as ActivityRow[]).map(mapActivity);
}

export async function upsertActivityRecord(
  record: Omit<ActivityRecord, "createdAt" | "updatedAt"> & {
    createdAt?: string;
    updatedAt?: string;
  },
): Promise<ActivityRecord> {
  const payload = {
    id: record.id,
    room_id: record.roomId,
    date: record.date,
    activity_name: record.activityName,
    duration_min: record.durationMin ?? null,
    calories: record.calories ?? null,
    avg_heart_rate: record.avgHeartRate ?? null,
    memo: record.memo ?? null,
  };

  const { data, error } = await supabase
    .from("workout_activity_records")
    .upsert(payload, { onConflict: "id" })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "활동 기록 저장에 실패했어요.");
  }
  return mapActivity(data as ActivityRow);
}

export async function deleteActivityRecord(id: string) {
  const { error } = await supabase
    .from("workout_activity_records")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
}

// =========================
// 유틸
// =========================
export function createWorkoutId(prefix: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}-${Date.now()}`;
}
