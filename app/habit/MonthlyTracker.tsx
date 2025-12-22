"use client";

import { useState, useEffect, useCallback } from "react";
import styled from "styled-components";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isWeekend,
} from "date-fns";
import { supabase } from "@/lib/supabase";
import { useModal } from "@/components/common/ModalProvider";

// 🎨 농도 조절용 헬퍼 함수
const hexToRgba = (hex: string, alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

interface GoalItem {
  id: number;
  title: string;
  goal_id: number;
}

interface MonthlyTrackerProps {
  goalId: number;
  themeColor: string;
}

export default function MonthlyTracker({
  goalId,
  themeColor,
}: MonthlyTrackerProps) {
  const { openConfirm, openAlert } = useModal();

  // ✅ 초기값을 오늘 날짜로 설정 (이미 적용됨)
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showWeekends, setShowWeekends] = useState(true);

  const [items, setItems] = useState<GoalItem[]>([]);
  const [monthlyLogs, setMonthlyLogs] = useState<
    { date: string; count: number }[]
  >([]);
  const [dailyCompletedIds, setDailyCompletedIds] = useState<number[]>([]);
  const [newItemTitle, setNewItemTitle] = useState("");

  // ... (fetch 로직들은 기존과 동일) ...
  const fetchGoalItems = useCallback(async () => {
    const { data } = await supabase
      .from("goal_items")
      .select("*")
      .eq("goal_id", goalId)
      .order("id");
    if (data) setItems(data);
  }, [goalId]);

  const fetchMonthlyLogs = useCallback(
    async (date: Date) => {
      const start = format(startOfMonth(date), "yyyy-MM-dd");
      const end = format(endOfMonth(date), "yyyy-MM-dd");
      const { data: currentItems } = await supabase
        .from("goal_items")
        .select("id")
        .eq("goal_id", goalId);
      if (!currentItems || currentItems.length === 0) {
        setMonthlyLogs([]);
        return;
      }
      const itemIds = currentItems.map((i) => i.id);
      const { data: logs } = await supabase
        .from("goal_logs")
        .select("completed_at")
        .in("item_id", itemIds)
        .gte("completed_at", start)
        .lte("completed_at", end);
      if (logs) {
        const counts: Record<string, number> = {};
        logs.forEach((log) => {
          counts[log.completed_at] = (counts[log.completed_at] || 0) + 1;
        });
        setMonthlyLogs(
          Object.entries(counts).map(([date, count]) => ({ date, count }))
        );
      }
    },
    [goalId]
  );

  const fetchDailyLogs = useCallback(
    async (date: Date) => {
      const dateStr = format(date, "yyyy-MM-dd");
      const { data: currentItems } = await supabase
        .from("goal_items")
        .select("id")
        .eq("goal_id", goalId);
      if (!currentItems || currentItems.length === 0) {
        setDailyCompletedIds([]);
        return;
      }
      const itemIds = currentItems.map((i) => i.id);
      const { data } = await supabase
        .from("goal_logs")
        .select("item_id")
        .in("item_id", itemIds)
        .eq("completed_at", dateStr);
      if (data) setDailyCompletedIds(data.map((l) => l.item_id));
    },
    [goalId]
  );

  useEffect(() => {
    fetchGoalItems();
  }, [fetchGoalItems]);
  useEffect(() => {
    fetchMonthlyLogs(currentDate);
  }, [currentDate, fetchMonthlyLogs]);
  useEffect(() => {
    fetchDailyLogs(selectedDate);
  }, [selectedDate, fetchDailyLogs]);

  // ... (투두 추가/삭제/체크 로직 유지) ...
  const addHabitItem = async () => {
    if (!newItemTitle.trim()) return;
    await supabase
      .from("goal_items")
      .insert({ goal_id: goalId, title: newItemTitle });
    setNewItemTitle("");
    fetchGoalItems();
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === "Enter") addHabitItem();
  };
  const deleteHabitItem = async (itemId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const isConfirmed = await openConfirm("정말 이 목표를 삭제하시겠습니까?");
    if (isConfirmed) {
      await supabase.from("goal_items").delete().eq("id", itemId);
      await fetchGoalItems();
      fetchMonthlyLogs(currentDate);
      await openAlert("삭제되었습니다! 🗑️");
    }
  };
  const toggleHabit = async (itemId: number) => {
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const isDone = dailyCompletedIds.includes(itemId);
    if (isDone) {
      await supabase
        .from("goal_logs")
        .delete()
        .match({ item_id: itemId, completed_at: dateStr });
      setDailyCompletedIds((prev) => prev.filter((id) => id !== itemId));
      updateLocalLogCount(dateStr, -1);
    } else {
      await supabase
        .from("goal_logs")
        .insert({ item_id: itemId, completed_at: dateStr });
      setDailyCompletedIds((prev) => [...prev, itemId]);
      updateLocalLogCount(dateStr, 1);
    }
  };
  const updateLocalLogCount = (dateStr: string, delta: number) => {
    setMonthlyLogs((prev) => {
      const existing = prev.find((l) => l.date === dateStr);
      if (existing)
        return prev.map((l) =>
          l.date === dateStr ? { ...l, count: l.count + delta } : l
        );
      return [...prev, { date: dateStr, count: 1 }];
    });
  };
  const getIntensityColor = (dateStr: string) => {
    const log = monthlyLogs.find((l) => l.date === dateStr);
    const count = log ? log.count : 0;
    const total = items.length || 1;
    const ratio = count / total;
    if (ratio === 0) return "#f3f4f6";
    if (ratio <= 0.3) return hexToRgba(themeColor, 0.3);
    if (ratio <= 0.6) return hexToRgba(themeColor, 0.6);
    if (ratio < 1) return hexToRgba(themeColor, 0.85);
    return themeColor;
  };

  const monthStart = startOfMonth(currentDate);
  const calendarDays = eachDayOfInterval({
    start: startOfWeek(monthStart),
    end: endOfWeek(endOfMonth(monthStart)),
  });

  const filteredDays = showWeekends
    ? calendarDays
    : calendarDays.filter((day) => !isWeekend(day));
  const weekDays = ["일", "월", "화", "수", "목", "금", "토"];
  const filteredWeekDays = showWeekends
    ? weekDays
    : weekDays.filter((_, i) => i !== 0 && i !== 6);

  // ✅ 오늘 날짜 계산 (렌더링 시점 기준)
  const today = new Date();

  return (
    <StContainer>
      <StHeaderWrapper>
        <StHeader>
          <StNavButton
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
          >
            ◀
          </StNavButton>
          <StMonthTitle>{format(currentDate, "yyyy년 M월")}</StMonthTitle>
          <StNavButton
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
          >
            ▶
          </StNavButton>
        </StHeader>
        <StWeekendToggle
          onClick={() => setShowWeekends(!showWeekends)}
          $active={showWeekends}
          $color={themeColor}
        >
          {showWeekends ? "주말 끄기" : "주말 보기"}
        </StWeekendToggle>
      </StHeaderWrapper>

      <StCalendarGrid $columns={showWeekends ? 7 : 5}>
        {filteredWeekDays.map((day) => (
          <StWeekDay key={day}>{day}</StWeekDay>
        ))}
        {filteredDays.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const isSelected = isSameDay(day, selectedDate);
          // ✅ 오늘인지 확인
          const isToday = isSameDay(day, today);

          return (
            <StDateCell
              key={dateStr}
              $bgColor={getIntensityColor(dateStr)}
              $isCurrentMonth={isSameMonth(day, monthStart)}
              $isSelected={isSelected}
              $borderColor={themeColor}
              onClick={() => setSelectedDate(day)}
            >
              {/* ✅ 오늘 날짜면 굵게 표시 */}
              <StDateText $isToday={isToday}>{format(day, "d")}</StDateText>

              {/* ✅ 오늘 날짜면 하단에 점(Dot) 표시 */}
              {isToday && <StTodayDot $color={themeColor} />}
            </StDateCell>
          );
        })}
      </StCalendarGrid>

      <StDailySection>
        <StDailyTitle>
          <span>📅 {format(selectedDate, "M월 d일")}</span>
          <StProgressBadge $color={themeColor}>
            {Math.round((dailyCompletedIds.length / (items.length || 1)) * 100)}
            %
          </StProgressBadge>
        </StDailyTitle>

        <StTodoList>
          {items.map((item) => (
            <StTodoItem
              key={item.id}
              onClick={() => toggleHabit(item.id)}
              $done={dailyCompletedIds.includes(item.id)}
              $activeColor={hexToRgba(themeColor, 0.15)}
            >
              <StCheckCircle
                $done={dailyCompletedIds.includes(item.id)}
                $color={themeColor}
              >
                {dailyCompletedIds.includes(item.id) && "✔"}
              </StCheckCircle>
              <StTodoText
                $done={dailyCompletedIds.includes(item.id)}
                $color={themeColor}
              >
                {item.title}
              </StTodoText>
              <StDeleteButton onClick={(e) => deleteHabitItem(item.id, e)}>
                🗑️
              </StDeleteButton>
            </StTodoItem>
          ))}
          <StInputWrapper>
            <StInput
              placeholder="+ 새로운 목표 추가"
              value={newItemTitle}
              onChange={(e) => setNewItemTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              $focusColor={themeColor}
            />
            <StAddButton
              onClick={addHabitItem}
              disabled={!newItemTitle.trim()}
              $bgColor={themeColor}
            >
              추가
            </StAddButton>
          </StInputWrapper>
        </StTodoList>
      </StDailySection>
    </StContainer>
  );
}

