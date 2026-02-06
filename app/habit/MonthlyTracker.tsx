"use client";

import { useState } from "react"; // ✅ useState 추가
import styled from "styled-components";
import { format, addMonths, subMonths } from "date-fns";
import { useMonthlyTracker } from "./useMonthlyTracker";
import CalendarGrid from "./CalendarGrid";
import TodoList from "./TodoList";
import HabitRanking from "./HabitRanking";
import CommentSection from "./CommentSection"; // (이전 단계에서 추가한 댓글 컴포넌트)

import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import UnfoldLessIcon from "@mui/icons-material/UnfoldLess";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";

import EmojiEventsIcon from "@mui/icons-material/EmojiEvents"; // 🏆 트로피 아이콘 추가
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown"; // 🔽 화살표 아이콘 추가
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp"; // 🔼 화살표 아이콘 추가

import { StFlexBox, StSection } from "@/components/styled/layout.styled";

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
  const [showRanking, setShowRanking] = useState(false);
  return (
    <StFlexBox>
      <div className="flex-lft-box">
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
                  <StMonthTitle>
                    {format(currentDate, "yyyy년 M월")}
                  </StMonthTitle>
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
              }}
              hoveredItemId={hoveredItemId}
              rawLogs={rawLogs}
              isExpanded={isExpanded}
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
      </div>
      <div className="flex-rgt-box">
        <CommentSection
          goalId={goalId}
          themeColor={themeColor}
          selectedDate={selectedDate}
        />

        {/* ✅ 순위 보기 버튼 & 랭킹 컴포넌트 */}
        <StRankingSection>
          <StRankingToggleButton
            onClick={() => setShowRanking(!showRanking)}
            $isOpen={showRanking}
          >
            <div className="btn-content">
              🏆
              <span>
                {showRanking
                  ? "명예의 전당 접기"
                  : `${format(currentDate, "M월")} 순위 보기`}
              </span>
            </div>
            {showRanking ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </StRankingToggleButton>

          {/* showRanking이 true일 때만 표시 */}
          {showRanking && (
            <StRankingWrapper>
              <HabitRanking
                items={items}
                rawLogs={rawLogs}
                themeColor={themeColor}
              />
            </StRankingWrapper>
          )}
        </StRankingSection>
      </div>
    </StFlexBox>
  );
}


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

const StRankingSection = styled.div`
  margin-top: 1.5rem;
  border-top: 1px solid #f1f5f9;
  padding-top: 1rem;
`;

const StRankingToggleButton = styled.button<{ $isOpen: boolean }>`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: ${({ $isOpen }) => ($isOpen ? "#f8fafc" : "white")};
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  color: #475569;
  font-weight: 600;

  &:hover {
    background-color: #f1f5f9;
    transform: translateY(-1px);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  }

  .btn-content {
    display: flex;
    align-items: center;
    gap: 8px;
  }
`;

const StRankingWrapper = styled.div`
  margin-top: 10px;
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
