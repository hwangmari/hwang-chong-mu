import { useState, useEffect, useCallback } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { supabase } from "@/lib/supabase";
import { useModal } from "@/components/common/ModalProvider";

export interface GoalItem {
  id: number;
  title: string;
  goal_id: number;
}

export function useMonthlyTracker(goalId: number) {
  const { openConfirm, openAlert } = useModal();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showWeekends, setShowWeekends] = useState(true);

  const [hoveredItemId, setHoveredItemId] = useState<number | null>(null);
  const [rawLogs, setRawLogs] = useState<
    { item_id: number; completed_at: string }[]
  >([]);

  const [items, setItems] = useState<GoalItem[]>([]);
  const [monthlyLogs, setMonthlyLogs] = useState<
    { date: string; count: number }[]
  >([]);
  const [dailyCompletedIds, setDailyCompletedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!goalId || isNaN(goalId)) return;
    const savedSetting = localStorage.getItem(`showWeekends_${goalId}`);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (savedSetting !== null) setShowWeekends(savedSetting === "true");
  }, [goalId]);

  const toggleWeekends = () => {
    if (!goalId || isNaN(goalId)) return;
    const nextValue = !showWeekends;
    setShowWeekends(nextValue);
    localStorage.setItem(`showWeekends_${goalId}`, String(nextValue));
  };

  const fetchGoalItems = useCallback(async () => {
    if (!goalId || isNaN(goalId)) return;
    const { data, error } = await supabase
      .from("goal_items")
      .select("*")
      .eq("goal_id", goalId)
      .order("id");
    if (error) {
      console.error("목표 항목 조회 실패:", error);
      return;
    }
    if (data) setItems(data);
  }, [goalId]);

  const fetchMonthlyLogs = useCallback(
    async (date: Date) => {
      if (!goalId || isNaN(goalId)) return;
      const start = format(startOfMonth(date), "yyyy-MM-dd");
      const end = format(endOfMonth(date), "yyyy-MM-dd");

      const { data: currentItems, error: itemsError } = await supabase
        .from("goal_items")
        .select("id")
        .eq("goal_id", goalId);
      if (itemsError) {
        console.error("월간 로그용 목표 항목 조회 실패:", itemsError);
        setMonthlyLogs([]);
        setRawLogs([]);
        return;
      }
      if (!currentItems?.length) {
        setMonthlyLogs([]);
        setRawLogs([]); // 초기화
        return;
      }

      const itemIds = currentItems.map((i) => i.id);
      const { data: logs, error: logsError } = await supabase
        .from("goal_logs")
        .select("item_id, completed_at")
        .in("item_id", itemIds)
        .gte("completed_at", start)
        .lte("completed_at", end);

      if (logsError) {
        console.error("월간 로그 조회 실패:", logsError);
        setMonthlyLogs([]);
        setRawLogs([]);
        return;
      }

      if (logs) {
        setRawLogs(logs); // ✅ 원본 로그 저장

        const counts: Record<string, number> = {};
        logs.forEach(
          (log) =>
            (counts[log.completed_at] = (counts[log.completed_at] || 0) + 1)
        );
        setMonthlyLogs(
          Object.entries(counts).map(([date, count]) => ({ date, count }))
        );
      }
    },
    [goalId]
  );

  const fetchDailyLogs = useCallback(
    async (date: Date) => {
      if (!goalId || isNaN(goalId)) return;
      const dateStr = format(date, "yyyy-MM-dd");
      const { data: currentItems, error: itemsError } = await supabase
        .from("goal_items")
        .select("id")
        .eq("goal_id", goalId);
      if (itemsError) {
        console.error("일간 로그용 목표 항목 조회 실패:", itemsError);
        setDailyCompletedIds([]);
        return;
      }
      if (!currentItems?.length) {
        setDailyCompletedIds([]);
        return;
      }

      const itemIds = currentItems.map((i) => i.id);
      const { data, error } = await supabase
        .from("goal_logs")
        .select("item_id")
        .in("item_id", itemIds)
        .eq("completed_at", dateStr);
      if (error) {
        console.error("일간 로그 조회 실패:", error);
        return;
      }
      if (data) setDailyCompletedIds(data.map((l) => l.item_id));
    },
    [goalId]
  );

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(true);
      await fetchGoalItems();
      if (!cancelled) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [fetchGoalItems]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMonthlyLogs(currentDate);
  }, [currentDate, fetchMonthlyLogs]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDailyLogs(selectedDate);
  }, [selectedDate, fetchDailyLogs]);

  const addItem = async (title: string) => {
    if (!title.trim()) return;
    const { error } = await supabase
      .from("goal_items")
      .insert({ goal_id: goalId, title });
    if (error) {
      console.error("목표 항목 추가 실패:", error);
      await openAlert("항목 추가에 실패했습니다. 다시 시도해주세요.");
      return;
    }
    fetchGoalItems();
  };

  const deleteItem = async (itemId: number) => {
    const isConfirmed = await openConfirm("정말 이 목표를 삭제하시겠습니까?");
    if (isConfirmed) {
      const { error } = await supabase
        .from("goal_items")
        .delete()
        .eq("id", itemId);
      if (error) {
        console.error("목표 항목 삭제 실패:", error);
        await openAlert("삭제에 실패했습니다. 다시 시도해주세요.");
        return;
      }
      await fetchGoalItems();
      fetchMonthlyLogs(currentDate);
      await openAlert("삭제되었습니다! 🗑️");
    }
  };

  const toggleComplete = async (itemId: number) => {
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const isDone = dailyCompletedIds.includes(itemId);

    if (isDone) {
      const { error } = await supabase
        .from("goal_logs")
        .delete()
        .match({ item_id: itemId, completed_at: dateStr });
      if (error) {
        console.error("완료 취소 실패:", error);
        await openAlert("완료 취소에 실패했습니다. 다시 시도해주세요.");
        return;
      }
      setDailyCompletedIds((prev) => prev.filter((id) => id !== itemId));
    } else {
      const { error } = await supabase
        .from("goal_logs")
        .insert({ item_id: itemId, completed_at: dateStr });
      if (error) {
        console.error("완료 처리 실패:", error);
        await openAlert("완료 처리에 실패했습니다. 다시 시도해주세요.");
        return;
      }
      setDailyCompletedIds((prev) => [...prev, itemId]);
    }
    fetchMonthlyLogs(currentDate);
  };

  return {
    state: {
      currentDate,
      selectedDate,
      showWeekends,
      items,
      monthlyLogs,
      dailyCompletedIds,
      hoveredItemId,
      rawLogs,
      loading,
    },
    actions: {
      setCurrentDate,
      setSelectedDate,
      toggleWeekends,
      addItem,
      deleteItem,
      toggleComplete,
      setHoveredItemId,
    },
  };
}
