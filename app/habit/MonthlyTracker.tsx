"use client";

import { useState } from "react"; // ✅ useState 추가
import styled from "styled-components";
import { format, addMonths, subMonths } from "date-fns";
import { useMonthlyTracker } from "./useMonthlyTracker";
import CalendarGrid from "./CalendarGrid";
import TodoList from "./TodoList";
import CommentSection from "./CommentSection"; // (이전 단계에서 추가한 댓글 컴포넌트)

// 아이콘 추가
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import UnfoldLessIcon from "@mui/icons-material/UnfoldLess";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";

import { StSection } from "@/components/styled/layout.styled";

interface Props {
  goalId: number;
  themeColor: string;
}

export default function MonthlyTracker({ goalId, themeColor }: Props) {
  const { state, actions } = useMonthlyTracker(goalId);
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

  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      <StSection>
        {/* ✅ [추가] 달력 토글 헤더 */}
        <StToggleHeader onClick={() => setIsExpanded(!isExpanded)}>
          <StToggleTitle>
            <CalendarMonthIcon sx={{ color: themeColor }} />
            <span>
              {isExpanded ? "주간만 보기 (접기)" : "월간 전체 보기 (펼치기)"}
            </span>
          </StToggleTitle>
          <StToggleIconWrapper>
            {isExpanded ? <UnfoldLessIcon /> : <UnfoldMoreIcon />}
          </StToggleIconWrapper>
        </StToggleHeader>

        {/* ✅ 달력 영역: 항상 렌더링하되 isExpanded prop 전달 */}
        <StCalendarArea>
          {/* 월간 보기일 때만 '월 이동 버튼' 표시 (주간일 땐 굳이 필요 없음) */}
          {isExpanded && (
            <StHeaderWrapper>
              <StHeader>
                <StNavButton
                  onClick={() =>
                    actions.setCurrentDate(subMonths(currentDate, 1))
                  }
                >
                  <ArrowBackIosIcon sx={{ fontSize: 18 }} />
                </StNavButton>
                <StMonthTitle>{format(currentDate, "yyyy년 M월")}</StMonthTitle>
                <StNavButton
                  onClick={() =>
                    actions.setCurrentDate(addMonths(currentDate, 1))
                  }
                >
                  <ArrowForwardIosIcon sx={{ fontSize: 18 }} />
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
          )}

          <CalendarGrid
            currentDate={currentDate}
            selectedDate={selectedDate}
            showWeekends={showWeekends}
            themeColor={themeColor}
            monthlyLogs={monthlyLogs}
            totalItemsCount={items.length}
            onSelectDate={(date) => {
              actions.setSelectedDate(date);
              // 날짜 선택 시 자동으로 접고 싶으면 아래 주석 해제
              // setIsExpanded(false);
            }}
            hoveredItemId={hoveredItemId}
            rawLogs={rawLogs}
            isExpanded={isExpanded} // ✅ 상태 전달
          />
        </StCalendarArea>

        {/* ✅ 할 일 목록 (항상 보임) */}
        <TodoList
          selectedDate={selectedDate}
          items={items}
          completedIds={dailyCompletedIds}
          themeColor={themeColor}
          onToggle={actions.toggleComplete}
          onDelete={actions.deleteItem}
          onAdd={actions.addItem}
          onHoverItem={actions.setHoveredItemId}
        />
      </StSection>

      <CommentSection
        goalId={goalId}
        themeColor={themeColor}
        selectedDate={selectedDate}
      />
    </>
  );
}

// ✨ 스타일 정의

// 토글 버튼 영역
const StToggleHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  cursor: pointer;
  color: #64748b;
  transition: all 0.2s;
  border-radius: 6px;
  margin: 0 -0.5rem 1rem;

  &:hover {
    background-color: #f8fafc;
    color: #334155;
  }
`;

const StToggleTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.95rem;
  font-weight: 700;
`;

const StToggleIconWrapper = styled.div`
  display: flex;
  align-items: center;
`;

// 달력 전체 영역 (애니메이션을 원하면 max-height transition 추가 가능)
const StCalendarArea = styled.div`
  margin-bottom: 1.5rem;
  animation: slideDown 0.3s ease-out;

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const StDivider = styled.hr`
  border: none;
  border-top: 1px dashed #e2e8f0;
  margin: 1rem 0 1.5rem 0;
`;

// ... (기존 스타일 유지)
const StHeaderWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding: 0 0.5rem;
`;
const StHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;
const StMonthTitle = styled.h2`
  font-size: 1.1rem;
  font-weight: 800;
  color: #1f2937;
  width: 110px;
  text-align: center;
`;
const StWeekendToggle = styled.button<{ $active: boolean; $color: string }>`
  background: ${({ $active, $color }) => ($active ? $color : "transparent")};
  color: ${({ $active, $color }) => ($active ? "white" : "#9ca3af")};
  border: 1px solid
    ${({ $active, $color }) => ($active ? "transparent" : "#e5e7eb")};
  padding: 4px 10px;
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
  display: flex; /* 아이콘 수직 정렬용 */
  &:hover {
    color: #4b5563;
  }
`;
