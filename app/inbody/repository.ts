"use client";

import { supabase } from "@/lib/supabase";
import type { InBodyRecord, InBodySession } from "./types";

type RoomRow = {
  id: string;
  name: string;
  password: string;
  created_at: string;
};

type RecordRow = {
  id: string;
  room_id: string;
  date: string;
  weight: number | string | null;
  skeletal_muscle: number | string | null;
  body_fat_mass: number | string | null;
  bmr: number | null;
  bmi: number | string | null;
  body_fat_pct: number | string | null;
  abdominal_fat_ratio: number | string | null;
  visceral_fat_level: number | null;
  memo: string | null;
  created_at: string;
  updated_at: string;
};

function toNumber(v: number | string | null): number | undefined {
  if (v === null) return undefined;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function mapRow(row: RecordRow): InBodyRecord {
  return {
    id: row.id,
    roomId: row.room_id,
    date: row.date,
    weight: toNumber(row.weight),
    skeletalMuscle: toNumber(row.skeletal_muscle),
    bodyFatMass: toNumber(row.body_fat_mass),
    bmr: row.bmr ?? undefined,
    bmi: toNumber(row.bmi),
    bodyFatPct: toNumber(row.body_fat_pct),
    abdominalFatRatio: toNumber(row.abdominal_fat_ratio),
    visceralFatLevel: row.visceral_fat_level ?? undefined,
    memo: row.memo ?? undefined,
    createdAt: row.created_at,
  };
}

// =========================
// 방 (room)
// =========================
export async function createInBodyRoom(
  name: string,
  password: string,
): Promise<InBodySession> {
  if (!name.trim() || !password.trim()) {
    throw new Error("방 이름과 비밀번호를 입력해 주세요.");
  }

  const { data, error } = await supabase
    .from("inbody_rooms")
    .insert({ name: name.trim(), password: password.trim() })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "방 생성에 실패했어요.");
  }

  const row = data as RoomRow;
  return {
    roomId: row.id,
    roomName: row.name,
    password: row.password,
  };
}

export async function joinInBodyRoom(
  roomName: string,
  password: string,
): Promise<InBodySession> {
  if (!roomName.trim() || !password.trim()) {
    throw new Error("방 이름과 비밀번호를 입력해 주세요.");
  }

  const { data, error } = await supabase
    .from("inbody_rooms")
    .select("*")
    .eq("name", roomName.trim())
    .eq("password", password.trim())
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  const row = (data?.[0] as RoomRow | undefined) ?? null;
  if (!row) {
    throw new Error("방 이름 또는 비밀번호가 맞지 않아요.");
  }

  return {
    roomId: row.id,
    roomName: row.name,
    password: row.password,
  };
}

// =========================
// 기록 CRUD
// =========================
export async function fetchInBodyRecords(
  roomId: string,
): Promise<InBodyRecord[]> {
  const { data, error } = await supabase
    .from("inbody_records")
    .select("*")
    .eq("room_id", roomId)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapRow(row as RecordRow));
}

export async function upsertInBodyRecord(record: InBodyRecord): Promise<void> {
  const payload = {
    id: record.id,
    room_id: record.roomId,
    date: record.date,
    weight: record.weight ?? null,
    skeletal_muscle: record.skeletalMuscle ?? null,
    body_fat_mass: record.bodyFatMass ?? null,
    bmr: record.bmr ?? null,
    bmi: record.bmi ?? null,
    body_fat_pct: record.bodyFatPct ?? null,
    abdominal_fat_ratio: record.abdominalFatRatio ?? null,
    visceral_fat_level: record.visceralFatLevel ?? null,
    memo: record.memo ?? null,
  };
  const { error } = await supabase
    .from("inbody_records")
    .upsert(payload, { onConflict: "id" });
  if (error) throw new Error(error.message);
}

export async function deleteInBodyRecord(id: string): Promise<void> {
  const { error } = await supabase.from("inbody_records").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
