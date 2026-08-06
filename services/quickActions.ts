// /my 대시보드 위젯 우클릭 "빠른 등록"용 데이터 접근 모듈.
// 컴포넌트에서 supabase를 직접 부르지 않도록 habit·diet 쓰기 접근을 이곳에 모은다.
// (가계부·운동은 각 서비스 repository의 upsert 함수를 재사용한다)
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";

const DAY_FORMAT = "yyyy-MM-dd";

// 다이어트: 오늘 아침(공복) 몸무게만 기록/갱신. 다른 필드(식단·메모)는 건드리지 않는다.
export async function upsertTodayDietWeight(goalId: string, weight: string) {
  const today = format(new Date(), DAY_FORMAT);
  const { error } = await supabase.from("diet_logs").upsert(
    { goal_id: Number(goalId), date: today, weight_morning: weight },
    { onConflict: "goal_id, date" },
  );
  if (error) throw error;
}

export type QuickHabitItem = {
  id: number;
  title: string;
  done: boolean;
};

// 습관: 오늘 기준 체크 상태를 포함한 항목 목록
export async function fetchTodayHabitItems(
  goalId: string,
): Promise<QuickHabitItem[]> {
  const today = format(new Date(), DAY_FORMAT);

  const { data: items, error: itemsError } = await supabase
    .from("goal_items")
    .select("id, title")
    .eq("goal_id", goalId)
    .order("id");
  if (itemsError) throw itemsError;
  if (!items?.length) return [];

  const { data: logs, error: logsError } = await supabase
    .from("goal_logs")
    .select("item_id")
    .in(
      "item_id",
      items.map((item) => item.id),
    )
    .eq("completed_at", today);
  if (logsError) throw logsError;

  const doneIds = new Set((logs ?? []).map((log) => log.item_id));
  return items.map((item) => ({
    id: item.id,
    title: item.title,
    done: doneIds.has(item.id),
  }));
}

// 습관: 오늘 항목 체크/해제 (습관 페이지의 toggleComplete와 동일한 쓰기)
export async function setHabitItemToday(itemId: number, done: boolean) {
  const today = format(new Date(), DAY_FORMAT);
  if (done) {
    const { error } = await supabase
      .from("goal_logs")
      .insert({ item_id: itemId, completed_at: today });
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("goal_logs")
      .delete()
      .match({ item_id: itemId, completed_at: today });
    if (error) throw error;
  }
}
