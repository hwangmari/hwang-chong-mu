// 통합 홈 대시보드 위젯용 요약 데이터 서비스.
// 컴포넌트에서 supabase를 직접 부르지 않도록(no-restricted-imports) 데이터 접근을 이곳에 모은다.
// 가계부·운동은 각 서비스 repository를 재사용하므로 여기서는 habit·diet만 다룬다.
import { format, subDays } from "date-fns";
import { supabase } from "@/lib/supabase";

const DAY_FORMAT = "yyyy-MM-dd";

export type HabitTodaySummary = {
  done: number;
  total: number;
  // 연속 달성일(스트릭): 하루의 모든 항목을 완료한 날이 오늘(또는 어제)부터 며칠 이어졌는지
  streak: number;
};

// 습관: 오늘 완료 항목 수 / 전체 항목 수 + 연속 달성일. 항목이 없으면 null. 쿼리 에러는 throw.
export async function fetchHabitTodaySummary(
  goalId: string,
): Promise<HabitTodaySummary | null> {
  const today = format(new Date(), DAY_FORMAT);

  const { data: items, error: itemsError } = await supabase
    .from("goal_items")
    .select("id")
    .eq("goal_id", goalId);
  if (itemsError) throw itemsError;

  const total = items?.length ?? 0;
  if (total === 0) return null;

  const itemIds = items!.map((item) => item.id);

  // 최근 60일 로그로 오늘 완료수 + 연속 달성일을 계산
  const since = format(subDays(new Date(), 60), DAY_FORMAT);
  const { data: logs, error: logsError } = await supabase
    .from("goal_logs")
    .select("item_id, completed_at")
    .in("item_id", itemIds)
    .gte("completed_at", since);
  if (logsError) throw logsError;

  // 날짜별 완료된 항목 id 집합
  const perDay = new Map<string, Set<number>>();
  for (const log of logs ?? []) {
    const set = perDay.get(log.completed_at) ?? new Set<number>();
    set.add(log.item_id);
    perDay.set(log.completed_at, set);
  }

  const done = perDay.get(today)?.size ?? 0;

  // 하루의 모든 항목을 완료(distinct >= total)했으면 "달성한 날".
  // 오늘이 아직 미완이면 어제부터 카운트(오늘 안 빠뜨려도 스트릭 유지).
  const isComplete = (dateStr: string) => (perDay.get(dateStr)?.size ?? 0) >= total;
  let streak = 0;
  let cursor = new Date();
  if (!isComplete(today)) cursor = subDays(cursor, 1);
  while (isComplete(format(cursor, DAY_FORMAT))) {
    streak += 1;
    cursor = subDays(cursor, 1);
  }

  return { done, total, streak };
}

export type DietProgressSummary = {
  // 시작 체중 대비 감량(kg). 양수=감량, 음수=증가. 기록 1개면 0.
  lostKg: number;
  // 기록이 2개 이상이라 감량을 말할 수 있는 상태인지
  hasProgress: boolean;
  // 목표 체중까지 남은 kg(양수). 목표 없음/이미 도달이면 null. (절대 체중은 노출하지 않음)
  remainingToTarget: number | null;
  latestDate: string;
};

// 다이어트: 절대 체중 대신 "감량 정도"를 보여준다. 기록이 없으면 null. 쿼리 에러는 throw.
export async function fetchDietProgressSummary(
  goalId: string,
): Promise<DietProgressSummary | null> {
  const { data, error } = await supabase
    .from("diet_logs")
    .select("date, weight_morning, weight_lunch, weight_dinner")
    .eq("goal_id", goalId)
    .order("date", { ascending: true });
  if (error) throw error;

  const rows = (data ?? []) as {
    date: string;
    weight_morning: string | null;
    weight_lunch: string | null;
    weight_dinner: string | null;
  }[];

  // 하루 대표 체중: morning → dinner → lunch 순으로 첫 유효값
  const parseRow = (row: (typeof rows)[number]): number | null => {
    const raw = row.weight_morning || row.weight_dinner || row.weight_lunch || "";
    const value = parseFloat(raw);
    return Number.isNaN(value) ? null : value;
  };

  const weighed = rows
    .map((row) => ({ date: row.date, weight: parseRow(row) }))
    .filter((entry): entry is { date: string; weight: number } => entry.weight !== null);

  if (weighed.length === 0) return null;

  const startWeight = weighed[0].weight;
  const latest = weighed[weighed.length - 1];
  const lostKg = startWeight - latest.weight; // 양수 = 감량

  // 목표 체중(있으면 남은 감량량만 계산 — 절대 체중은 반환하지 않음)
  let remainingToTarget: number | null = null;
  const { data: goal } = await supabase
    .from("diet_goals")
    .select("target_weight")
    .eq("id", goalId)
    .single();
  const target =
    goal?.target_weight != null ? Number(goal.target_weight) : null;
  if (target != null && !Number.isNaN(target) && latest.weight > target) {
    remainingToTarget = latest.weight - target;
  }

  return {
    lostKg,
    hasProgress: weighed.length >= 2,
    remainingToTarget,
    latestDate: latest.date,
  };
}

// 정산방(calc): 계정에 등록된 라벨이 비었거나 uuid일 때 실제 방 이름으로 보여주기 위한 조회.
// (약속에서 파생된 방이면 room_name에 그 이름이 들어있다)
export async function fetchCalcRoomNames(
  roomIds: string[],
): Promise<Record<string, string>> {
  if (roomIds.length === 0) return {};
  const { data, error } = await supabase
    .from("calc_rooms")
    .select("id, room_name")
    .in("id", roomIds);
  if (error) throw error;

  const names: Record<string, string> = {};
  for (const row of (data ?? []) as { id: string; room_name: string | null }[]) {
    if (row.room_name) names[row.id] = row.room_name;
  }
  return names;
}
