"use client";

import styled from "styled-components";
import { format, addMonths, subMonths } from "date-fns";
import { useMonthlyTracker } from "./useMonthlyTracker";
import CalendarGrid from "./CalendarGrid";
import TodoList from "./TodoList";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";

interface Props {
  goalId: number;
  themeColor: string;
}

export default function MonthlyTracker({ goalId, themeColor }: Props) {
  const { state, actions } = useMonthlyTracker(goalId);
  // ✅ [수정] state에서 hoveredItemId, rawLogs 구조분해 할당
  const {
    currentDate,
    selectedDate,
    showWeekends,
    items,
    monthlyLogs,
    dailyCompletedIds,
    hoveredItemId,
    rawLogs,
  } = state;

  return (
    <StContainer>
      <StHeaderWrapper>
        <StHeader>
          <StNavButton
            onClick={() => actions.setCurrentDate(subMonths(currentDate, 1))}
          >
            <ArrowBackIosIcon />
          </StNavButton>
          <StMonthTitle>{format(currentDate, "yyyy년 M월")}</StMonthTitle>
          <StNavButton
            onClick={() => actions.setCurrentDate(addMonths(currentDate, 1))}
          >
            <ArrowForwardIosIcon />
          </StNavButton>
        </StHeader>
        <StWeekendToggle
          onClick={actions.toggleWeekends}
          $active={showWeekends}
          $color={themeColor}
        >
          {showWeekends ? "주말 끄기" : "주말 보기"}
        </StWeekendToggle>
      </StHeaderWrapper>

      {/* 📅 달력 */}
      <CalendarGrid
        currentDate={currentDate}
        selectedDate={selectedDate}
        showWeekends={showWeekends}
        themeColor={themeColor}
        monthlyLogs={monthlyLogs}
        totalItemsCount={items.length}
        onSelectDate={actions.setSelectedDate}
        // ✅ [추가] 달력에 호버 정보 전달
        hoveredItemId={hoveredItemId}
        rawLogs={rawLogs}
      />

      {/* ✅ 할 일 목록 */}
      <TodoList
        selectedDate={selectedDate}
        items={items}
        completedIds={dailyCompletedIds}
        themeColor={themeColor}
        onToggle={actions.toggleComplete}
        onDelete={actions.deleteItem}
        onAdd={actions.addItem}
        // ✅ [추가] 리스트에 호버 핸들러 전달
        onHoverItem={actions.setHoveredItemId}
      />
    </StContainer>
  );
}

// ... (스타일은 그대로 유지)
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
  width: 120px;
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
