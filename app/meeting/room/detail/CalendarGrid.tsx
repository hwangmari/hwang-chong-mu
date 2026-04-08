"use client";

import { useState } from "react";
import styled, { css } from "styled-components";
import { format, isSameDay, isSunday } from "date-fns";
import { UserVote } from "@/types";
import { getHolidayName } from "@/utils/holidays";

interface Props {
  dates: (Date | null)[];
  participants: UserVote[];
  currentUnavailable: Date[];
  step: "VOTING" | "CONFIRM";
  currentName: string;
  finalDate: Date | null;
  includeWeekend: boolean;
  onToggleDate: (date: Date) => void;
  hoveredUserId: string | number | null;
}

export default function CalendarGrid({
  dates,
  participants,
  currentUnavailable,
  step,
  currentName,
  finalDate,
  includeWeekend,
  onToggleDate,
  hoveredUserId,
}: Props) {
  const [openTooltipDate, setOpenTooltipDate] = useState<string | null>(null);

  const getUnavailableUsers = (date: Date) =>
    participants.filter((p) =>
      p.unavailableDates.some((ud) => isSameDay(ud, date)),
    );

  const firstDateIndex = dates.findIndex((d) => d !== null);

  const weekDays = includeWeekend
    ? ["일", "월", "화", "수", "목", "금", "토"]
    : ["월", "화", "수", "목", "금"];

  const hoveredUser = participants.find((p) => p.id === hoveredUserId);

  const handleBadgeClick = (e: React.MouseEvent, dateKey: string) => {
    e.stopPropagation(); // 부모 버튼의 클릭 이벤트 전파 중단
    setOpenTooltipDate((prev) => (prev === dateKey ? null : dateKey));
  };

  const closeAllTooltips = () => setOpenTooltipDate(null);

  return (
    <StGridContainer $step={step} onClick={closeAllTooltips}>
      <StWeekHeader $includeWeekend={includeWeekend}>
        {weekDays.map((day) => (
          <StWeekDay key={day}>{day}</StWeekDay>
        ))}
      </StWeekHeader>

      <StDaysGrid $includeWeekend={includeWeekend}>
        {dates.map((date, index) => {
          if (!date) return <div key={`empty-${index}`} />;

          const dateKey = date.toISOString(); // 고유 키 생성
          const unavailableUsers = getUnavailableUsers(date);
          const unavailableCount = unavailableUsers.length;

          const totalParticipants = participants.length;
          const intensity =
            totalParticipants > 0 ? unavailableCount / totalParticipants : 0;

          const isMySelection =
            step === "VOTING" &&
            currentUnavailable.some((d) => isSameDay(d, date));

          const isFinalSelected =
            step === "CONFIRM" && finalDate && isSameDay(finalDate, date);

          const isBestDate = step === "CONFIRM" && unavailableCount === 0;
          const isHoveredDate = hoveredUser?.unavailableDates.some((ud) =>
            isSameDay(ud, date),
          );

          const isTypingMode = step === "VOTING" && currentName.length > 0;
          const baseColor = isTypingMode ? "209, 213, 219" : "251, 113, 133";
          const dynamicBg = `rgba(${baseColor}, ${intensity * 0.9})`;

          const dayString = format(date, "d");
          const showMonth = dayString === "1" || index === firstDateIndex;

          const isTooltipOpen = openTooltipDate === dateKey;
          const holidayName = getHolidayName(date);
          const isSun = isSunday(date);

          return (
            <StDateButton
              key={dateKey}
              onClick={() => onToggleDate(date)}
              $isMySelection={isMySelection}
              $isFinalSelected={!!isFinalSelected}
              $isBestDate={isBestDate}
              $dynamicBg={dynamicBg}
              $unavailableCount={unavailableCount}
              $isHoveredDate={!!isHoveredDate}
              $isHoliday={!!holidayName || isSun}
            >
              <StDateText>
                {showMonth && (
                  <StMonthLabel>{format(date, "M월")}</StMonthLabel>
                )}
                {dayString}
              </StDateText>
              {holidayName && (
                <StHolidayLabel>{holidayName}</StHolidayLabel>
              )}

              {/* 툴팁 및 배지 영역 */}
              {!isFinalSelected && unavailableCount > 0 && (
                <StBadgeGroup
                  onClick={(e) => handleBadgeClick(e, dateKey)} // 클릭 이벤트 연결
                >
                  <StCountBadge $isTypingMode={isTypingMode}>
                    {unavailableCount}
                  </StCountBadge>

                  {/* Typing 모드가 아닐 때만 툴팁 표시 가능 */}
                  {!isTypingMode && (
                    <StTooltip $isOpen={isTooltipOpen}>
                      {unavailableUsers.map((user) => (
                        <div key={user.id}>{user.name}</div>
                      ))}
                    </StTooltip>
                  )}
                </StBadgeGroup>
              )}

              {step === "CONFIRM" &&
                unavailableCount === 0 &&
                !isFinalSelected && <StRecommendBadge>추천👍</StRecommendBadge>}
            </StDateButton>
          );
        })}
      </StDaysGrid>
    </StGridContainer>
  );
}

