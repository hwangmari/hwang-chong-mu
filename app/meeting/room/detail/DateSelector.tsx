"use client";

import { useState, useMemo } from "react";
import styled, { css } from "styled-components";
import { eachDayOfInterval, addWeeks, isSameDay } from "date-fns";

const DateSelector = () => {
  /** 1. 3주치 날짜 생성 */
  const today = new Date();
  const threeWeeksLater = addWeeks(today, 3);
  const allDates = useMemo(
    () => eachDayOfInterval({ start: today, end: threeWeeksLater }),
    [today, threeWeeksLater]
  );

  /** 2. 선택된 날짜들을 담는 배열 */
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);

  const handleSelectAll = () => setSelectedDates(allDates);
  const handleDeselectAll = () => setSelectedDates([]);

  /** 날짜 토글 함수 */
  const toggleDate = (date: Date) => {
    const isSelected = selectedDates.some((d) => isSameDay(d, date));
    if (isSelected) {
      setSelectedDates((prev) => prev.filter((d) => !isSameDay(d, date)));
    } else {
      setSelectedDates((prev) => [...prev, date]);
    }
  };

  return (
    <StContainer>
      {/* 상단 컨트롤 버튼 */}
      <StControlGroup>
        <StControlButton onClick={handleSelectAll} $variant="blue">
          🙆‍♂️ 다 돼요! (전체 선택)
        </StControlButton>
        <StControlButton onClick={handleDeselectAll} $variant="gray">
          🙅‍♂️ 싹 비우기 (초기화)
        </StControlButton>
      </StControlGroup>

      {/* 달력 그리드 */}
      <StCalendarGrid>
        {allDates.map((date) => {
          const isSelected = selectedDates.some((d) => isSameDay(d, date));
          return (
            <StDateButton
              key={date.toString()}
              onClick={() => toggleDate(date)}
              $isSelected={isSelected}
            >
              {date.getDate()}
            </StDateButton>
          );
        })}
      </StCalendarGrid>
    </StContainer>
  );
};

export default DateSelector;


const StContainer = styled.div`
  width: 100%;
`;

const StControlGroup = styled.div`
  display: flex;
  gap: 0.5rem; /* gap-2 */
  margin-bottom: 1rem; /* mb-4 */
`;

const StControlButton = styled.button<{ $variant: "blue" | "gray" }>`
  padding: 0.25rem 0.75rem; /* px-3 py-1 */
  border-radius: 9999px; /* rounded-full */
  font-size: 0.875rem; /* text-sm */
  font-weight: 700; /* font-bold */
  transition: background-color 0.2s;

  ${({ $variant, theme }) =>
    $variant === "blue"
      ? css`
          background-color: #dbeafe; /* blue-100 */
          color: #1d4ed8; /* blue-700 */
          &:hover {
            background-color: #bfdbfe; /* blue-200 */
          }
        `
      : css`
          background-color: ${theme.colors.gray100};
          color: ${theme.colors.gray600};
          &:hover {
            background-color: ${theme.colors.gray200};
          }
        `}
`;

const StCalendarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr); /* grid-cols-7 */
  gap: 0.5rem; /* gap-2 */
`;

const StDateButton = styled.button<{ $isSelected: boolean }>`
  padding: 0.5rem; /* p-2 */
  border-radius: 0.5rem; /* rounded-lg */
  transition: all 0.2s;
  font-weight: 500;

  ${({ $isSelected, theme }) =>
    $isSelected
      ? css`
          background-color: #3b82f6; /* blue-500 */
          color: ${theme.colors.white};
        `
      : css`
          background-color: ${theme.colors.gray50};
          color: ${theme.colors.gray400};

          &:hover {
            background-color: ${theme.colors.gray100};
          }
        `}
`;