// ✨ 스타일 정의

const StContainer = styled.div`
  width: 100%;
  max-width: 400px;
  background: white;
  border-radius: 24px;
  padding: 1.5rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
`;
const StHeaderWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;
const StHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;
const StMonthTitle = styled.h2`
  font-size: 1.15rem;
  font-weight: 800;
  color: #1f2937;
  min-width: 100px;
  text-align: center;
`;
const StWeekendToggle = styled.button<{ $active: boolean; $color: string }>`
  background: ${({ $active, $color }) => ($active ? $color : "transparent")};
  color: ${({ $active, $color }) => ($active ? "white" : "#9ca3af")};
  border: 1px solid
    ${({ $active, $color }) => ($active ? "transparent" : "#e5e7eb")};
  padding: 6px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    color: ${({ $active, $color }) => ($active ? "white" : $color)};
    border-color: ${({ $color }) => $color};
  }
`;
const StNavButton = styled.button`
  background: none;
  border: none;
  font-size: 1.2rem;
  color: #9ca3af;
  cursor: pointer;
  padding: 0.2rem;
  &:hover {
    color: #4b5563;
  }
`;
const StCalendarGrid = styled.div<{ $columns: number }>`
  display: grid;
  grid-template-columns: repeat(${({ $columns }) => $columns}, 1fr);
  gap: 8px;
  margin-bottom: 2rem;
  transition: all 0.3s ease;
`;
const StWeekDay = styled.div`
  text-align: center;
  font-size: 0.8rem;
  font-weight: 600;
  color: #9ca3af;
  margin-bottom: 0.5rem;
`;