const StGridContainer = styled.div<{ $step: "VOTING" | "CONFIRM" }>`
  width: 100%;
  background-color: ${({ theme }) => theme.colors.white};
  padding: 1rem;
  border-radius: 1rem;
  border: 2px solid;
  margin-bottom: 1.5rem;
  transition:
    border-color 0.3s,
    box-shadow 0.3s;

  ${({ $step, theme }) =>
    $step === "CONFIRM"
      ? css`
          border-color: ${theme.colors.gray900};
          box-shadow: 0 4px 6px -1px rgba(209, 213, 219, 0.5);
        `
      : css`
          border-color: ${theme.colors.gray100};
        `}

  @media ${({ theme }) => theme.media.desktop} {
    padding: 1.5rem;
  }
`;

const gridLayout = css<{ $includeWeekend: boolean }>`
  display: grid;
  grid-template-columns: ${({ $includeWeekend }) =>
    $includeWeekend ? "repeat(7, 1fr)" : "repeat(5, 1fr)"};
  gap: 0.75rem;
`;

const StWeekHeader = styled.div<{ $includeWeekend: boolean }>`
  ${gridLayout}
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray100};
`;

const StWeekDay = styled.div`
  text-align: center;
  font-size: 0.75rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray400};

  @media ${({ theme }) => theme.media.desktop} {
    font-size: 0.875rem;
  }
`;

const StDaysGrid = styled.div<{ $includeWeekend: boolean }>`
  ${gridLayout}
`;

const StDateButton = styled.button<{
  $isMySelection: boolean;
  $isFinalSelected: boolean;
  $isBestDate: boolean;
  $dynamicBg: string;
  $unavailableCount: number;
  $isHoveredDate: boolean;
  $isHoliday: boolean;
}>`
  position: relative;
  aspect-ratio: 1 / 1;
  border-radius: 0.75rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  border: 1px solid transparent;

  background-color: ${({
    $isFinalSelected,
    $isMySelection,
    $dynamicBg,
    theme,
  }) => {
    if ($isFinalSelected) return theme.colors.gray900;
    if ($isMySelection) return theme.colors.white;
    return $dynamicBg;
  }};

  color: ${({ $isFinalSelected, $isMySelection, $unavailableCount, $isHoliday, theme }) => {
    if ($isFinalSelected) return theme.colors.white;
    if ($isMySelection) return theme.colors.black;
    if ($unavailableCount > 0) return theme.colors.white;
    if ($isHoliday) return "#ef4444";
    return theme.colors.gray500;
  }};

  ${({ $isHoveredDate }) =>
    $isHoveredDate &&
    css`
      transform: scale(1.05);
      z-index: 15;
      border: 1px solid #000;
      box-shadow: 0 4px 6px rgba(59, 59, 59, 0.4);
    `}

  ${({ $isMySelection, theme }) =>
    $isMySelection &&
    css`
      border: 2px solid ${theme.colors.black};
      z-index: 10;
    `}

  ${({ $isFinalSelected, theme }) =>
    $isFinalSelected &&
    css`
      border: 1px solid ${theme.colors.gray900};
      transform: scale(1.1);
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      z-index: 20;
    `}

  ${({ $isBestDate, $isFinalSelected, theme }) =>
    $isBestDate &&
    !$isFinalSelected &&
    css`
      box-shadow: 0 0 0 2px ${theme.colors.gray400};
    `}

  @media ${({ theme }) => theme.media.desktop} {
    border-radius: 1rem;
  }
`;

