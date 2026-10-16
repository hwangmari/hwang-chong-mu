"use client";

import { supabase } from "@/lib/supabase";
import {
  createWorkoutId,
  deleteActivityRecord,
  fetchActivityRecords,
  upsertActivityRecord,
} from "@/app/workout/repository";
import type { ActivityRecord } from "@/app/workout/types";
import {
  lessonMinutes,
  lessonPartsLabel,
  type LessonTip,
  type TennisLesson,
} from "@/data/tennisLessons";

// 저장된 일지 한 건. 자료 모양(TennisLesson)은 data/tennisLessons.ts 가 단일 출처다.
export type LessonRecord = TennisLesson & {
  id: string;
  roomId: string;
  /** 운동 기록(활동)에 함께 저장된 "테니스" 한 줄. 운동 기록 쪽에서 지웠으면 null */
  activityId: string | null;
  /** 팁을 마지막으로 채운 때 */
  tipsAt: string | null;
  /** 메모(raw)를 마지막으로 고친 때 — tipsAt 보다 늦으면 팁을 다시 정리해야 한다 */
  rawAt: string;
};

/** 운동 기록에 들어가는 종목 이름 */
export const LESSON_ACTIVITY_NAME = "테니스";

type LessonRow = {
  id: string;
  room_id: string;
  date: string;
  parts: TennisLesson["parts"] | null;
  raw: string | null;
  tips: LessonTip[] | null;
  tips_at: string | null;
  activity_id: string | null;
  raw_at: string;
};

function mapLesson(row: LessonRow): LessonRecord {
  return {
    id: row.id,
    roomId: row.room_id,
    date: row.date,
    parts: row.parts ?? [],
    raw: row.raw ?? "",
    tips: row.tips ?? [],
    activityId: row.activity_id,
    tipsAt: row.tips_at,
    rawAt: row.raw_at,
  };
}

/** 팁이 아직 없거나, 팁을 채운 뒤 메모를 고쳐서 다시 정리해야 하는지 */
export function needsTips(lesson: LessonRecord): boolean {
  if (lesson.tips.length === 0) return true;
  if (!lesson.tipsAt) return false;
  return new Date(lesson.rawAt).getTime() > new Date(lesson.tipsAt).getTime();
}

export async function fetchLessons(roomId: string): Promise<LessonRecord[]> {
  const { data, error } = await supabase
    .from("tennis_lessons")
    .select("id, room_id, date, parts, raw, tips, tips_at, activity_id, raw_at")
    .eq("room_id", roomId)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return ((data || []) as LessonRow[]).map(mapLesson);
}

/**
 * 같은 날 이미 적어 둔 "테니스" 활동 중, 다른 일지와 아직 이어지지 않은 것.
 * 일지를 처음 저장할 때 새 줄을 만들지, 이 줄에 이어 붙일지 묻는 데 쓴다.
 */
export async function findUnlinkedTennisActivity(
  roomId: string,
  date: string,
  lessons: LessonRecord[],
): Promise<ActivityRecord | null> {
  const linked = new Set(lessons.map((l) => l.activityId).filter(Boolean));
  const activities = await fetchActivityRecords(roomId);
  return (
    activities.find(
      (a) =>
        a.date === date &&
        a.activityName.includes(LESSON_ACTIVITY_NAME) &&
        !linked.has(a.id),
    ) ?? null
  );
}

type SaveInput = {
  /** 고칠 때만 */
  id?: string;
  roomId: string;
  date: string;
  parts: TennisLesson["parts"];
  raw: string;
  /** 처음 저장(가져오기)할 때만 넘긴다. 평소엔 팁을 화면에서 건드리지 않는다 */
  tips?: LessonTip[];
  /** 이어 붙일 운동 기록 줄 id (기존 일지의 것 또는 같은 날 이미 있던 테니스 활동) */
  activityId?: string | null;
};

/**
 * 일지를 저장하고, 운동 기록의 "테니스 N분" 한 줄을 같은 내용으로 맞춘다.
 * 순서: 활동 줄 저장 → 일지 저장. 일지 저장이 실패하면 방금 새로 만든 활동 줄은 지운다.
 */
export async function saveLesson(input: SaveInput): Promise<LessonRecord> {
  const lessonLike = { date: input.date, parts: input.parts, raw: input.raw, tips: [] };
  // 이어 붙일 줄이 운동 기록 쪽에서 지워졌으면 새로 만든다
  const existing = input.activityId
    ? ((await fetchActivityRecords(input.roomId)).find((a) => a.id === input.activityId) ?? null)
    : null;
  const isNewActivity = !existing;
  const activityId = existing?.id ?? createWorkoutId("activity");

  await upsertActivityRecord({
    id: activityId,
    roomId: input.roomId,
    date: input.date,
    activityName: LESSON_ACTIVITY_NAME,
    durationMin: lessonMinutes(lessonLike) || undefined,
    // 이어 붙인 줄에 적어 둔 칼로리·심박은 그대로 둔다
    calories: existing?.calories,
    avgHeartRate: existing?.avgHeartRate,
    memo: `${lessonPartsLabel(lessonLike)} · 레슨 일지`,
  });

  const payload: Record<string, unknown> = {
    room_id: input.roomId,
    date: input.date,
    parts: input.parts,
    raw: input.raw,
    activity_id: activityId,
  };
  if (input.id) payload.id = input.id;
  if (input.tips) {
    payload.tips = input.tips;
    if (input.tips.length > 0) payload.tips_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("tennis_lessons")
    .upsert(payload, { onConflict: "id" })
    .select("id, room_id, date, parts, raw, tips, tips_at, activity_id, raw_at")
    .single();

  if (error || !data) {
    if (isNewActivity) await deleteActivityRecord(activityId).catch(() => {});
    throw new Error(error?.message || "레슨 일지 저장에 실패했어요.");
  }
  return mapLesson(data as LessonRow);
}

/** 일지와, 이어진 운동 기록 줄을 함께 지운다 */
export async function deleteLesson(lesson: LessonRecord) {
  const { error } = await supabase
    .from("tennis_lessons")
    .delete()
    .eq("id", lesson.id);
  if (error) throw new Error(error.message);
  if (lesson.activityId) await deleteActivityRecord(lesson.activityId);
}