// ✅ 날짜 셀 스타일 수정 (Dot 표시를 위해 flex-direction 변경)
const StDateCell = styled.div<{
  $bgColor: string;
  $isCurrentMonth: boolean;
  $isSelected: boolean;
  $borderColor: string;
}>`
  aspect-ratio: 1;
  background-color: ${({ $bgColor }) => $bgColor};
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 2px; /* 텍스트와 점 사이 간격 */
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: ${({ $isCurrentMonth }) => ($isCurrentMonth ? 1 : 0.3)};
  border: 2px solid
    ${({ $isSelected, $borderColor }) =>
      $isSelected ? $borderColor : "transparent"};
  transition: all 0.2s;
  &:hover {
    transform: scale(1.1);
  }
`;

// ✅ 오늘 날짜 텍스트 (Bold 처리)
const StDateText = styled.span<{ $isToday?: boolean }>`
  font-size: 0.85rem;
  font-weight: ${({ $isToday }) => ($isToday ? "900" : "600")};
  color: #374151;
`;

// ✅ 오늘 표시용 점 (Dot)
const StTodayDot = styled.div<{ $color: string }>`
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background-color: ${({ $color }) => $color};
  opacity: 0.8;
`;

const StDailySection = styled.div`
  border-top: 1px solid #f3f4f6;
  padding-top: 1.5rem;
`;
const StDailyTitle = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  font-weight: 700;
  color: #374151;
`;
const StProgressBadge = styled.span<{ $color: string }>`
  background: #f8fafc;
  color: ${({ $color }) => $color};
  border: 1px solid ${({ $color }) => $color}40;
  font-size: 0.75rem;
  padding: 4px 8px;
  border-radius: 12px;
  font-weight: 700;
`;
const StTodoList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
`;
const StTodoItem = styled.div<{ $done: boolean; $activeColor: string }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: ${({ $done, $activeColor }) =>
    $done ? $activeColor : "#f9fafb"};
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    filter: brightness(0.95);
  }
`;
const StCheckCircle = styled.div<{ $done: boolean; $color: string }>`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid ${({ $done, $color }) => ($done ? $color : "#d1d5db")};
  background: ${({ $done, $color }) => ($done ? $color : "transparent")};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
`;
const StTodoText = styled.span<{ $done: boolean; $color: string }>`
  font-weight: 500;
  font-size: 0.95rem;
  color: ${({ $done, $color }) => ($done ? $color : "#4b5563")};
  text-decoration: ${({ $done }) => ($done ? "line-through" : "none")};
  flex: 1;
`;
const StDeleteButton = styled.button`
  background: none;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  opacity: 0.3;
  padding: 4px;
  transition: opacity 0.2s;
  &:hover {
    opacity: 1;
  }
`;
const StInputWrapper = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 0.5rem;
`;
const StInput = styled.input<{ $focusColor: string }>`
  flex: 1;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  font-size: 0.9rem;
  outline: none;
  &:focus {
    border-color: ${({ $focusColor }) => $focusColor};
  }
`;
const StAddButton = styled.button<{ $bgColor: string }>`
  background: ${({ $bgColor }) => $bgColor};
  color: white;
  border: none;
  border-radius: 12px;
  padding: 0 1rem;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: opacity 0.2s;
  &:hover {
    opacity: 0.9;
  }
  &:disabled {
    background: #cbd5e1;
    cursor: not-allowed;
  }
`;
