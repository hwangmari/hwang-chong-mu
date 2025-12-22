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
} from "date-fns";
import { supabase } from "@/lib/supabase";

interface GoalItem {
  id: number;
  title: string;
  goal_id: number;
}

interface MonthlyTrackerProps {
  goalId: number;
}

export default function MonthlyTracker({ goalId }: MonthlyTrackerProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [items, setItems] = useState<GoalItem[]>([]);
  const [monthlyLogs, setMonthlyLogs] = useState<
    { date: string; count: number }[]
  >([]);
  const [dailyCompletedIds, setDailyCompletedIds] = useState<number[]>([]);

  const [newItemTitle, setNewItemTitle] = useState("");

  // 1. 투두 리스트 가져오기
  const fetchGoalItems = useCallback(async () => {
    const { data } = await supabase
      .from("goal_items")
      .select("*")
      .eq("goal_id", goalId)
      .order("id");

    if (data) setItems(data);
  }, [goalId]);

  // 2. 월간 로그 가져오기
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

  // 3. 일간 로그 가져오기
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

  // 4. 투두 추가하기 (엔터 중복 방지 적용)
  const addHabitItem = async () => {
    if (!newItemTitle.trim()) return;

    await supabase.from("goal_items").insert({
      goal_id: goalId,
      title: newItemTitle,
    });

    setNewItemTitle("");
    fetchGoalItems();
  };

  // ✅ 4-1. 엔터 키 핸들러 (한글 IME 중복 입력 방지)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return; // 한글 조합 중이면 무시
    if (e.key === "Enter") {
      addHabitItem();
    }
  };

  // ✅ 5. 투두 삭제하기 (새로 추가됨!)
  const deleteHabitItem = async (itemId: number, e: React.MouseEvent) => {
    e.stopPropagation(); // 부모의 클릭 이벤트(체크 토글) 방지
    if (!confirm("정말 이 목표를 삭제하시겠습니까?")) return;

    await supabase.from("goal_items").delete().eq("id", itemId);
    fetchGoalItems(); // 목록 갱신
    // 삭제 후 로그 갱신도 필요하면 호출 (간단히 fetchMonthlyLogs 정도)
    fetchMonthlyLogs(currentDate);
  };

  // 6. 투두 체크/해제
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
      if (existing) {
        return prev.map((l) =>
          l.date === dateStr ? { ...l, count: l.count + delta } : l
        );
      }
      return [...prev, { date: dateStr, count: 1 }];
    });
  };

  const getIntensityColor = (dateStr: string) => {
    const log = monthlyLogs.find((l) => l.date === dateStr);
    const count = log ? log.count : 0;
    const total = items.length || 1;
    const ratio = count / total;

    if (ratio === 0) return "#f3f4f6";
    if (ratio <= 0.3) return "#dcfce7";
    if (ratio <= 0.6) return "#86efac";
    if (ratio < 1) return "#4ade80";
    return "#22c55e";
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const calendarDays = eachDayOfInterval({
    start: startOfWeek(monthStart),
    end: endOfWeek(monthEnd),
  });

  return (
    <Container>
      <Header>
        <NavButton onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
          ◀
        </NavButton>
        <MonthTitle>{format(currentDate, "yyyy년 M월")}</MonthTitle>
        <NavButton onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
          ▶
        </NavButton>
      </Header>

      <CalendarGrid>
        {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
          <WeekDay key={day}>{day}</WeekDay>
        ))}
        {calendarDays.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const isSelected = isSameDay(day, selectedDate);
          const isCurrentMonth = isSameMonth(day, monthStart);

          return (
            <DateCell
              key={dateStr}
              $bgColor={getIntensityColor(dateStr)}
              $isCurrentMonth={isCurrentMonth}
              $isSelected={isSelected}
              onClick={() => setSelectedDate(day)}
            >
              <DateText>{format(day, "d")}</DateText>
            </DateCell>
          );
        })}
      </CalendarGrid>

      <DailySection>
        <DailyTitle>
          <span>📅 {format(selectedDate, "M월 d일")}</span>
          <ProgressBadge>
            {Math.round((dailyCompletedIds.length / (items.length || 1)) * 100)}
            %
          </ProgressBadge>
        </DailyTitle>

        <TodoList>
          {items.map((item) => (
            <TodoItem
              key={item.id}
              onClick={() => toggleHabit(item.id)}
              $done={dailyCompletedIds.includes(item.id)}
            >
              <CheckCircle $done={dailyCompletedIds.includes(item.id)}>
                {dailyCompletedIds.includes(item.id) && "✔"}
              </CheckCircle>
              <TodoText $done={dailyCompletedIds.includes(item.id)}>
                {item.title}
              </TodoText>

              {/* ✅ 삭제 버튼 추가 */}
              <DeleteButton onClick={(e) => deleteHabitItem(item.id, e)}>
                🗑️
              </DeleteButton>
            </TodoItem>
          ))}

          <InputWrapper>
            <StyledInput
              placeholder="+ 새로운 목표 추가"
              value={newItemTitle}
              onChange={(e) => setNewItemTitle(e.target.value)}
              onKeyDown={handleKeyDown} // ✅ 수정된 핸들러 연결
            />
            <AddButton onClick={addHabitItem} disabled={!newItemTitle.trim()}>
              추가
            </AddButton>
          </InputWrapper>
        </TodoList>
      </DailySection>
    </Container>
  );
}

