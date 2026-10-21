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

// 일지는 황총무 통합 계정에 쌓인다. 모든 읽기·쓰기는 /api/lesson 서버 라우트를 거친다(세션 쿠키로 사용자 확정).
// 운동 기록(workout_activity_records)의 "테니스 N분" 한 줄은 운동방이 있을 때만 여기서 함께 맞춘다.

// 저장된 일지 한 건. 자료 모양(TennisLesson)은 data/tennisLessons.ts 가 단일 출처다.
export type LessonRecord = TennisLesson & {
  id: string;
  /** 운동 기록(활동)에 함께 저장된 "테니스" 한 줄. 운동방이 없거나 운동 기록 쪽에서 지웠으면 null */
  activityId: string | null;
  /** 팁을 마지막으로 채운 때 */
  tipsAt: string | null;
  /** 메모(raw)를 마지막으로 고친 때 — tipsAt 보다 늦으면 팁을 다시 정리해야 한다 */
  rawAt: string;
  /** 운동방 시절 일지(tennis_lessons)에서 옮겨 온 경우 그 줄의 id */
  sourceId: string | null;
};

/** 운동 기록에 들어가는 종목 이름 */
export const LESSON_ACTIVITY_NAME = "테니스";

/** 저장 공간(표·함수)이 아직 없을 때 던지는 메시지 — 화면이 어떤 SQL 을 실행하라고 안내한다 */
export const LESSON_STORE_MISSING = "tennis_lesson_entries missing";

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      credentials: "same-origin",
      cache: "no-store",
      headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
    });
  } catch {
    throw new Error("연결이 끊겼어요. 인터넷 상태를 확인하고 다시 눌러 주세요.");
  }
  const payload = await res.json().catch(() => null);
  if (!res.ok) {
    if (payload?.missing) throw new Error(LESSON_STORE_MISSING);
    throw new Error(payload?.error ?? "요청이 실패했어요.");
  }
  return payload as T;
}

function normalize(lesson: LessonRecord): LessonRecord {
  return {
    ...lesson,
    parts: lesson.parts ?? [],
    raw: lesson.raw ?? "",
    tips: lesson.tips ?? [],
    activityId: lesson.activityId ?? null,
    tipsAt: lesson.tipsAt ?? null,
    sourceId: lesson.sourceId ?? null,
  };
}

/** 팁이 아직 없거나, 팁을 채운 뒤 메모를 고쳐서 다시 정리해야 하는지 */
export function needsTips(lesson: LessonRecord): boolean {
  if (lesson.tips.length === 0) return true;
  if (!lesson.tipsAt) return false;
  return new Date(lesson.rawAt).getTime() > new Date(lesson.tipsAt).getTime();
}

/** 내 일지 전체 (날짜 내림차순). 로그아웃 상태면 빈 목록 */
export async function fetchLessons(): Promise<LessonRecord[]> {
  const data = await api<{ lessons: LessonRecord[] }>("/api/lesson");
  return (data.lessons ?? []).map(normalize);
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
  /** 운동방이 있을 때만. 없으면 운동 기록은 건드리지 않고 activityId 는 null 로 저장한다 */
  roomId?: string | null;
  date: string;
  parts: TennisLesson["parts"];
  raw: string;
  /** 처음 저장(가져오기)할 때만 넘긴다. 평소엔 팁을 화면에서 건드리지 않는다 */
  tips?: LessonTip[];
  /** 이어 붙일 운동 기록 줄 id (기존 일지의 것 또는 같은 날 이미 있던 테니스 활동) */
  activityId?: string | null;
};

/**
 * 일지를 저장하고, 운동방이 있으면 운동 기록의 "테니스 N분" 한 줄을 같은 내용으로 맞춘다.
 * 순서: 활동 줄 저장 → 일지 저장. 일지 저장이 실패하면 방금 새로 만든 활동 줄은 지운다.
 */
export async function saveLesson(input: SaveInput): Promise<LessonRecord> {
  let activityId: string | null = null;
  let isNewActivity = false;

  if (input.roomId) {
    const lessonLike = { date: input.date, parts: input.parts, raw: input.raw, tips: [] };
    // 이어 붙일 줄이 운동 기록 쪽에서 지워졌으면 새로 만든다
    const existing = input.activityId
      ? ((await fetchActivityRecords(input.roomId)).find((a) => a.id === input.activityId) ?? null)
      : null;
    isNewActivity = !existing;
    activityId = existing?.id ?? createWorkoutId("activity");

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
  } else {
    // 운동방이 없으면 이미 이어져 있던 줄 id 만 그대로 둔다 (운동 기록은 건드리지 않음)
    activityId = input.activityId ?? null;
  }

  try {
    const data = await api<{ lesson: LessonRecord }>("/api/lesson", {
      method: "POST",
      body: JSON.stringify({
        id: input.id ?? null,
        date: input.date,
        parts: input.parts,
        raw: input.raw,
        tips: input.tips ?? null,
        activityId,
      }),
    });
    return normalize(data.lesson);
  } catch (e) {
    if (isNewActivity && activityId) await deleteActivityRecord(activityId).catch(() => {});
    throw e;
  }
}

/** 일지를 지우고, 운동방이 있으면 이어진 운동 기록 줄도 함께 지운다 */
export async function deleteLesson(lesson: LessonRecord, roomId?: string | null) {
  await api<{ ok: true }>(`/api/lesson?id=${encodeURIComponent(lesson.id)}`, {
    method: "DELETE",
  });
  if (!roomId || !lesson.activityId) return;
  // 이어진 줄이 지금 운동방의 것일 때만 지운다 (다른 방 기록을 건드리지 않게)
  const mine = (await fetchActivityRecords(roomId)).some((a) => a.id === lesson.activityId);
  if (mine) await deleteActivityRecord(lesson.activityId);
}

/**
 * 운동방에 적어 둔 예전 일지(tennis_lessons) 중 아직 내 계정으로 옮기지 않은 개수.
 * 예전 표는 anon 에 열려 있어 id 만 읽어 내 일지의 sourceId 와 비교한다. 읽지 못하면 null(모름).
 */
export async function countUnmovedRoomLessons(
  roomId: string,
  lessons: LessonRecord[],
): Promise<number | null> {
  const { data, error } = await supabase
    .from("tennis_lessons")
    .select("id")
    .eq("room_id", roomId);
  if (error || !data) return null;
  const moved = new Set(lessons.map((l) => l.sourceId).filter(Boolean));
  return (data as { id: string }[]).filter((row) => !moved.has(row.id)).length;
}

/** 운동방의 예전 일지를 내 계정으로 옮긴다 → 옮긴 개수 */
export async function importRoomLessons(roomId: string): Promise<number> {
  const data = await api<{ count: number }>("/api/lesson/import", {
    method: "POST",
    body: JSON.stringify({ roomId }),
  });
  return data.count ?? 0;
}