const StDateText = styled.span`
  font-size: 0.875rem;
  font-weight: 700;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;

  @media ${({ theme }) => theme.media.desktop} {
    font-size: 1rem;
  }
`;

const StMonthLabel = styled.span`
  position: absolute;
  top: -0.8rem;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.625rem;
  line-height: 1;
  white-space: nowrap;

  @media ${({ theme }) => theme.media.desktop} {
    top: -1rem;
    font-size: 0.75rem;
  }
`;

const StHolidayLabel = styled.span`
  position: absolute;
  bottom: 0.125rem;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.3125rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray400};
  line-height: 1;
  white-space: nowrap;

  @media ${({ theme }) => theme.media.desktop} {
    bottom: 0.25rem;
    font-size: 0.4375rem;
  }
`;

const StBadgeGroup = styled.div`
  position: absolute;
  top: -0.25rem;
  right: -0.25rem;
  z-index: 25;
  cursor: pointer; /* 클릭 가능 표시 */

  &:hover > div:last-child {
    display: block;
    opacity: 1;
  }
`;

const StCountBadge = styled.div<{ $isTypingMode: boolean }>`
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.white};
  font-size: 0.5625rem;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);

  background-color: ${({ $isTypingMode, theme }) =>
    $isTypingMode ? theme.colors.gray400 : "#fb7185"};

  @media ${({ theme }) => theme.media.desktop} {
    font-size: 0.625rem;
  }
`;

const StTooltip = styled.div<{ $isOpen: boolean }>`
  display: ${({ $isOpen }) => ($isOpen ? "block" : "none")};
  opacity: ${({ $isOpen }) => ($isOpen ? 1 : 0)};

  position: absolute;
  bottom: 120%; /* 뱃지 위쪽에 표시 */
  left: 50%;
  transform: translateX(-50%);

  background-color: rgba(31, 41, 55, 0.95); /* gray-800 */
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.65rem;
  white-space: nowrap;
  pointer-events: none; /* 툴팁 자체는 클릭 방해 X */
  transition: opacity 0.2s;

  &::after {
    content: "";
    position: absolute;
    top: 100%;
    left: 50%;
    margin-left: -4px;
    border-width: 4px;
    border-style: solid;
    border-color: rgba(31, 41, 55, 0.95) transparent transparent transparent;
  }

  @media ${({ theme }) => theme.media.desktop} {
    font-size: 0.75rem;
    padding: 0.375rem 0.625rem;
  }
`;

const StRecommendBadge = styled.span`
  position: absolute;
  top: -0.5rem;
  left: 50%;
  transform: translateX(-50%);
  background-color: ${({ theme }) => theme.colors.gray800};
  color: ${({ theme }) => theme.colors.white};
  font-size: 0.5rem;
  padding: 0.125rem 0.375rem;
  border-radius: 9999px;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  z-index: 30;
  white-space: nowrap;

  @media ${({ theme }) => theme.media.desktop} {
    font-size: 0.5625rem;
  }
`;