// ... 스타일 정의 (기존과 동일하되 DeleteButton 추가) ...
const Container = styled.div`
  width: 100%;
  max-width: 400px;
  background: white;
  border-radius: 24px;
  padding: 1.5rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const MonthTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 800;
  color: #1f2937;
`;

const NavButton = styled.button`
  background: none;
  border: none;
  font-size: 1.2rem;
  color: #9ca3af;
  cursor: pointer;
  padding: 0.5rem;
  &:hover {
    color: #4b5563;
  }
`;

const CalendarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  margin-bottom: 2rem;
`;

const WeekDay = styled.div`
  text-align: center;
  font-size: 0.8rem;
  font-weight: 600;
  color: #9ca3af;
  margin-bottom: 0.5rem;
`;

const DateCell = styled.div<{
  $bgColor: string;
  $isCurrentMonth: boolean;
  $isSelected: boolean;
}>`
  aspect-ratio: 1;
  background-color: ${({ $bgColor }) => $bgColor};
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: ${({ $isCurrentMonth }) => ($isCurrentMonth ? 1 : 0.3)};
  border: 2px solid
    ${({ $isSelected }) => ($isSelected ? "#3b82f6" : "transparent")};
  transition: all 0.2s;
  &:hover {
    transform: scale(1.1);
  }
`;

const DateText = styled.span`
  font-size: 0.85rem;
  font-weight: 600;
  color: #374151;
`;

const DailySection = styled.div`
  border-top: 1px solid #f3f4f6;
  padding-top: 1.5rem;
`;

const DailyTitle = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  font-weight: 700;
  color: #374151;
`;

const ProgressBadge = styled.span`
  background: #eff6ff;
  color: #3b82f6;
  font-size: 0.75rem;
  padding: 4px 8px;
  border-radius: 12px;
  font-weight: 600;
`;

const TodoList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
`;

const TodoItem = styled.div<{ $done: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: ${({ $done }) => ($done ? "#f0fdf4" : "#f9fafb")};
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    background: ${({ $done }) => ($done ? "#dcfce7" : "#f3f4f6")};
  }
`;

const CheckCircle = styled.div<{ $done: boolean }>`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid ${({ $done }) => ($done ? "#22c55e" : "#d1d5db")};
  background: ${({ $done }) => ($done ? "#22c55e" : "transparent")};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
`;

const TodoText = styled.span<{ $done: boolean }>`
  font-weight: 500;
  font-size: 0.95rem;
  color: ${({ $done }) => ($done ? "#15803d" : "#4b5563")};
  text-decoration: ${({ $done }) => ($done ? "line-through" : "none")};
  flex: 1;
`;

// ✅ 삭제 버튼 스타일 추가
const DeleteButton = styled.button`
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

const InputWrapper = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 0.5rem;
`;

const StyledInput = styled.input`
  flex: 1;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  font-size: 0.9rem;
  outline: none;
  &:focus {
    border-color: #3b82f6;
  }
`;

const AddButton = styled.button`
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 12px;
  padding: 0 1rem;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background 0.2s;
  &:hover {
    background: #2563eb;
  }
  &:disabled {
    background: #cbd5e1;
    cursor: not-allowed;
  }
`;
